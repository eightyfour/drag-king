const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { once } = require('node:events');
const WebSocket = require('ws');
const fileHandler = require('../server/lib/fileHandler');
const wsConnection = require('../server/lib/wsConnection');
const main = require('../main');
const auth = require('../server/lib/auth');
const md5 = require('md5');
const sharp = require('sharp');
const thumbnail = require('../lib/thumbNail');

async function fixture(t) {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'drag-king-test-'));
    t.after(async () => {
        await new Promise((resolve) => setTimeout(resolve, 1100));
        await fs.rm(root, { recursive: true, force: true });
    });
    return root;
}

test('file storage creates folders and preserves JSON history fields', async (t) => {
    const root = await fixture(t);
    await fileHandler.saveFile(root, '/nested/description.html', 'hello');
    assert.equal(await fs.readFile(path.join(root, 'nested/description.html'), 'utf8'), 'hello');
    await fileHandler.saveJSON(root, '/nested/config.json', { a: 1 });
    await fileHandler.saveJSON(root, '/nested/config.json', { b: 2 });
    assert.deepEqual(JSON.parse(await fs.readFile(path.join(root, 'nested/config.json'))), { a: 1, b: 2 });
    assert.equal(await fileHandler.getModuleConfigFromJSON(root, '/missing.json'), false);
    await assert.rejects(fileHandler.saveFile(root, '/../escape', 'no'), { code: 'INVALID_PATH' });
});

test('thumbnails are resized and removed without external image tools', async (t) => {
    const root = await fixture(t);
    const image = path.join(root, 'image.png');
    await sharp({ create: { width: 400, height: 100, channels: 3, background: 'red' } })
        .png().toFile(image);
    const thumbnails = thumbnail();
    const generated = await thumbnails.create(image);
    assert.equal((await sharp(generated).metadata()).width, 200);
    assert.equal(await thumbnails.create(image), generated);
    await thumbnails.remove(image);
    await assert.rejects(fs.stat(generated), { code: 'ENOENT' });
});

test('thumbnails apply EXIF orientation before resizing', async (t) => {
    const root = await fixture(t);
    const image = path.join(root, 'rotated.jpg');
    await sharp({ create: { width: 400, height: 100, channels: 3, background: 'red' } })
        .jpeg().withMetadata({ orientation: 6 }).toFile(image);
    assert.equal((await sharp(image).metadata()).orientation, 6);
    const oldThumbnail = path.join(root, 'tmb_rotated.jpg');
    await sharp(image).resize({ width: 200, withoutEnlargement: true }).toFile(oldThumbnail);

    const generated = await thumbnail().create(image);
    const metadata = await sharp(generated).metadata();
    assert.equal(metadata.width, 100);
    assert.equal(metadata.height, 400);
    assert.ok(metadata.orientation === undefined || metadata.orientation === 1);
    assert.notEqual(generated, oldThumbnail);
    await assert.rejects(fs.stat(oldThumbnail), { code: 'ENOENT' });
    await fs.writeFile(oldThumbnail, 'old cache');
    await thumbnail().remove(image);
    await assert.rejects(fs.stat(generated), { code: 'ENOENT' });
    await assert.rejects(fs.stat(oldThumbnail), { code: 'ENOENT' });
});

test('RPC preserves operations and denies unauthorized writes', async (t) => {
    const root = await fixture(t);
    const handler = wsConnection.createHandler({ dirName: root, auth: true }, { authId: 'admin', isAdmin: true });
    await handler('saveFile', ['/item.txt', 'hello']);
    assert.equal(await fs.readFile(path.join(root, 'item.txt'), 'utf8'), 'hello');
    assert.deepEqual(await handler('copy', ['/item.txt', '/copy.txt']), { from: '/item.txt', to: '/copy.txt' });
    assert.deepEqual(await handler('move', ['/copy.txt', '/nested/moved.txt']),
        { from: '/copy.txt', to: '/nested/moved.txt' });
    assert.equal(await fs.readFile(path.join(root, 'nested/moved.txt'), 'utf8'), 'hello');
    await handler('copy', ['/nested/moved.txt', '/copy.txt']);
    assert.deepEqual(await handler('remove', ['/copy.txt']), { file: '/copy.txt' });
    await assert.rejects(handler('copy', ['/item.txt', '/../outside']), { code: 'INVALID_PATH' });
    const visitor = wsConnection.createHandler({ dirName: root, auth: true }, {});
    await assert.rejects(visitor('saveFile', ['/item.txt', 'changed']), { code: 'FORBIDDEN' });
    await assert.rejects(visitor('remove', ['/item.txt']), { code: 'FORBIDDEN' });
    const maintainer = wsConnection.createHandler({ dirName: root, auth: true },
        { authId: 'maintainer', isMaintainer: true });
    await assert.rejects(maintainer('saveFile', ['/config.json', '{}']), { code: 'FORBIDDEN' });
    await maintainer('remove', ['/item.txt']);
    assert.ok((await fs.readdir(root)).some((file) => file.startsWith('.item.txt-')));
    await assert.rejects(fs.stat(path.join(root, 'item.txt')), { code: 'ENOENT' });
    await handler('saveFile', ['/item.txt', 'hello']);
    assert.equal(await fs.readFile(path.join(root, 'item.txt'), 'utf8'), 'hello');
});

test('WebSocket protocol returns correlated results and explicit errors', async (t) => {
    const root = await fixture(t);
    const server = http.createServer();
    const sockets = wsConnection(server, { dirName: root, auth: true, secret: 'test-secret' });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    let client;
    t.after(async () => {
        client?.close();
        await new Promise((resolve) => sockets.close(resolve));
        await new Promise((resolve) => server.close(resolve));
    });

    client = new WebSocket(`ws://127.0.0.1:${server.address().port}/ws`);
    await once(client, 'open');
    client.send(JSON.stringify({ id: 1, method: 'init', args: ['/'] }));
    assert.deepEqual(JSON.parse((await once(client, 'message'))[0]), {
        id: 1, result: { path: '/', user: {
            name: 'anonymous', authId: 'anonymous', isAdmin: false, isMaintainer: false, alias: 'goat'
        } }
    });
    client.send(JSON.stringify({ id: 2, method: 'saveFile', args: ['/file', 'content'] }));
    const denied = JSON.parse((await once(client, 'message'))[0]);
    assert.equal(denied.id, 2);
    assert.equal(denied.error.code, 'FORBIDDEN');
});

test('HTTP login, file API and authenticated WebSocket work together', async (t) => {
    const root = await fixture(t);
    await fs.writeFile(path.join(root, '.allowedUsers.json'), JSON.stringify({
        admin: { pw: md5('password'), fullName: 'Admin' }
    }));
    await fs.writeFile(path.join(root, '.user-permission.json'), JSON.stringify({
        admins: ['admin'], maintainers: []
    }));
    const app = main({
        dirName: path.join(__dirname, '..'),
        fileStorageName: root,
        port: 0,
        secret: 'integration-secret'
    }, {
        phase1(app) {
            auth(app, { rootDir: root, secret: 'integration-secret', sessionTimeout: 3600000 });
        }
    });
    const server = app.locals.server;
    await once(server, 'listening');
    let client;
    t.after(async () => {
        client?.close();
        await new Promise((resolve) => server.close(resolve));
    });
    const base = `http://127.0.0.1:${server.address().port}`;
    const page = await fetch(base + '/');
    assert.match(await page.text(), /please authenticate first/);
    assert.equal((await fetch(base + '/.allowedUsers.json')).status, 404);
    const login = await fetch(base + '/login', {
        method: 'POST',
        redirect: 'manual',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username: 'admin', password: 'password' })
    });
    assert.equal(login.status, 302);
    const cookie = login.headers.get('set-cookie').split(';')[0];
    const upload = new FormData();
    upload.append('myFile', new Blob(['content']), 'file.txt');
    const uploaded = await fetch(base + '/uploadFile?folder=%2F', {
        method: 'POST', headers: { cookie }, body: upload
    });
    assert.equal(uploaded.status, 200);
    assert.deepEqual(await uploaded.json(), { file: '/file.txt', name: 'file.txt', type: 'txt' });
    const files = await fetch(base + '/getFiles', { method: 'POST', body: '/' });
    assert.ok((await files.json()).some((file) => file.name === 'file.txt'));
    client = new WebSocket(base.replace('http:', 'ws:') + '/ws', { headers: { cookie } });
    await once(client, 'open');
    client.send(JSON.stringify({ id: 1, method: 'rename', args: ['/file.txt', '/renamed.txt'] }));
    assert.deepEqual(JSON.parse((await once(client, 'message'))[0]).result,
        { from: '/file.txt', to: '/renamed.txt' });
    const deleted = await fetch(base + '/deleteFile?filename=%2Frenamed.txt', {
        method: 'POST', headers: { cookie }
    });
    assert.equal(deleted.status, 200);
    await assert.rejects(fs.stat(path.join(root, 'renamed.txt')), { code: 'ENOENT' });
    const logout = await fetch(base + '/logout', { method: 'POST', headers: { cookie } });
    assert.equal(logout.status, 200);
    client.send(JSON.stringify({ id: 2, method: 'saveFile', args: ['/after-logout.txt', 'no'] }));
    assert.equal(JSON.parse((await once(client, 'message'))[0]).error.code, 'FORBIDDEN');
});

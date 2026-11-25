const fs = require('node:fs/promises');
const path = require('node:path');
const { pipeline } = require('node:stream/promises');
const express = require('express');
const busboy = require('connect-busboy');
const cookieParser = require('cookie-parser');
const folderUtil = require('./lib/folderUtil');
const fileHandler = require('./server/lib/fileHandler');
const history = require('./server/lib/changeHistoryLogger');
const thumbnail = require('./lib/thumbNail');
const wsConnection = require('./server/lib/wsConnection');
const config = require('./package.json').config;

const imageExtensions = new Set(['jpeg', 'jpg', 'png', 'gif']);
function fileInfo(folder, name) {
    const extension = name.split('.').pop();
    return {
        file: folder + name,
        name,
        type: imageExtensions.has(extension.toLowerCase()) ? 'image/jpg' : extension
    };
}

function route(handler) {
    return (req, res, next) => Promise.resolve().then(() => handler(req, res)).catch(next);
}

/**
 * Creates and starts the dragKing server.
 *
 * Authentication is provided in `lifecycle.phase1`, either with the bundled
 * `server/lib/auth` module or an external middleware that populates `req.session`
 * (`authId`, `isAdmin`, `isMaintainer`) and uses the `translatron_session` cookie.
 *
 * @param {object} opts
 * @param {string} opts.dirName - application directory containing index.html, auth.html and dist/
 * @param {string} opts.fileStorageName - path to store the files
 * @param {number} opts.port
 * @param {string} opts.secret - cookie secret used to read the session cookie
 * @param {string} [opts.sessionStoragePath] - folder of `<sid>.json` session files written by an external session store
 * @param {string} [opts.fourOFourFile] - custom 404 page
 * @param {boolean} [opts.requireAuth] - enforce login and permissions (default: `config.auth` from package.json)
 * @param {boolean} [opts.auth] - legacy flag for external auth handling; it does not disable access control
 * @param {object} [lifecycle]
 * @param {function} [lifecycle.phase1] - called with the express app before the file routes are attached
 * @param {function} [lifecycle.fileFilter]
 * @param {function} [lifecycle.onUploadFile]
 * @param {function} [lifecycle.onDeleteFile]
 * @returns {import('express').Express}
 */
function main(opts, lifecycle = {}) {
    const app = express();
    const root = path.resolve(opts.fileStorageName);
    const authenticationEnabled = opts.requireAuth ?? config.auth;
    const thumbnails = thumbnail();
    const serve = (file, res) => res.sendFile(file, { dotfiles: 'allow' });
    app.use(busboy());
    app.use('/dist', express.static(path.join(opts.dirName, 'dist')));
    app.use('/files', express.static(root));
    app.use('/_/', require('./server/lib/router/ls')(root));
    app.use(express.urlencoded({ extended: false }));
    app.use(cookieParser());
    if (lifecycle.phase1) lifecycle.phase1(app);

    app.get('*', route(async (req, res) => {
        if (['.allowedUsers.json', '.user-permission.json'].includes(path.basename(req.path))) {
            return res.sendStatus(404);
        }
        if (authenticationEnabled && !req.path.includes('.') && !req.session?.authId) {
            return serve(path.join(opts.dirName, 'auth.html'), res);
        }
        let file;
        try {
            file = fileHandler.resolveFile(root, decodeURI(req.path));
        } catch (error) {
            if (error.code === 'INVALID_PATH' || error instanceof URIError) return res.sendStatus(400);
            throw error;
        }
        try {
            const stat = await fs.stat(file);
            if (stat.isDirectory()) return serve(path.join(opts.dirName, 'index.html'), res);
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            if (Object.hasOwn(req.query, 'tmb')) {
                try {
                    file = await thumbnails.create(file);
                } catch (error) {
                    console.error('Thumbnail generation failed:', error);
                }
            }
            return serve(file, res);
        } catch (error) {
            if (error.code !== 'ENOENT') throw error;
            if (path.basename(req.path).includes('.') && !req.query.folder) {
                res.status(404);
                return serve(opts.fourOFourFile || path.join(__dirname, '404.html'), res);
            }
            return serve(path.join(opts.dirName, 'index.html'), res);
        }
    }));

    function canWrite(req, res, next) {
        if (!authenticationEnabled || req.session?.isAdmin) return next();
        if (req.session?.isMaintainer && !/\.json$/i.test(req.query.filename || '')) return next();
        res.status(401).send('Not authorized');
    }
    function canDelete(req, res, next) {
        if (!authenticationEnabled || req.session?.isAdmin ||
            (req.session?.isMaintainer && !path.basename(req.query.filename || '').startsWith('.'))) return next();
        res.status(403).send('Forbidden');
    }

    app.post('/uploadFile', canWrite, route(async (req, res) => {
        const folder = folderUtil.formatFolder(req.query.folder);
        await folderUtil.createFolder(root, folder);
        await new Promise((resolve, reject) => {
            let upload;
            req.busboy.on('file', (field, stream, filename) => {
                if (upload) {
                    stream.resume();
                    return;
                }
                const name = typeof filename === 'string' ? filename : filename.filename;
                if (!name || name !== path.basename(name) || name === '.' || name === '..') {
                    stream.resume();
                    reject(Object.assign(new Error('Invalid filename'), { status: 400 }));
                    return;
                }
                upload = pipeline(stream, require('node:fs').createWriteStream(
                    fileHandler.resolveFile(root, folder + name)));
                upload.then(() => {
                    history.write(root, folder + name, 'upload', req.session?.authId || 'anonymous');
                    if (lifecycle.onUploadFile) lifecycle.onUploadFile(req, { rootFolder: root, fileName: folder + name });
                    res.json(fileInfo(folder, name));
                    resolve();
                }, reject);
            });
            req.busboy.on('close', () => {
                if (!upload) reject(Object.assign(new Error('No file provided'), { status: 400 }));
            });
            req.busboy.on('error', reject);
            req.pipe(req.busboy);
        });
    }));

    async function readFolder(req) {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        return folderUtil.formatFolder(Buffer.concat(chunks).toString('utf8'));
    }

    app.post('/getFiles', route(async (req, res) => {
        const folder = await readFolder(req);
        const dir = fileHandler.resolveFile(root, folder);
        const entries = await fs.readdir(dir, { withFileTypes: true });
        const files = entries.filter((entry) => entry.isFile() && !entry.name.startsWith('tmb_'))
            .map((entry) => entry.name).filter(lifecycle.fileFilter || (() => true));
        res.json(files.map((file) => fileInfo(folder, file)));
    }));

    app.post('/getFolders', route(async (req, res) => {
        const folder = await readFolder(req);
        const entries = await fs.readdir(fileHandler.resolveFile(root, folder), { withFileTypes: true });
        res.json(entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name));
    }));

    app.post('/deleteFile', canDelete, route(async (req, res) => {
        if (typeof req.query.filename !== 'string') return res.status(400).send('Filename required');
        const file = fileHandler.resolveFile(root, req.query.filename.startsWith('/')
            ? req.query.filename : '/' + req.query.filename);
        const stat = await fs.stat(file);
        if (!stat.isFile()) return res.status(416).send('Not allowed: path is a folder');
        await fs.unlink(file);
        await thumbnails.remove(file);
        history.write(root, req.query.filename, 'delete', req.session?.authId || 'anonymous');
        if (lifecycle.onDeleteFile) lifecycle.onDeleteFile(req, { rootFolder: root, fileName: req.query.filename });
        res.send(req.query.filename);
    }));

    app.use((error, req, res, next) => {
        console.error('Request failed:', error);
        if (res.headersSent) return next(error);
        const status = error.status || (error.code === 'INVALID_PATH' ? 400 : 500);
        res.status(status).send(status >= 500 ? 'Internal server error' : error.message);
    });

    const server = app.listen(opts.port, () => console.log('server started on port %d', opts.port));
    app.locals.server = server;
    wsConnection(server, {
        secret: opts.secret,
        dirName: root,
        auth: authenticationEnabled,
        sessionStoragePath: opts.sessionStoragePath
    });
    return app;
}

module.exports = main;

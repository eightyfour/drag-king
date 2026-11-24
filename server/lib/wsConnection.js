const { WebSocketServer } = require('ws');
const fs = require('node:fs/promises');
const path = require('node:path');
const cookie = require('cookie-parser');
const sessionStore = require('./sessionStore');
const fileHandler = require('./fileHandler');
const history = require('./changeHistoryLogger');

function within(root, requested) {
    if (typeof requested !== 'string' || !requested.startsWith('/')) {
        throw Object.assign(new Error('Invalid path'), { code: 'INVALID_PATH' });
    }
    const resolved = path.resolve(root, '.' + requested);
    if (resolved !== path.resolve(root) && !resolved.startsWith(path.resolve(root) + path.sep)) {
        throw Object.assign(new Error('Invalid path'), { code: 'INVALID_PATH' });
    }
    return resolved;
}

function forbidden() {
    throw Object.assign(new Error('Permission denied'), { code: 'FORBIDDEN' });
}

async function getSession(request, config) {
    const raw = (request.headers.cookie || '').split(';')
        .map((part) => part.trim())
        .find((part) => part.startsWith('translatron_session='));
    if (!raw) return {};
    const signedValue = decodeURIComponent(raw.slice('translatron_session='.length));
    const sid = cookie.signedCookie(signedValue, config.secret);
    if (!sid || sid === signedValue) return {};
    if (config.sessionStoragePath) {
        try {
            return JSON.parse(await fs.readFile(path.join(config.sessionStoragePath, sid + '.json'), 'utf8'));
        } catch (error) {
            if (error.code === 'ENOENT') return {};
            throw error;
        }
    }
    return new Promise((resolve, reject) => {
        sessionStore.get(sid, (error, session) => error ? reject(error) : resolve(session || {}));
    });
}

function createHandler(config, session) {
    const user = {
        name: session.fullName || 'anonymous',
        authId: session.authId || 'anonymous',
        isAdmin: Boolean(session.isAdmin),
        isMaintainer: Boolean(session.isMaintainer),
        alias: session.ldapName || 'goat'
    };
    const alias = user.authId || 'anonymous';
    const writable = !config.auth || user.isAdmin || user.isMaintainer;
    const deletable = !config.auth || user.isAdmin;
    const root = config.dirName;

    return async function handle(method, args) {
        if (!Array.isArray(args)) throw new TypeError('Invalid arguments');
        const [file, target] = args;
        switch (method) {
            case 'init':
                return { path: args[0], user };
            case 'getDirectoryTree':
                return fileHandler.getDirectoryTree(root, file);
            case 'loadModuleConfig':
                return fileHandler.getModuleConfigFromJSON(root, file);
            case 'saveFile':
                if (!writable || (config.auth && !user.isAdmin && /\.json$/i.test(file))) forbidden();
                return fileHandler.saveFile(root, file, target);
            case 'saveModuleConfig': {
                if (!writable || (config.auth && !user.isAdmin && /\.json$/i.test(file))) forbidden();
                const current = await fileHandler.getModuleConfigFromJSON(root, file);
                if (current && current.timeStamp !== target.timeStamp) {
                    throw Object.assign(new Error('File changed since loading'), { code: 'STALE' });
                }
                return fileHandler.saveJSON(root, file, { ...target, timeStamp: Date.now() });
            }
            case 'copy':
            case 'move':
            case 'rename': {
                if (!writable) forbidden();
                const source = within(root, file);
                const destination = within(root, target);
                await fileHandler[method](source, destination);
                history.log(root, path.posix.dirname(file), `${file} -> ${target}`, method, alias);
                return { from: file, to: target };
            }
            case 'remove':
                if (!writable) forbidden();
                within(root, file);
                if (config.auth && !deletable) {
                    const hidden = path.posix.join(path.posix.dirname(file), '.' + path.posix.basename(file) + '-' + Date.now());
                    await fileHandler.rename(within(root, file), within(root, hidden));
                } else {
                    await fileHandler.remove(within(root, file));
                }
                history.log(root, path.posix.dirname(file), path.posix.basename(file), 'delete', alias);
                return { file };
            default:
                throw Object.assign(new Error('Unknown operation'), { code: 'UNKNOWN_OPERATION' });
        }
    };
}

module.exports = function wsConnection(server, config) {
    const sockets = new WebSocketServer({ server, path: '/ws' });
    sockets.on('connection', (socket, request) => {
        socket.on('message', async (data) => {
            let id;
            try {
                const message = JSON.parse(data.toString());
                id = message.id;
                if (!Number.isSafeInteger(id) || id < 1 || typeof message.method !== 'string') {
                    throw Object.assign(new Error('Invalid request'), { code: 'INVALID_REQUEST' });
                }
                const handle = createHandler(config, await getSession(request, config));
                const result = await handle(message.method, message.args);
                socket.send(JSON.stringify({ id, result }));
            } catch (error) {
                if (error.code === 'FORBIDDEN') {
                    console.warn('WebSocket request denied:', error.message);
                } else {
                    console.error('WebSocket request failed:', error);
                }
                if (socket.readyState === socket.OPEN) {
                    const publicError = ['FORBIDDEN', 'INVALID_PATH', 'INVALID_REQUEST',
                        'UNKNOWN_OPERATION', 'STALE'].includes(error.code);
                    socket.send(JSON.stringify({ id, error: {
                        code: error.code || 'INTERNAL_ERROR',
                        message: publicError ? error.message : 'Operation failed'
                    } }));
                }
            }
        });
        socket.on('error', (error) => console.error('WebSocket error:', error));
    });
    return sockets;
};

module.exports.createHandler = createHandler;

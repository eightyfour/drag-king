const fs = require('node:fs/promises');
const path = require('node:path');

function resolveFile(root, file) {
    if (typeof file !== 'string' || !file.startsWith('/')) {
        throw Object.assign(new Error('Invalid path'), { code: 'INVALID_PATH' });
    }
    const rootPath = path.resolve(root);
    const fullPath = path.resolve(rootPath, '.' + file);
    if (fullPath !== rootPath && !fullPath.startsWith(rootPath + path.sep)) {
        throw Object.assign(new Error('Invalid path'), { code: 'INVALID_PATH' });
    }
    return fullPath;
}

async function getModuleConfigFromJSON(root, file) {
    try {
        const data = JSON.parse(await fs.readFile(resolveFile(root, file), 'utf8'));
        if (!Object.hasOwn(data, 'timeStamp')) {
            data.timeStamp = Date.now();
            await saveJSON(root, file, data);
        }
        return data;
    } catch (error) {
        if (error.code === 'ENOENT') return false;
        throw error;
    }
}

async function saveJSON(root, file, obj) {
    const fullPath = resolveFile(root, file);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    let existing = {};
    try {
        existing = JSON.parse(await fs.readFile(fullPath, 'utf8'));
    } catch (error) {
        if (error.code !== 'ENOENT') throw error;
    }
    await fs.writeFile(fullPath, JSON.stringify({ ...existing, ...obj }, null, 2), 'utf8');
    return obj;
}

module.exports = {
    resolveFile,
    getModuleConfigFromJSON,
    saveJSON,
    async saveFile(root, file, content) {
        const fullPath = resolveFile(root, file);
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, content, 'utf8');
        return content;
    },
    async getDirectoryTree(root, folder) {
        return require('./directoryTree')(root, folder);
    },
    remove: (file) => fs.rm(file, { recursive: true, force: false }),
    async move(from, to) {
        await fs.mkdir(path.dirname(to), { recursive: true });
        await fs.rename(from, to);
    },
    async copy(from, to) {
        await fs.mkdir(path.dirname(to), { recursive: true });
        await fs.cp(from, to, { recursive: true });
    },
    rename: (from, to) => fs.rename(from, to)
};

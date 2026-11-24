const fs = require('node:fs/promises');
const path = require('node:path');

module.exports = {
    async createFolder(rootFolder, folder) {
        const root = path.resolve(rootFolder);
        const destination = path.resolve(root, '.' + folder);
        if (destination !== root && !destination.startsWith(root + path.sep)) {
            throw Object.assign(new Error('Invalid folder'), { code: 'INVALID_PATH' });
        }
        await fs.mkdir(destination, { recursive: true });
    },
    formatFolder(folder) {
        if (!folder) return '/';
        folder = folder.split(' ').join('_');
        if (!folder.endsWith('/')) folder += '/';
        if (!folder.startsWith('/')) folder = '/' + folder;
        return folder;
    }
};

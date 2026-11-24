const path = require('node:path');
const fileHandler = require('./fileHandler');

const pending = new Map();
const LOG_FILE_NAME = '.history.json';

function record(root, folder, data, action, alias) {
    const key = path.posix.join(folder, LOG_FILE_NAME);
    const entry = pending.get(key) || { entries: {}, timer: null };
    entry.entries[Date.now()] = { action: { key: action, value: data }, alias };
    clearTimeout(entry.timer);
    entry.timer = setTimeout(async () => {
        pending.delete(key);
        try {
            await fileHandler.saveJSON(root, key, entry.entries);
        } catch (error) {
            console.error('Failed to write change history:', error);
        }
    }, 1000);
    pending.set(key, entry);
}

module.exports = {
    get logFileName() { return LOG_FILE_NAME; },
    write(root, file, action, alias) {
        record(root, path.posix.dirname(file), file, action, alias);
    },
    log: record,
    read(root, folder) {
        return fileHandler.getModuleConfigFromJSON(root, path.posix.join(folder, LOG_FILE_NAME));
    }
};

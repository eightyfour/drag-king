/**
 * Creates an log file and logs and persists all changes to the file system.
 *
 * @module module:changeHistoryLogger
 */
var LOG_FILE_NAME = '.history.json',
    fileHandler = require('./fileHandler'),
    logCacheMap = {},
    timeCache;

/**
 *
 * @param {string} path
 */
function getFolderName(path) {
    if (path.indexOf('.') !== -1) {
        // contains a dot - maybe a file?
        // remove last item and return folder with '/' at the end
        return path.split('/').slice(0, -1).join('/') + '/';
    }
    return path;
}

/**
 *
 * @type {{logFileName: string}}
 */
module.exports = {
    /**
     *
     * @returns {string}
     */
    get logFileName() {
        return LOG_FILE_NAME;
    }
};
/**
 * Write the history to a log file
 *
 * Note: Saves a history data with a delay to avoid file write crashes
 *
 * @param {string} rootFolder - root file folder
 * @param {string} file - the path to the file from root folder
 * @param {string} action - the action which will be logged
 * @param {string} alias - the user identifier name
 */
module.exports.write = function (rootFolder, file, action, alias) {
    var folder = getFolderName(file),
        obj = {};
    obj[(new Date()).getTime()] = {
        action : {
            key : action,
            value : file
        },
        alias : alias
    };
    if (!logCacheMap.hasOwnProperty(folder + LOG_FILE_NAME)) {
        logCacheMap[folder + LOG_FILE_NAME] = obj;
    } else {
        // merge it with existing
        Object.assign(logCacheMap[folder + LOG_FILE_NAME], obj);
    }
    // reset the previous one
    clearTimeout(timeCache);
    timeCache = setTimeout(function () {
        Object.keys(logCacheMap).forEach(function (key) {
            fileHandler.saveJSON(rootFolder, key, logCacheMap[key]);
            delete logCacheMap[key];
        })
    }, 1000);
};
/**
 *
 * @param {string} file
 * @param {function} cb
 */
module.exports.read = function (file, cb) {
    var folder = getFolderName(file);
    fileHandler.getModuleConfigFromJSON(folder + LOG_FILE_NAME, cb);
};

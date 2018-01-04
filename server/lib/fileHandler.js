/**
 * handles the persistence of the JSON objects
 *
 * @module fileHandler
 * @requires fs
 */

const fs = require('fs'),
    tree = require('./directoryTree'),
    folderUtil = require('../../lib/folderUtil'),
    fsExtra = require('fs-extra');

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
 * @param {string} rootFolder
 * @param {string} file
 * @param {object} obj
 * @param {function} cb
 */
function saveJSON(rootFolder, file, obj, cb) {
    const fullPath = rootFolder + file;

    new Promise(function(resolve, reject) {
        fs.stat(fullPath, function(err, stats) {
            if (err || !stats.isFile()) {
                resolve(false);
            } else {
                resolve(true);
            }
        });
    }).then(function(fileExists) {
        return new Promise(function (resolve, reject) {
            if (fileExists) {
                fs.readFile(rootFolder + file, function (err, data) {
                    if (err) {
                        resolve(false)
                    } else {
                        resolve(JSON.parse(data));
                    }
                })
            } else {
                folderUtil.createFolder(rootFolder, getFolderName(file), function () {
                    resolve(false);
                })
            }
        });
    }).then(function(data) {
        return new Promise(function (resolve, reject) {
            let save, json;
            if (data) {
                save = Object.assign({}, data, obj)
            } else {
                save = obj;
            }
            try {
                json = JSON.stringify(save, null, '  ');
            } catch (e) {
                reject(err);
            }
            fs.writeFile(fullPath, json, 'utf8', function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(obj);
                }
            });
        });
    }).then(function(data) {
        cb(data);
    }).catch(function() {
        cb(false);
    });
}

function saveFile(rootFolder, file, fileContent, cb) {
    const fullPath = rootFolder + file;

    new Promise(function(resolve, reject) {
        fs.stat(fullPath, function(err, stats) {
            if (err || !stats.isFile()) {
                resolve(false);
            } else {
                resolve(true);
            }
        });
    }).then(function(fileExists) {
        return new Promise(function (resolve, reject) {
            if (fileExists) {
                resolve();
            } else {
                folderUtil.createFolder(rootFolder, getFolderName(file), function () {
                    resolve();
                })
            }
        });
    }).then(function() {
        return new Promise(function (resolve, reject) {
            fs.writeFile(fullPath, fileContent, 'utf8', function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(fileContent);
                }
            });
        });
    }).then(function(data) {
        cb(data);
    }).catch(function() {
        cb(false);
    });
}

module.exports = {
    remove : function (file) {
        return fsExtra.remove(file);
    },
    move : function (fileFrom, fileTo) {
        return fsExtra.move(fileFrom, fileTo);
    },
    /**
     * Provides a complete directory tree structure - including all directories and files
     *
     * @param rootFolder
     * @param folder
     * @param cb
     */
    getDirectoryTree : function (rootFolder, path, cb) {
        tree(rootFolder, path)
            .then(cb)
            .catch((e) => {
                console.log('fileHandler:can\'t get tree structure!', e);
                cb(false);
            });
    },
    /**
     * Saves a file with the obj as file content
     *
     * @param {string} rootFolder
     * @param {string} file
     * @param {string} obj
     * @param cb
     */
    saveFile : function (rootFolder, file, obj, cb) {
        saveFile(rootFolder, file, obj, cb);
    },
    /**
     * Saves a JSON file to the file system
     *
     * @param {string} rootFolder
     * @param {string} file
     * @param {object} obj
     * @param {function} cb
     */
    saveJSON : function (rootFolder, file, obj, cb) {
        saveJSON(rootFolder, file, obj, cb);
    },
    /**
     * Loads a JSON and reads the config
     *
     * @param {string} rootFolder
     * @param {string} filePath
     * @param {function} cb
     */
    getModuleConfigFromJSON : function (rootFolder, file, cb) {
        const filePath = rootFolder + file;
        new Promise(function(resolve, reject) {
            fs.stat(filePath, function(err, stats) {
                if (err || !stats.isFile()) {
                    reject(filePath +  'does not exist');
                } else {
                    resolve();
                }
            });
        }).then(function() {
            return new Promise(function (resolve, reject) {
                fs.readFile(filePath, 'utf8', (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        try {
                            resolve(JSON.parse(data));
                        } catch(ex) {
                            reject(ex);
                        }
                    }
                });
            });
        }).then(function(data) {
            if (!data.hasOwnProperty('timeStamp')) {
                data.timeStamp = (new Date()).getTime();
                saveJSON(rootFolder, file, data, function (ret) {
                    if (ret === false) {
                        // TODO this could have site effects on client - he will not able to save anything to the sever
                        console.error('fileHandler:error file system error - can\'t save JSON!');
                    }
                });
            }
            cb(data);
        }).catch(function() {
            cb(false);
        });
    }
};
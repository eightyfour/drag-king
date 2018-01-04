
/**
 * Saves the JSON files to the server via a websocket connection to the client
 *
 * @module persist
 * @requires module:cookie-parser
 * @requires module:sessionStore
 * @requires module:shoe
 * @requires module:dnode
 * @requires module:fileHandler
 */

const shoe = require('shoe'),
    dnode = require('dnode'),
    fileHandler = require('./fileHandler'),
    changeHistoryLogger = require('./changeHistoryLogger'),
    cookieParser = require('cookie-parser'),
    sessionStore = require('./sessionStore');

let config;

const sock = shoe(function (stream) {
    let user = {
        authId : 'anonymous'
    };
    const d = dnode({
        /**
         * Callback will be called with the complete file structure
         *
         * @param path
         * @param cb
         */
        getDirectoryTree : function (path, cb) {
            fileHandler.getDirectoryTree(config.dirName, path, cb);
        },
        /**
         *
         * @param {string} file
         * @param {function} cb
         */
        loadModuleConfig : function (file, cb) {
            fileHandler.getModuleConfigFromJSON(config.dirName, file, function (data) {
                cb(data); // 1492083845980 - 1492083863075
            })
        },
        /**
         * Save any content in the given file name. It overwrites the existing file.
         *
         * @param fileName
         * @param content
         * @param cb
         */
        saveFile : function (fileName, content, cb) {
            if (!fileName) {
                cb(false);
                return;
            }
            fileHandler.saveFile(config.dirName, fileName[0] === '/' ? fileName : '/' + fileName , content, cb);
        },
        /**
         *
         * If the timestamp from the obj is older as the timestamp from the file then the save call will be rejected
         *
         * @param {string} file
         * @param {{timeStamp:number,styleguideId:string,approved:boolean, comments:Array<object>, dysis:string,labels:Array<object>,specs:Array<string>}} obj
         * @param {function} cb
         */
        saveModuleConfig : function (file, obj, cb) {
            fileHandler.getModuleConfigFromJSON(config.dirName, file, function (data) {
                if (data === false || data.timeStamp === obj.timeStamp) {
                    // file does not exists - but this is no problem
                    obj.timeStamp = (new Date()).getTime();
                    fileHandler.saveJSON(config.dirName, file, obj, function (data) {
                        cb(data);
                    })
                } else {
                    cb(false, 'timeStamp');
                }
                
            })
        },
        init : function (path, cb) {
            const returnObject = {
                    path : path.path
                },
                sid = cookieParser.signedCookie(path.session, config.secret);

            if (sid) {
                sessionStore.get(sid, function(err, session) {
                    if (!session) {
                        session = {};
                    }
                    returnObject.user = {
                        name: session.fullName,
                        authId: session.authId,
                        isAdmin: session.isAdmin,
                        isMaintainer: session.isMaintainer,
                        alias: session.ldapName,
                    };
                    user = returnObject.user;
                    cb(returnObject)
                });
            } else {
                cb(returnObject)
            }

        },
        copy : (fromFile, toFile, cb) => {
            // cb(fromFile, toFile);

            fileHandler.copy(config.dirName + fromFile, config.dirName + toFile).then(() => {
                const fromFileName = fromFile;
                const toFileName = toFile;
                cb(fromFile, toFile);
                changeHistoryLogger.log(
                    config.dirName,
                    fromFile.split('/').slice(0, -1).join('/'),
                    fromFileName.split('/').splice(-1)[0] + '/ -> ' + toFileName,
                    'copyTo',
                    user.authId);
                changeHistoryLogger.log(
                    config.dirName,
                    toFile.split('/').slice(0, -1).join('/'),
                    fromFileName + '/ -> ' + toFileName.split('/').splice(-1)[0] + '/',
                    'copyFrom',
                    user.authId);
            }).catch((err) => {
                cb(null);
            })
        },
        move : (fromFile, toFile, cb) => {
            fileHandler.move(config.dirName + fromFile, config.dirName + toFile).then(() => {
                const fromFileName = fromFile;
                const toFileName = toFile;
                changeHistoryLogger.log(
                    config.dirName,
                    fromFile.split('/').slice(0, -1).join('/'),
                    fromFileName.split('/').splice(-1)[0] + '/ -> ' + toFileName,
                    'movedTo',
                    user.authId);
                changeHistoryLogger.log(
                    config.dirName,
                    toFile.split('/').slice(0, -1).join('/'),
                    fromFileName + '/ -> ' + toFileName.split('/').splice(-1)[0],
                    'movedFrom',
                    user.authId);
                cb(fromFile, toFile);
            }).catch((err) => {
                cb(null);
            })
        },
        remove : (file, cb) => {
            if (user.isAdmin) {
                fileHandler.remove(config.dirName + file).then(() => {
                    changeHistoryLogger.log(
                        config.dirName,
                        file.split('/').slice(0, -1).join('/'),
                        file.split('/').splice(-1)[0] + '/',
                        'delete',
                        user.authId);
                    cb(file)
                }).catch((err) => {
                    cb(null);
                })
            } else if (user.isMaintainer) {
                let toFile = (() => {
                    let fSplit = file.split('/');
                    // last item will be a hidden file
                    fSplit[fSplit.length -1] = '.' + fSplit[fSplit.length -1];
                    return fSplit.join('/');
                })();
                fileHandler.rename(config.dirName + file, config.dirName + toFile + '-' + (new Date()).getTime()).then(() => {
                    changeHistoryLogger.log(
                        config.dirName,
                        file.split('/').slice(0, -1).join('/'),
                        file.split('/').splice(-1)[0] + '/',
                        'delete',
                        user.authId);
                    cb(file);
                }).catch((err) => {
                    cb(null);
                })
            } else {
                cb(null);
            }
        },
        rename : (fromFile, toFile, cb) => {
            fileHandler.rename(config.dirName + fromFile, config.dirName + toFile).then(() => {
                const fromFileName = fromFile;
                const toFileName = toFile;
                changeHistoryLogger.log(
                    config.dirName,
                    fromFile.split('/').slice(0, -1).join('/'),
                    fromFileName.split('/').splice(-1)[0] + '/ -> ' + toFileName.split('/').splice(-1)[0] + '/',
                    'rename',
                    user.authId);
                cb(fromFile, toFile);
            }).catch((err) => {
                cb(null, err.errno);
            })
        }
    });
    d.pipe(stream).pipe(d);
});

/**
 * Create a persist instance
 *
 * @param {object} server - the server instance from app.listen...
 * @param {{dirName:string, secret:string}} moduleConfig - application root folder where to save the files
 */
module.exports = function (server, moduleConfig) {
    config = moduleConfig;
    sock.install(server, '/dnode');
};

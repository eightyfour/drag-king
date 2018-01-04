
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
            cb(fromFile, toFile);
        },
        move : (fromFile, toFile, cb) => {
            cb(fromFile, toFile);
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
            
            } else {
                cb(null);
            }
        },
        rename : (fromFile, toFile, cb) => {
            cb(fromFile, toFile);
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

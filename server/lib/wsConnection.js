
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

/**
 * Some inner stuff in here
 * @inner
 */

const shoe = require('shoe'),
    dnode = require('dnode'),
    fileHandler = require('./fileHandler'),
    cookieParser = require('cookie-parser'),
    sessionStore = require('./sessionStore');

let dirname;

const sock = shoe(function (stream) {
    const d = dnode({
        /**
         * Callback will be called with the complete file structure
         *
         * @param path
         * @param cb
         */
        getDirectoryTree : function (path, cb) {
            fileHandler.getDirectoryTree(dirname, path, cb);
        },
        /**
         *
         * @param {string} file
         * @param {function} cb
         */
        loadModuleConfig : function (file, cb) {
            fileHandler.getModuleConfigFromJSON(dirname, file, function (data) {
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
            fileHandler.saveFile(dirname, fileName[0] === '/' ? fileName : '/' + fileName , content, cb);
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
            fileHandler.getModuleConfigFromJSON(dirname, file, function (data) {
                if (data === false || data.timeStamp === obj.timeStamp) {
                    // file does not exists - but this is no problem
                    obj.timeStamp = (new Date()).getTime();
                    fileHandler.saveJSON(dirname, file, obj, function (data) {
                        cb(data);
                    })
                } else {
                    cb(false, 'timeStamp');
                }
                
            })
        },
        init : function (path, cb) {
            const returnObject = {
                    path : path.path,
                    hey : function (s) {
                        console.log('hey', s);
                    }
                }, sid = cookieParser.signedCookie(path.session, 'joker');

            if (sid) {
                sessionStore.get(sid, function(err, session) {
                    console.log('persist:', session);
                    if (!session) {
                        session = {};
                    }
                    returnObject.user = {
                        name: session.fullName,
                        isAdmin: session.isAdmin,
                        isMaintainer: session.isMaintainer,
                        alias: session.ldapName,
                    };
                    cb(returnObject)
                });
            } else {
                cb(returnObject)
            }

        }
    });
    d.pipe(stream).pipe(d);
});

/**
 * Create a persist instance
 *
 * @param {object} server - the server instance from app.listen...
 * @param {string} dirName - application root folder where to save the files
 */
module.exports = function (server, dirName) {
    dirname = dirName;
    sock.install(server, '/dnode');
};

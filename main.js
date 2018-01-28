/**
 * Simple HTTP Server
 *
 * Author: phen
 *
 * @param {Object} opts
 * @param {Object} appLifeCycle - handle different life cycle phases for registering requests to the express app instance
 * @param {boolean} auth - disable the auth handling to implement by your own
 * @param {string} secret - the cookie secret name for cookie access
 * @param {number} port - the cookie secret name for cookie access
 * @param {string} fileStorageName - path to store the files
 * @param {string} fourOFourFile - path of the 404.html which will be shown if the file is not available (default is the dragKing own file)
 * @param {function} appLifeCycle.phase1 - executed before the files listener is attached
 * @param {function} appLifeCycle.fileFilter - filter for files and folders which will not be send to client (return file name or undefined to filter out)
 * @param {function} appLifeCycle.onUploadFile - listener will be called if file is successfully saves on file system
 * @param {function} appLifeCycle.onDeleteFile - listener will be called if file is successfully deleted from file system
 * @returns {function}
 */
function main(opts, appLifeCycle) {
    
    var fs = require('fs'),
        wsConnection = require('./server/lib/wsConnection'),
        cookieParser = require('cookie-parser'),
        sessionStore = require('./server/lib/sessionStore'),
        packageJSON = require('./package.json'),
        bodyParser = require('body-parser'),
        folderUtil = require('./lib/folderUtil'),
        changeHistoryLogger = require('./server/lib/changeHistoryLogger'),
        express = require('express'),
        busboy = require('connect-busboy'),
        serveIndex = require('serve-index'),
        thumbNail = require('./lib/thumbNail')(opts.fileStorageName, 'tmb_'),
        app,
        finalhandler = require('finalhandler'),
        serveStatic = require('serve-static'),
        serve = serveStatic(opts.dirName),
        index = serveIndex(opts.dirName, {'icons': true}),
        acceptedImageExtensions = ['jpeg', 'jpg', 'png', 'gif'];

    app = express();
    app.use(busboy());

    app.get(['/dist/*'], function (req, res) {
        var done = finalhandler(req, res);
        serve(req, res, function onNext(err) {
            if (err) {
                return done(err);
            }
            index(req, res, done);
        });
    });

    app.get('/files*', function (req, res) {
        var done = finalhandler(req, res);
        serve(req, res, function onNext(err) {
            if (err) {
                return done(err);
            }
            index(req, res, done);
        });
    });
    /**
     * Register all special function via underscore '_'
     */
    app.use('/_/', require('./server/lib/router/ls')(opts.fileStorageName));

    // use bodyParser middleware for handling request bodies (express does *not* provide that feature out-of-the-box).
    // since we only have one case of that (POST to /login where username, password are in the body) and that one is url-encoded,
    // we only need that flavor of bodyParser. about the "extended" property, see https://github.com/expressjs/body-parser#bodyparserurlencodedoptions
    app.use(bodyParser.urlencoded({ extended: false }));
    // same for parsing cookie
    app.use(cookieParser());

    appLifeCycle && appLifeCycle.phase1 && appLifeCycle.phase1(app);
    app.get(/^((?!^(\/dist|\/bower_components)).)*$/, function(req, res, next) {

        if (packageJSON.config.auth) {
            // file request
            let isAuth = req.session && req.session.authId;
            if (!/\./.test(req.path) && !isAuth) {
                // TODO sending the login page only makes sense for browser requests. if anybody is e.g. using curl to
                // retrieve message bundles, we should only return a 401 but no content
                res.sendFile(__dirname + '/auth.html');
            } else {
                next();
            }
        } else {
            next();
        }

    });

    app.post('/uploadFile', function (req, res, next) {
        if (packageJSON.config.auth) {
            if (req.session && (req.session.isMaintainer) || req.session.isAdmin) {
                if (req.session.isAdmin) {
                    next();
                } else if (!/.json/.test(req.query.filename)) {
                    next();
                } else {
                    res.status(401).send('Not authorized');
                }
            } else {
                res.status(401).send('Not authorized');
            }
        } else {
            // res.status(401).send('Not authorized');
            next()
        }
    });

    /**
     * Limited restrictions!
     *
     * visitors:
     *  * are not allowed at all
     * maintainer:
     *  * not allowed to delete .json files
     * admins:
     *  * allowed to do everything
     */
    app.post('/deleteFile', function (req, res, next) {
        if (packageJSON.config.auth) {
            if (req.session && req.session.isMaintainer || req.session.isAdmin) {
                if (req.session.isAdmin) {
                    next();
                    // maintainer are not allowed to delete files marked as hidden
                } else if (!/^\..*/.test(req.query.filename)) {
                    next();
                } else {
                    res.status(403).send('Forbidden');
                }
            } else {
                res.status(401).send('Not authorized');
            }
        } else {
            // res.status(401).send('Not authorized');
            next()
        }
    });
    /**
     * match except for folder dist
     *
     * If the URL has a dot inside it expect to send a files. Otherwise it sends the index.
     */
    app.get(/^((?!^(\/dist)).)*$/, function (req, res) {
        fs.stat(decodeURI(opts.fileStorageName + req.path), function (err, stats) {
            if (!err) {

                if (stats.isDirectory() ) {
                    res.sendFile(opts.dirName + 'index.html');
                    return;
                } else {
                    // is a file

                    // not sure if it is good by default but - needs to be configurable
                    res.header("Access-Control-Allow-Origin", "*");
                    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

                    if (/\?tmb/.test(req.url)) {

                        thumbNail.create(decodeURI(req.path), function (file) {
                            if (file) {
                                res.sendFile(file);
                            } else {
                                res.sendFile(decodeURI(opts.fileStorageName + req.path));
                            }
                        });

                    } else {
                        res.sendFile(decodeURI(opts.fileStorageName + req.path), {dotfiles: 'allow'});
                    }
                }
            } else {
                // no file found - send 404 file
                // res.status(404).sendFile(opts.fourOFourFile ? opts.fourOFourFile : __dirname + '/404.html');
                if (/\./.test(req.path.split('/').slice(-1)) && !req.query.folder) {
                    // so it will not be possible to create folders with a dot inside ;-)
                    // but we need this to send a 404 for backward compatibility reasons
                    res.status(404).sendFile(opts.fourOFourFile ? opts.fourOFourFile : __dirname + '/404.html');
                } else {
                    res.sendFile(opts.dirName + 'index.html');
                }
            }
        });

    });



    app.post('/uploadFile', function (req, res) {
        var fstream, folder = folderUtil.formatFolder(req.query.folder);

        req.pipe(req.busboy);
        req.busboy.on('file', function (fieldname, file, filename) {
            // replace all spaces with underscores
            // TODO it's not a good idea to rename file - because there are people they put spaces in a file name
            var fName = filename; //.split(' ').join('_');

            function writeFile() {

                fstream = fs.createWriteStream(opts.fileStorageName + folder + fName);
                file.pipe(fstream);
                fstream.on('close', function () {
                    // TODO add correct type
                    var extension = fName.split('.').pop();
                    if (extension && acceptedImageExtensions.indexOf(extension.toLowerCase()) !== -1) {
                        res.status(200).send({file: folder + fName, name: fName, type: 'image/jpg'});
                    } else {
                        res.status(200).send({file: folder + fName, name: fName, type: extension});
                    }
                });
            }
            changeHistoryLogger.write(opts.fileStorageName, folder + fName, 'upload', req.session.authId || 'anonymous');
            appLifeCycle && appLifeCycle.onUploadFile && appLifeCycle.onUploadFile(req, {
                rootFolder : opts.fileStorageName,
                fileName : folder + fName
            });
            folderUtil.createFolder(opts.fileStorageName, folder, writeFile);
        });
    });

    /**
     * get all available files
     */
    app.post('/getFiles', function (req, res) {
        var folder = '';

        req.on("data", function (chunk) {
            folder += chunk.toString();
        });

        req.on("end", function () {
            folder = folderUtil.formatFolder(folder);
            fs.readdir(opts.fileStorageName + folder, function (err, files) {

                var fileList = [],
                    length;

                if (err === null) {
                    files = files.filter(function (fileName) {
                        return fileName.split('/').pop().startsWith('tmb_') ? undefined : fileName
                    });
                    if (appLifeCycle && appLifeCycle.fileFilter) {
                        files = files.filter(appLifeCycle.fileFilter);
                    }
                    length = files.length;
                    files.forEach(function (file) {
                        fs.stat(opts.fileStorageName + folder + file, function (err, stats) {
                            if (stats.isFile()) {
                                // TODO add correct type
                                var extension = file.split('.').pop();

                                if (extension && acceptedImageExtensions.indexOf(extension.toLowerCase()) !== -1) {
                                    fileList.push({file: folder + file, name: file, type: 'image/jpg'});
                                } else {
                                    fileList.push({file: folder + file, name: file, type: extension});
                                }
                            } else if (stats.isDirectory()) {
                                // filter out directories - if we need directories we should ask separately for it
                                console.log('Found a directory named:', file);
                            }
                            length--;
                            if (length <= 0) {
                                res.status(200).send(fileList);
                            }
                        });
                    });
                }
            });
        });
    });

    /**
     * get all available folders
     */
    app.post('/getFolders', function (req, res) {
        // get a list of all folders
        var folder = '';

        req.on("data", function (chunk) {
            folder += chunk.toString();
        });

        req.on("end", function () {
            folder = folderUtil.formatFolder(folder);
            fs.readdir(opts.fileStorageName + folder, function (err, files) {
                var fileList = [],
                    length;

                if (err === null) {
                    length = files.length;
                    files.forEach(function (file) {
                        fs.stat(opts.fileStorageName + folder + file, function (err, stats) {
                            if (err) {
                                console.log("app:path not exists:", err);
                                return;
                            }
                            if (stats.isDirectory()) {
                                fileList.push(file);
                            }
                            length--;
                            if (length <= 0) {
                                res.status(200).send(fileList);
                            }
                        });
                    });
                }
            });
        });
    });

    /**
     * delete a file
     */
    app.post('/deleteFile', function (req, res) {
        var fileName;
        if (req.query.hasOwnProperty('filename')) {
            fileName = req.query.filename;
            if (fileName[0] !== '/') {
                fileName = '/' + fileName;
            }
            fs.unlink(opts.fileStorageName + fileName, function (err) {
                if (err) {
                    if (err.code === 'EISDIR')
                        res.status(416).send('Not allowed the file is a folder ' + req.query.filename);
                    else
                        res.status(410).send('File not found: ' + req.query.filename);
                    return
                }
                changeHistoryLogger.write(opts.fileStorageName, fileName, 'delete', req.session.authId || 'anonymous');
                appLifeCycle && appLifeCycle.onDeleteFile && appLifeCycle.onDeleteFile(req, {
                    rootFolder : opts.fileStorageName,
                    fileName : fileName
                });
                res.status(200).send(req.query.filename);
            });
            thumbNail.remove(fileName);
        } else {
            res.status(204).send('No Content');
        }
    });


    let server;

    server = app.listen(opts.port, function () {
        console.log('server started on port %d', opts.port);
    });

    // initialize the json persist via websocket
    wsConnection(server, {
        secret : opts.secret,
        dirName : opts.fileStorageName
    });

    return app;
}

module.exports = main;
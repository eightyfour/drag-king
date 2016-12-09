/**
 * Simple HTTP Server
 *
 * Author: phen
 */
function main(opts) {


    var fs = require('fs'),
        folderUtil = require('./lib/folderUtil'),
        express = require('express'),
        busboy = require('connect-busboy'),
        serveIndex = require('serve-index'),
        app,
        finalhandler = require('finalhandler'),
        serveStatic = require('serve-static'),
        serve = serveStatic(opts.dirName),
        index = serveIndex(opts.dirName, {'icons': true}),
        acceptedImageExtensions = ['jpeg', 'jpg', 'png', 'gif'];


    app = express();
    app.use(busboy());

    app.get(['/bower_components/*', '/dist/*'], function (req, res) {
        var done = finalhandler(req, res);
        serve(req, res, function onNext(err) {
            if (err) {
                return done(err);
            }
            index(req, res, done);
        });
    });

    app.get('/files*', function (req, res) {
        console.log('app:files*');
        var done = finalhandler(req, res);
        serve(req, res, function onNext(err) {
            if (err) {
                return done(err);
            }
            index(req, res, done);
        });
    });

    /**
     * match except for folder dist and bower_components
     *
     * If the URL has a dot inside it expect to send a files. Otherwise it sends the index.
     */
    app.get(/^((?!^(\/dist|\/bower_components)).)*$/, function (req, res) {
        if (/\./.test(req.path)) {
            // contains a . - looks like a file request so check the files system
            fs.exists(opts.fileStorageName + req.path, function (exists) {
                if (exists) {
                    res.sendFile(opts.fileStorageName + req.path);
                } else {
                    // no file found - send 404 file
                    res.sendStatus(404);
                    res.sendFile(opts.dirName + '404.html');
                }
            });

        } else {
            // send index
            res.sendFile(opts.dirName + 'index.html');

        }
    });



    app.post('/uploadFile', function (req, res) {
        var fstream, folder = folderUtil.formatFolder(req.query.folder);

        req.pipe(req.busboy);
        req.busboy.on('file', function (fieldname, file, filename) {
            // repalce all spaces with underscores
            var fName = filename.split(' ').join('_');

            function writeFile() {
                console.log('app:writeFile' + opts.fileStorageName + folder + fName);
                fstream = fs.createWriteStream(opts.fileStorageName + folder + fName);
                file.pipe(fstream);
                fstream.on('close', function () {
                    // TODO add correct type
                    var extension = fName.split('.')[1];
                    if (acceptedImageExtensions.indexOf(extension) !== -1) {
                        res.status(200).send({file: folder + fName, name: fName, type: 'image/jpg'});
                    } else {
                        res.status(200).send({file: folder + fName, name: fName, type: extension});
                    }
                });
            }

            console.log('uploadFile', '/files' + folder);
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
            console.log('app:getFiles folder', folder);
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
                            if (stats.isFile()) {
                                // TODO add correct type
                                var extension = file.split('.')[1];

                                if (acceptedImageExtensions.indexOf(extension) !== -1) {
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
            console.log('app:deleteFile', req.query.filename);
            fileName = req.query.filename;
            if (fileName[0] !== '/') {
                fileName = '/' + fileName;
            }
            fs.unlink(opts.fileStorageName + fileName, function () {
                res.status(200).send(req.query.filename);
            });
        } else {
            res.status(200).send(false);
        }
    });

    return app;
}

module.exports = main;
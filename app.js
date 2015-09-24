/**
 * Simple HTTP Server
 *
 * Author: phen
 */
var opts = {
        dirName: __dirname + '/',
        distName: __dirname + '/dist/',
        port : process.env.npm_package_config_port
    },
    fs = require('fs'),
    watchifyTask = require('./watchifyTask.js'),
    express = require('express'),
    busboy = require('connect-busboy'),
    serveIndex = require('serve-index'),
    app,
    finalhandler = require('finalhandler'),
    serveStatic = require('serve-static'),
    serve = serveStatic(opts.dirName),
    index = serveIndex(opts.dirName, {'icons': true});

/**
 * add a / at the begining or end
 * @param folder
 * @returns {*}
 */
function formatFolder(folder) {
    if (folder === undefined || folder.length === 0) {
        return '/';
    }
    // replace all spaces with underscores
    folder = folder.split(' ').join('_');

    if (folder[folder.length] !== '/') {
        folder += '/';
    }
    if (folder[0] !== '/') {
        folder = '/' + folder;
    }
    return folder;
}

if (process.env.npm_package_config_port !== undefined) {
    watchifyTask();

    app = express();
    app.use(busboy());

    app.get(['/bower_components/*', '/dist/*'],  function (req, res) {
        var done = finalhandler(req, res);
        serve(req, res, function onNext(err) {
            if (err) {
                return done(err);
            }
            index(req, res, done);
        });
    });

    app.get('/files*',  function (req, res) {
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
    app.get(/^((?!(\/dist|\/bower_components)).)*$/,  function (req, res) {
        if (/\./.test(req.originalUrl)) {
            // contains a . - looks like a file request so check the files system
            fs.exists(__dirname + '/files' + req.originalUrl, function (exists) {
                if (exists) {
                    res.sendFile(__dirname + '/files' + req.originalUrl);
                } else {
                    // no file found - send 404 file
                    res.sendFile(__dirname + '/404.html');
                }
            });

        } else {
            // send index
            res.sendFile(__dirname + '/index.html');

        }
    });

    /**
     * check if folder exists - otherwise create one
     * @param folder
     * @param cb
     */
    function createFolder(rootFolder, folder, cb) {
        var folders = [],
            actualFolder = "";
        // create array
        folder.split('/').forEach(function (f) {
            // remove empty strings like ''
            if (f !== '') {
                folders.push(f);
            }
        });

        (function create(idx) {
            if (idx < folders.length) {
                actualFolder += '/' + folders[idx];
                fs.exists(rootFolder + actualFolder, function (exists) {
                    if (exists) {
                        create(idx + 1);
                    } else {
                        fs.mkdir(rootFolder + actualFolder, function () {
                            create(idx + 1);
                        });
                    }
                });
            } else {
                cb();
            }
        }(0));
    }
     app.post('/uploadFile',  function (req, res) {
         var fstream, folder = formatFolder(req.query.folder);

         req.pipe(req.busboy);
         req.busboy.on('file', function (fieldname, file, filename) {
             // repalce all spaces with underscores
             var fName = filename.split(' ').join('_');

             function writeFile() {
                 console.log('app:writeFile' + __dirname + '/files' + folder + fName);
                 fstream = fs.createWriteStream(__dirname + '/files' + folder + fName);
                 file.pipe(fstream);
                 fstream.on('close', function () {
                     // TODO add correct type
                     res.status(200).send({file: '/files' + folder + fName, type: 'image/jpg'});
                 });
             }
             console.log('uploadFile', '/files' + folder);
             createFolder(__dirname, '/files' + folder, writeFile);
         });
    });

    /**
     * get all available files
     */
    app.post('/getFiles',  function (req, res) {
        var folder = '';

        req.on("data", function(chunk){
            folder += chunk.toString();
            console.log('app:getFiles folder', folder);
        });

        req.on("end",function(){
            folder = formatFolder(folder);
            fs.readdir(__dirname + '/files' + folder, function (err, files) {

                var fileList = [],
                    length;

                if (err === null) {
                    length = files.length;
                    files.forEach(function (file) {
                        fs.stat(__dirname + '/files' + folder + file, function (err, stats) {
                            if (stats.isFile()) {
                                // TODO add correct type
                                fileList.push({file: '/files' + folder + file, type: 'image/jpg'});
                            } else if (stats.isDirectory()){
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
     * get all available files
     */
    app.post('/getFolders',  function (req, res) {
       // get a list of all folders
        var folder = '';

        req.on("data", function(chunk){
            folder += chunk.toString();
        });

        req.on("end",function(){
            folder = formatFolder(folder);
            fs.readdir(__dirname + '/files' + folder, function (err, files) {
                var fileList = [],
                    length;

                if (err === null) {
                    length = files.length;
                    files.forEach(function (file) {
                        fs.stat(__dirname + '/files' + folder + file, function (err, stats) {
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
            fs.unlink(__dirname + fileName, function () {
                res.status(200).send(req.query.filename);
            });
        } else {
            res.status(200).send(false);
        }
    });



    app.listen(opts.port, function () {
        console.log('server started on port %d',  opts.port);
    });

} else {
   console.log('Server not started! - Please check the config or use "npm start" to start the server.');
}



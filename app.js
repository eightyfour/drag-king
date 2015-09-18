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

    app.get('/[dist|bower_components]*',  function (req, res, next) {
        console.log('app:/[dist|bower_components]*');
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

    app.get(/^((?!(\/static|\/dist|\/bower_components)).)*$/,  function (req, res) {
        res.sendFile(__dirname + '/index.html');
    });

    /**
     * check if folder exists - otherwise create one
     * @param folder
     * @param cb
     */
    function createFolder(rootFolder, folder, cb) {
        var folders = [],
            actualFolder = "";
        // remove empty items  like ''
        folder.split('/').forEach(function (f) {
            if (f !== '') {
                folders.push(f);
            }
        });
        console.log('createFolder:', folders);
        (function create(idx) {
            if (idx < folders.length) {
                actualFolder += '/' + folders[idx];
                console.log('createFolder:actualFolder', actualFolder);

                fs.exists(rootFolder + actualFolder, function (exists) {
                    if (exists) {
                        create(idx + 1);
                    } else {
                        console.log('createFolder: new folder', rootFolder + actualFolder);

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

             function writeFile() {
                 console.log('app:writeFile' + __dirname + '/files' + folder + filename);
                 fstream = fs.createWriteStream(__dirname + '/files' + folder + filename);
                 file.pipe(fstream);
                 fstream.on('close', function () {
                     res.status(200).send({file: '/files' + folder + filename, type: 'image/jpg'});
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
                                fileList.push('/files' + folder + file);
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



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

if (process.env.npm_package_config_port !== undefined) {
    watchifyTask();

    app = express();
    app.use(busboy());

    app.get('/files*',  function (req, res) {
        var done = finalhandler(req, res);
        serve(req, res, function onNext(err) {
            if (err) {
                return done(err);
            }
            index(req, res, done);
        });
    });
    app.get('/dist*',  function (req, res) {
        var done = finalhandler(req, res);
        serve(req, res, function onNext(err) {
            if (err) {
                return done(err);
            }
            index(req, res, done);
        });
    });

    app.get('/',  function (req, res) {
        var done = finalhandler(req, res);
        serve(req, res, function onNext(err) {
            if (err) {
                return done(err);
            }
            index(req, res, done);
        });
    });

     app.post('/uploadFile',  function (req, res) {
         var fstream;
         req.pipe(req.busboy);
         req.busboy.on('file', function (fieldname, file, filename) {
             console.log("Uploading: " + filename);

             function writeFile() {
                 fstream = fs.createWriteStream(__dirname + '/files/' + filename);
                 file.pipe(fstream);
                 fstream.on('close', function () {
                     res.status(200).send({file : '/files/' + filename, type: 'image/jpg'});
                 });
             }

             // check if folder exists - otherwise create one
             fs.exists(__dirname + '/files/', function (exists) {
                 if (exists) {
                     writeFile();
                 } else {
                      fs.mkdir(__dirname + '/files/', function () {
                          writeFile();
                      })
                 }
             });
         });
    });

    /**
     * get all available files
     */
    app.get('/getFiles',  function (req, res) {
        fs.readdir(__dirname + '/files/', function (err, files) {
            var fileList = [];
            if (err === null) {
                files.forEach(function (file) {
                    fileList.push('/files/' + file);
                });
                res.status(200).send(fileList);
            }
        })
    });

    /**
     * delete a file
     */
    app.get('/deleteFile',  function (req, res) {
        var fileName;
        console.log('app:',req.query);
        if (req.query.hasOwnProperty('filename')) {
            fileName = req.query.filename.split('/');
            fs.unlink(__dirname + '/files/' + fileName[fileName.length -1], function () {
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



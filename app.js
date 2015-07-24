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
        //var done = finalhandler(req, res);
         console.log('REQUEST2:');

         var fstream;
         req.pipe(req.busboy);
         req.busboy.on('file', function (fieldname, file, filename) {
             console.log("Uploading: " + filename);

             //Path where image will be uploaded
             fstream = fs.createWriteStream(__dirname + '/files/' + filename);
             file.pipe(fstream);
             fstream.on('close', function () {
                 res.status(200).send({file : '/files/' + filename, type: 'image/jpg'});
             });
         });
    });

    app.listen(opts.port, function () {
        console.log('server started on port %d',  opts.port);
    });
} else {
   console.log('Server not started! - Please check the config or use "npm start" to start the server.');
}



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
    watchifyTask = require('./watchifyTask.js'),
    express = require('express'),
    serveIndex = require('serve-index'),
    app,
    finalhandler = require('finalhandler'),
    serveStatic = require('serve-static'),
    serve = serveStatic(opts.dirName),
    index = serveIndex(opts.dirName, {'icons': true});

if (process.env.npm_package_config_port !== undefined) {
    watchifyTask();

    app = express();

    app.get('/*',  function (req, res) {
        var done = finalhandler(req, res);
        serve(req, res, function onNext(err) {
            if (err) {
                return done(err);
            }
            index(req, res, done);
        });
    });

    app.listen(opts.port, function () {
        console.log('server started on port %d',  opts.port);
    });
} else {
   console.log('Server not started! - Please check the config or use "npm start" to start the server.');
}



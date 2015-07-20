/**
 * Simple HTTP Server
 *
 * Author: phen
 */

var opts = {
        dirName: __dirname + '/',
        distName: __dirname + '/dist/',
        port : 8000
    },
    express = require('express'),
    serveIndex = require('serve-index'),
    app,
    finalhandler = require('finalhandler'),
    serveStatic = require('serve-static'),
    serve = serveStatic(opts.dirName),
    index = serveIndex(opts.dirName, {'icons': true});



function listening() {
    console.log('server started on port %d',  opts.port);
}

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

app.listen(opts.port, listening);

let port = process.env.npm_package_config_port || 8000;

/**
 * Runs the dragKing application.
 *
 * Start the app in production mode with configure the environment variable NODE_ENV=production
 * Or start it directly with: NODE_ENV=production node asset-management-webapp.js
 *
 * @type {main}
 */
const main = require('./main'),
    packageJSON = require('./package.json'),
    fs = require('fs'),
    auth = require('./server/lib/auth'),
    changeHistoryLogger = require('./server/lib/changeHistoryLogger'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    express = require('express'),
    sessionStore = require('./server/lib/sessionStore'),
    wsConnection = require('./server/lib/wsConnection'),
    fileStorageName = __dirname + '/files',
    cookieSecretName = 'dragKing',
    app = main({
        dirName: __dirname + '/',
        fileStorageName: fileStorageName
    }, {
        onDeleteFile : function (req, file) {
            changeHistoryLogger.write(file.rootFolder, file.fileName, 'delete', req.session.ldapName || 'anonymous')
        },
        onUploadFile : function (req, file) {
            changeHistoryLogger.write(file.rootFolder, file.fileName, 'upload', req.session.ldapName || 'anonymous')
        },
        phase1 : function (app) {

            // use bodyParser middleware for handling request bodies (express does *not* provide that feature out-of-the-box).
            // since we only have one case of that (POST to /login where username, password are in the body) and that one is url-encoded,
            // we only need that flavor of bodyParser. about the "extended" property, see https://github.com/expressjs/body-parser#bodyparserurlencodedoptions
            app.use(bodyParser.urlencoded({ extended: false }));
            // same for parsing cookie
            app.use(cookieParser());

            // TODO activate auth and make it configureable
            app.use(auth(app, {
                rootDir : fileStorageName,
                secret: cookieSecretName,
                sessionTimeout: 1000 * 60 * 60
            }));

            app.get(/^((?!^(\/dist|\/bower_components)).)*$/, function(req, res, next) {

                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

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
        }
    });

let server;



if (app.get('env') === 'development') {
    port = packageJSON.config.port.development;
} else {
    port = packageJSON.config.port.production;
}

server = app.listen(port, function () {
    console.log('server started on port %d', port);
});

// initialize the json persist via websocket
wsConnection(server, {
    secret : cookieSecretName,
    dirName : __dirname + '/files'
});
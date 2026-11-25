/**
 * Runs the dragKing application.
 *
 * Start the app in production mode with configure the environment variable NODE_ENV=production
 * Or start it directly with: NODE_ENV=production node asset-management-webapp.js
 *
 * @type {main}
 */
const main = require('./main'),
    auth = require('./server/lib/auth'),
    fileStorageName = __dirname + '/files',
    packageJSON = require('./package.json'),
    cookieSecretName = process.env.DRAG_KING_SESSION_SECRET || 'dragKing',
    port = process.env.NODE_ENV === 'production'
        ? packageJSON.config.port.production : packageJSON.config.port.development;

main({
        dirName: __dirname + '/',
        fileStorageName: fileStorageName,
        secret : cookieSecretName,
        port
    }, {
        phase1 : function (app) {
            // TODO activate auth and make it configureable
            auth(app, {
                rootDir : fileStorageName,
                secret: cookieSecretName,
                sessionTimeout: 1000 * 60 * 60
            });
        }
    });
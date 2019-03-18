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
    auth = require('./server/lib/auth'),
    fileStorageName = __dirname + '/files',
    packageJSON = require('./package.json'),
    app = require('express')(),
    cookieSecretName = 'dragKing',
    mainApp = main({
        dirName: __dirname + '/',
        fileStorageName: fileStorageName,
        auth : false,
        secret : cookieSecretName,
        port : (function () {
            let port;
            if (app.get('env') === 'development') {
                port = packageJSON.config.port.development;
            } else {
                port = packageJSON.config.port.production;
            }
            return port;
        }())
    }, {
        phase1 : function (app) {
            // TODO activate auth and make it configureable
            app.use(auth(app, {
                rootDir :fileStorageName,
                secret: cookieSecretName,
                sessionTimeout: 1000 * 60 * 60,
                adminGroupId: 'CN=AssetsAdministrator,OU=Assets,OU=Services,OU=groups,DC=gdoffice,DC=gameduell,DC=de',
                maintainerGroupId: 'CN=AssetsMaintainer,OU=Assets,OU=Services,OU=groups,DC=gdoffice,DC=gameduell,DC=de',
                url: ldapConf.url,
                bindDn: 'trac-bind-user',
                bindCredentials: ldapConf.bindCredentials,
                searchBase: 'DC=gdoffice,DC=gameduell,DC=de',
                searchFilter: '(&(objectCategory=User)(sAMAccountName={{username}})(|(memberOf:1.2.840.113556.1.4.1941:=CN=AssetsUser,OU=Assets,OU=Services,OU=groups,DC=gdoffice,DC=gameduell,DC=de)(memberOf:1.2.840.113556.1.4.1941:=CN=AssetsMaintainer,OU=Assets,OU=Services,OU=groups,DC=gdoffice,DC=gameduell,DC=de)(memberOf:1.2.840.113556.1.4.1941:=CN=AssetsAdministrator,OU=Assets,OU=Services,OU=groups,DC=gdoffice,DC=gameduell,DC=de)))',
                tlsOptions: {
                    ca: [
                        fs.readFileSync(__dirname + '/gameduellCA.crt')
                    ]
                }
            }));

            // app.use(auth(app, {
            //     rootDir : fileStorageName,
            //     secret: cookieSecretName,
            //     sessionTimeout: 1000 * 60 * 60
            // }));
        }
    });
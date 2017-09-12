const passport = require('passport'),
    session = require('express-session'),
    fs = require('fs'),
    md5 = require('md5'),
    sessionStore = require('./sessionStore');
    // add temporary user roles to this list

let userPermission = {admins : [], maintainers: []};

try {
    // TODO read file on the fly in case that the files changes we need no server restart
    userPermission = require('../../files/.user-permission.json');
} catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
        console.log('auth:user-permission.json NOT FOUND');
    }
}

/**
 *
 * @param app
 * @param {{rootDir:string, secret:string, sessionTimeout:number}} authConfig
 * @returns {Function}
 */
module.exports = function (app, authConfig) {

    const sessionCookieName = 'translatron_session';

    app.use(session({
            store: sessionStore,
            name: sessionCookieName,
            // secret is used for signing the cookie so that nobody can create fake cookies
            secret: authConfig.secret || 'dragKing',
            // if true session would be updated (in store) on every request (even without changes to session) and
            // recommended default is false, anyway
            resave: false,
            // see https://github.com/expressjs/session#user-content-saveuninitialized
            saveUninitialized: false,
            rolling: true,
            cookie: {
                httpOnly: false,
                maxAge: authConfig.sessionTimeout || 1000 * 60 * 60
            }
        })
    );

    app.use(passport.initialize());
    app.use(passport.session());

    // if login is successful, the user info will be saved in a connect.sid cookie
    app.post('/login', function (req, res, next) {
        next();
    }, function(req, res) {
        let backURL = req.header('Referer') || '/',
            authId;

        if (req.body.from && req.body.from.length > 0) {
            backURL += req.body.from;
        }
        if (req.body.username) {
            authId = req.body.username;
            fs.readFile(authConfig.rootDir + '/.allowedUsers.json', (err, data) => {
                if (err) {
                    console.log('auth:something went wrong with the allowedUsers.json Are you sure that the files exists?', err);
                    // define access groups
                    req.session.isAdmin = false;
                    req.session.isMaintainer = false;
                    res.redirect(backURL);
                    return;
                }
                try {
                    let usersMap = JSON.parse(data);
                    if (usersMap[authId].pw === md5(req.body.password)) {
                        req.session.authId = authId;
                        req.session.fullName = usersMap[authId].fullName || req.session.authId;
                        // define access groups
                        req.session.isAdmin = userPermission.admins.indexOf(req.session.authId) !== -1;
                        req.session.isMaintainer = userPermission.maintainers.indexOf(req.session.authId) !== -1;
                        res.redirect(backURL);
                    } else {
                        req.session.isAdmin = false;
                        req.session.isMaintainer = false;
                        res.redirect(backURL);
                    }
                } catch (e) {
                    console.log('auth:can\'t read .allowedUsers.json - the foamt must be a JSON!');
                    req.session.isAdmin = false;
                    req.session.isMaintainer = false;
                    res.redirect(backURL);
                }
            })
        }
    });

    // logout - page reload is handled on client side
    app.post('/logout', function(req, res) {
        req.logout();
        req.session.destroy();
        res.clearCookie(sessionCookieName);
        res.send('logout');
    });

    return function (res, req, next) {
        next();
    }
};
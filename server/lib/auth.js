const passport = require('passport'),
    session = require('express-session'),
    fs = require('fs'),
    md5 = require('md5'),
    sessionStore = require('./sessionStore'),
    basicAuth = require('basic-auth')
    // add temporary user roles to this list

let userPermission = {admins : [], maintainers: []};

try {
    // TODO read file on the fly in case that the files changes we need no server restart
    userPermission = Object.assign(userPermission, require('../../files/.user-permission.json'));
} catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
        console.log('auth:user-permission.json NOT FOUND');
    }
}

function authenticate({authId, pw, authConfig}) {
    return new  Promise((res, errCb) => {
        fs.readFile(authConfig.rootDir + '/.allowedUsers.json', (err, data) => {
            if (err) {
                console.log('auth:something went wrong with the allowedUsers.json Are you sure that the files exists?', err);
                // define access groups
                res({
                    isAdmin : false,
                    isMaintainer : false
                })
                return
            }
            let usersMap = JSON.parse(data);
            if (usersMap[authId].pw === md5(pw)) {
                // define access groups
                res({
                    authId: authId,
                    fullName: usersMap[authId].fullName || authId,
                    isAdmin : userPermission.admins.indexOf(authId) !== -1,
                    isMaintainer : userPermission.maintainers.indexOf(authId) !== -1
                })
            } else {
                res({
                    isAdmin : false,
                    isMaintainer : false
                })
            }
        })
    })

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
            authenticate({authId : req.body.username, pw: req.body.password, authConfig})
            .then((session) => {
                Object.keys(session).forEach((key) => {
                    req.session[key] = session[key]
                })
                res.redirect(backURL);
            }).catch((err) => {
                console.log('auth:can\'t read .allowedUsers.json - the format must be a JSON!')
                req.session.isAdmin= false
                req.session.isMaintainer= false
                res.redirect(backURL)
            })
        }
    });
    
    function handlePostAuth(req, res, next) {
        if (/Basic/.test(req.header('authorization'))) {
            let user = basicAuth(req)
            authenticate({authId : user.name, pw: user.pass, authConfig})
                .then((session) => {
                    Object.keys(session).forEach((key) => {
                        req.session[key] = session[key]
                    })
                    next()
                })
                .catch((err) => {
                    next()
                })
        } else {
            next()
        }
    }

    app.post('/uploadFile', handlePostAuth)

    app.post('/deleteFile', handlePostAuth)

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
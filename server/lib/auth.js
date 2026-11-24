const session = require('express-session');
const fs = require('node:fs/promises');
const md5 = require('md5');
const sessionStore = require('./sessionStore');
const basicAuth = require('basic-auth');

async function authenticate(authId, password, rootDir, permissions) {
    const users = JSON.parse(await fs.readFile(rootDir + '/.allowedUsers.json', 'utf8'));
    const user = users[authId];
    if (!user || user.pw !== md5(password || '')) return null;
    return {
        authId,
        fullName: user.fullName || authId,
        isAdmin: permissions.admins.includes(authId),
        isMaintainer: permissions.maintainers.includes(authId)
    };
}

module.exports = function auth(app, config) {
    const cookieName = 'translatron_session';
    app.use(session({
        store: sessionStore,
        name: cookieName,
        secret: config.secret,
        resave: false,
        saveUninitialized: false,
        rolling: true,
        cookie: { httpOnly: true, maxAge: config.sessionTimeout, sameSite: 'lax' }
    }));

    async function getPermissions() {
        try {
            return JSON.parse(await fs.readFile(config.rootDir + '/.user-permission.json', 'utf8'));
        } catch (error) {
            if (error.code !== 'ENOENT') throw error;
            return { admins: [], maintainers: [] };
        }
    }

    app.post('/login', async (req, res, next) => {
        try {
            if (!req.body.username || !req.body.password) {
                res.status(400).send('Username and password required');
                return;
            }
            const user = await authenticate(req.body.username, req.body.password, config.rootDir, await getPermissions());
            if (user) Object.assign(req.session, user);
            else {
                delete req.session.authId;
                req.session.isAdmin = false;
                req.session.isMaintainer = false;
            }
            const destination = req.body.from || req.get('Referer') || '/';
            const origin = `${req.protocol}://${req.get('host')}`;
            const redirect = new URL(destination, origin);
            res.redirect(redirect.origin === origin ? redirect.pathname + redirect.search : '/');
        } catch (error) {
            next(error);
        }
    });

    async function handlePostAuth(req, res, next) {
        const credentials = basicAuth(req);
        if (!credentials) return next();
        try {
            const user = await authenticate(credentials.name, credentials.pass, config.rootDir, await getPermissions());
            if (user) Object.assign(req.session, user);
            next();
        } catch (error) {
            next(error);
        }
    }

    app.post(['/uploadFile', '/deleteFile'], handlePostAuth);
    app.post('/logout', async (req, res, next) => {
        try {
            await new Promise((resolve, reject) => {
                req.session.destroy((error) => error ? reject(error) : resolve());
            });
            res.clearCookie(cookieName);
            res.send('logout');
        } catch (error) {
            next(error);
        }
    });
};

/**
 * Router to list folder files - component which listens to a /ls url
 *
 */
const fs = require('fs');
const express = require('express');
const router = express.Router();

let rootDir = '/';

/**
 * remove all files or folders starts with .
 * @returns {Function}
 */
function filterHiddenFiles() {
    return (item) => {
        if ((() => (item.split('/').slice(-1)[0] || ''))()[0] !== '.') {
            return item;
        }
        return false;
    }
}

/**
 * remove the tmb_ files from list
 * @returns {Function}
 */
function filterTmpFiles() {
    return (item) => {
        if (!/^tmb_/.test(item.split('/').slice(-1)[0])) {
            return item;
        }
        return false;
    }
}

/**
 * filter all files which has not the given extension
 *
 * @param exp
 * @returns {Function}
 */
function filterExtensions(exp) {
    return (item) => {
        if ((() => (item.split('/').slice(-1)[0] || ''))().split('.').slice(-1)[0] === exp) {
            return item;
        }
        return false;
    }
}

router.get('/ls/*', function (req, res) {

    fs.readdir(rootDir + req.params[0], (err, data) => {
        if (err) {
            res.status(404);
            res.send('404');
        } else {
            data = data.filter(filterHiddenFiles()).filter(filterTmpFiles());
            if (req.query.ext) {
                data = data.filter(filterExtensions(req.query.ext))
            }
            res.json(data);
        }
    })

});



module.exports = function (rootFolder) {
    rootDir = rootFolder + '/';
    return router;
};
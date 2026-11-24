const fs = require('node:fs/promises');
const express = require('express');
const { resolveFile } = require('../fileHandler');

module.exports = function listRouter(root) {
    const router = express.Router();
    router.get('/ls/*', async (req, res, next) => {
        try {
            const files = await fs.readdir(resolveFile(root, '/' + req.params[0]));
            res.json(files.filter((file) => !file.startsWith('.') && !file.startsWith('tmb_'))
                .filter((file) => !req.query.ext || file.split('.').pop() === req.query.ext));
        } catch (error) {
            if (error.code === 'ENOENT') return res.status(404).send('404');
            next(error);
        }
    });
    return router;
};

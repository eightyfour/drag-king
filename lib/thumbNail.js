const sharp = require('sharp');
const fs = require('node:fs/promises');
const path = require('node:path');

module.exports = function thumbNail(prefix = 'tmb_v2_') {
    function thumbnailPath(file) {
        return path.join(path.dirname(file), prefix + path.basename(file));
    }
    function legacyPath(file) {
        return path.join(path.dirname(file), 'tmb_' + path.basename(file));
    }
    async function removeIfPresent(file) {
        try {
            await fs.unlink(file);
        } catch (error) {
            if (error.code !== 'ENOENT') throw error;
        }
    }
    return {
        async create(file) {
            const target = thumbnailPath(file);
            try {
                await fs.access(target);
            } catch (error) {
                if (error.code !== 'ENOENT') throw error;
                await sharp(file).autoOrient().resize({ width: 200, withoutEnlargement: true }).toFile(target);
            }
            if (target !== legacyPath(file)) await removeIfPresent(legacyPath(file));
            return target;
        },
        async remove(file) {
            await removeIfPresent(thumbnailPath(file));
            if (thumbnailPath(file) !== legacyPath(file)) await removeIfPresent(legacyPath(file));
        }
    };
};

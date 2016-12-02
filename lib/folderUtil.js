var fs = require('fs');

module.exports = {
    /**
     * check if folder exists - otherwise create one
     * @param rootFolder
     * @param folder
     * @param cb
     */
    createFolder : function(rootFolder, folder, cb) {
        var folders = [],
            actualFolder = "";
        // create array
        folder.split('/').forEach(function (f) {
            // remove empty strings like ''
            if (f !== '') {
                folders.push(f);
            }
        });

        (function create(idx) {
            if (idx < folders.length) {
                actualFolder += '/' + folders[idx];
                fs.exists(rootFolder + actualFolder, function (exists) {
                    if (exists) {
                        create(idx + 1);
                    } else {
                        fs.mkdir(rootFolder + actualFolder, function () {
                            create(idx + 1);
                        });
                    }
                });
            } else {
                cb();
            }
        }(0));
    },
    /**
     * add a / at the beginning or end
     * @param folder
     * @returns {*}
     */
    formatFolder : function(folder) {
        if (folder === undefined || folder.length === 0) {
            return '/';
        }
        // replace all spaces with underscores
        folder = folder.split(' ').join('_');

        if (folder.length > 1 && folder[folder.length] !== '/') {
            folder += '/';
        }
        if (folder[0] !== '/') {
            folder = '/' + folder;
        }
        return folder;
    }
};
/**
 *
 * @param {string} fileStorageName - root directory where to save the files
 * @param {string} [tmbPrefix=tmb_] - prefix for the thumbnail files
 * @returns {{create: create, remove: remove}}
 */
module.exports = function thumbNail(fileStorageName, tmbPrefix) {
    var thumb = require('node-thumbnail').thumb,
        fs = require('fs'),
        tmb = tmbPrefix || 'tmb_';

    function getThumbnailFileNameFromPath(path) {
        var a = path.split('/'),
            name = tmb + a.pop();
        a.push(name);
        return a.join('/');
    }

    function createThumbnail(path, cb) {
        var tmbName = getThumbnailFileNameFromPath(path);
        console.log('main:tmbName', tmbName);
        fs.exists(fileStorageName + tmbName, function (exists) {
            if (!exists) {
                thumb({
                    prefix: tmb,
                    suffix: '',
                    width: '200',
                    source: fileStorageName + path, // could be a filename: dest/path/image.jpg
                    concurrency: 4,
                    destination: fileStorageName + (path.split('/').slice(0, -1).join('/')) // remove file name from path
                }).then(function () {
                    console.log('main:', fileStorageName + tmbName);
                    cb(fileStorageName + tmbName);
                }).catch(function (e) {
                    console.log('Error', e.toString());
                    cb(false);
                });
            } else {
                console.log('main:', fileStorageName + tmbName);
                cb(fileStorageName + tmbName);
            }
        });
    }

    function remove(path, cb) {
        var tmbName = getThumbnailFileNameFromPath(path);
        fs.unlink(fileStorageName + tmbName, function (error) {
            cb(error);
        });
    }
    return {
        /**
         *
         * @param {string} originalFileName
         * @param {function} cb
         */
        create : function (originalFileName, cb) {
            createThumbnail(originalFileName, cb || function() {});
        },
        /**
         *
         * @param {string} originalFileName
         * @param {function} cb
         */
        remove : function (originalFileName, cb) {
            remove(originalFileName, cb || function () {});
        }
    }
};
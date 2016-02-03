var canny = require('canny'),
    trade = require('./trade.js');
require('./uploadBox.js');
canny.add('upload', require('./c-upload.js'));
canny.add('gallery', require('./c-gallery.js'));
canny.add('folderNav', require('./c-folderNav.js'));
canny.add('listFolders', require('./c-listFolders.js'));
canny.add('newFolder', require('./c-newFolder.js'));
canny.add('slider', require('./c-slider.js'));
canny.add('imagePreviewer', require('./c-imagePreviewer.js'));
canny.add('fileDownLoaderFormat', require('./c-fileDownLoaderFormat.js'));

trade.on({
    getFiles : function (files) {
        console.log('main:new files was loaded', files);
    },
    deleteFile : function (file) {
        console.log('main:files was deleted', file);
    }
});

canny.ready(function () {
    // load initial files
    trade.doCall('getFiles')(location.pathname);
});
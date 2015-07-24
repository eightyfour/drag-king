var canny = require('canny');
require('./uploadBox.js');
canny.add('upload', require('./c-upload.js'));
canny.add('gallery', require('./c-gallery.js'));

canny.upload.onFileSend(function (obj) {
    if (obj === false) {
        console.log('upload failure!');
    } else {
        //TODO needs a regExp image/XXXX
        var parsedObj = JSON.parse(obj)
        if(/image\/.*/.test(parsedObj.type)){
            canny.gallery.addImage(parsedObj.file);
        }
    }
});
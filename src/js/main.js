var canny = require('canny');
canny.add('upload', require('./c-upload.js'));

canny.upload. onFileSend(function (obj) {
    if (obj === false) {
        console.log('upload failure!');
    } else {
       alert(obj);
    }
});
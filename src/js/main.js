var canny = require('canny'),
    $ = require('jquery-browserify');
// main js will be generated
// from browserify to one
window.$ = $;

require('./$uploader.js')($);

//canny.add('async', require('canny/mod/async'));
//canny.add('upload', require('./c-upload.js'));

//canny.upload.onFileSend(function (file) {
//    canny.async.doAjax({
//        method : 'POST',
//        data: file,
//        path : '/uploadFile',
//        onSuccess : function () {console.log('main:success');},
//        onFailure : function () {console.log('main:failure');}
//    });
//})
$(function () {
    $('#uploadButton').uploader({
        url : '/uploadFile',
        onStart : function () {
            $('body').append('Upload started...');
        },
        onComplete : function (response) {
            console.log('main:response', response);
            $('body').append('Upload started...');
        }
    });
})

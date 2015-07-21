var canny = require('canny');

canny.add('upload', function () {

    return {
        add : function (node) {
            node.addEventListener('click', function () {
                console.log('upload:file');
            });
        },
        ready : function () {
            console.log('upload:ready');
            console.log('upload:ready');
        }
    }
});
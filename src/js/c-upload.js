/**
 *
 * @returns {{add: Function, ready: Function}}
 */
module.exports = function () {

    var brain = {
        button : {
            init : function (node) {
                node.addEventListener('click', function () {
                    var file = brain.fileInput.getFile();
                    console.log('upload:file', file);
                    if (file) {

                    } else {
                        console.log('c-upload: not file choosen');
                    }
                });
            }

        },
        fileInput : (function () {
            var choosenFile;
            return {
                getFile: function () {
                    return choosenFile;
                },
                init: function (node) {
                    node.addEventListener('change', function () {
                        var file = node.value;
                        if (file) {
                            choosenFile = file;
                        }
                    });
                }
            }
        }())
    };

    return {
        add : function (node, attr) {
            if (brain.hasOwnProperty(attr)) {
                brain[attr].init(node);
            }
        },
        ready : function () {
            console.log('upload:ready');
        }
    }
};
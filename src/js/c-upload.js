/**
 * Call this for each file - will call a call back with the server answer
 * @param file
 */
function sendFile(file, cb) {
    var uri = "/uploadFile",
        xhr = new XMLHttpRequest(),
        fd = new FormData();

    xhr.open("POST", uri, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            // Handle response.
            cb(xhr.responseText); // handle response.
        } else {
            cb(false);
        }
    };
    fd.append('myFile', file);
    // Initiate a multipart/form-data upload
    xhr.send(fd);
}


/**
 *
 * @returns {{add: Function, ready: Function}}
 */
module.exports = function () {


    var onFileSend = function () {},
        brain = {
            fileInput : (function () {
                var choosenFile;
                return {
                    getFile: function () {
                        return choosenFile;
                    },
                    init: function (node) {
                        node.addEventListener('change', function () {
                            var file = this.files[0];
                            if (file) {
                                // choosenFile = file;
                                // send it direct after drop
                                [].slice.call(this.files).forEach(function (file) {
                                    sendFile(file, onFileSend);
                                });
                            }
                        });
                    }
                }
            }())
        };

    return {
        onFileSend : function (fc) {
            onFileSend = fc;
        },
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
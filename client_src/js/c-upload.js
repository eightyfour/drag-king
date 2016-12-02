var trade = require('./trade.js'),
    brain = {
        fileInput : {
            init: function (node) {
                node.addEventListener('change', upload);
            }
        }
    };

function upload() {
    console.log('c-upload:trigger upload');
    var file = this.files[0];
    if (file) {
        // send it direct after drop
        [].slice.call(this.files).forEach(function (file) {
            // instead pass  directly a array of files - so we save POST calls
            trade.doCall('sendFile')(file);
        });
        // cleanup value otherwise file with same name can't uploaded again
        this.value = null;
        return false;
    }
}
/**
 *
 * @returns {{add: Function, ready: Function}}
 */
module.exports = {
    add : function (node, attr) {
        if (brain.hasOwnProperty(attr)) {
            brain[attr].init(node);
        }
    }
};
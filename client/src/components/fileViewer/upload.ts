import * as trade from '../../trade';

const brain = {
        fileInput : {
            init: function (node) {
                node.addEventListener('change', doUpload);
            }
        }
    };

function doUpload() {
    console.log('upload:trigger doUpload');
    const file = this.files[0];
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
export const upload = {
    add : function (node, attr) {
        if (brain.hasOwnProperty(attr)) {
            brain[attr].init(node);
        }
    }
};
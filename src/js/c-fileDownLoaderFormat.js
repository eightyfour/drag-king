var overlay = require('./overlay.js'),
    trade = require('./trade.js'),
    files = [];

trade.on({
    getFiles: function (data) {
        data.forEach(function (file) {
            if (/image\/.*/.test(file.type)) {
                files.push(file.file);
            }
        });
    }
});

function addNode(content) {
    var node = document.createElement('div');
    node.appendChild(content);
    return node;
}

function getJSONAsArray() {
    var frag = document.createDocumentFragment(),
        host = location.host,
        i = 0;

    frag.appendChild(document.createTextNode('['));
    files.forEach(function (name) {
        i++;
        frag.appendChild(document.createTextNode('\''));
        frag.appendChild(document.createTextNode(host + name));
        frag.appendChild(document.createTextNode('\''));

        if (i < files.length) {
            frag.appendChild(document.createTextNode(','));
            frag.appendChild(document.createElement('br'));
        }
    });
    frag.appendChild(document.createTextNode(']'));
    return frag;
}

/**
 *
 * @returns {{add: Function, ready: Function}}
 */
module.exports =  {
    add : function (elem, attr) {
        if (attr === 'show') {
            elem.addEventListener('click', function () {
                overlay.add(function (ov) {
                    ov.getNode().appendChild(addNode(getJSONAsArray()));
                    ov.show();
                    ov.onBackgroundClick(function () {
                        ov.hide();
                    })
                })
            })
        }
    }
};
import { overlay } from '../overlay/overlay';
import * as trade from '../../trade';

const files = [];

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
    const node = document.createElement('div');
    node.appendChild(content);
    return node;
}

function getJSONAsArray() {
    const frag = document.createDocumentFragment(),
        host = location.host;
    let i = 0;

    frag.appendChild(document.createTextNode('['));
    files.forEach(function (name) {
        i++;
        frag.appendChild(document.createTextNode('\''));
        frag.appendChild(document.createTextNode('http://' + host + name));
        frag.appendChild(document.createTextNode('\''));

        if (i < files.length) {
            frag.appendChild(document.createTextNode(','));
            frag.appendChild(document.createElement('br'));
        }
    });
    frag.appendChild(document.createTextNode(']'));
    return frag;
}

function getWgetFormat() {
    let retString = "wget -P src/images",
        host = location.host;
    files.forEach(function (name) {
        retString += ' http://' + host + name;
    });
    return retString;
}

/**
 *
 * @returns {{add: Function, ready: Function}}
 */
export const fileDownloaderFormat =  {
    add : function (elem, attr) {
        if (attr === 'show') {
            elem.addEventListener('click', function () {
                overlay.add(function (ov) {
                    ov.getNode().appendChild(addNode(document.createTextNode(getWgetFormat())));
                    ov.show();
                    ov.onBackgroundClick(function () {
                        ov.hide();
                    })
                })
            })
        }
    }
};
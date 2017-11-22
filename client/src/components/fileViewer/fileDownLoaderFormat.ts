import { overlay } from '../overlay/overlay';
import * as trade from '../../trade';
import * as whisker from 'canny/mod/whisker';

const template = require('./fileDownLoaderFormat.html');
const imageFiles = [];
const svgFiles = [];

trade.on({
    getFiles: function (data) {
        data.forEach(function (file) {
            if (/image\/.*/.test(file.type)) {
                imageFiles.push(file.file);
            }

            if (/svg/.test(file.type)) {
                svgFiles.push(file.file);
            }
        });
    }
});

function addNodes(content) {
    const node = document.createElement('div');
    content.forEach((n) => {
        node.appendChild(n);
    })
    return node;
}

function getImagesWgetFormat() {
    let retString = "wget -P .",
        host = location.host;
    imageFiles.forEach(function (name) {
        retString += ' http://' + host + name;
    });
    return retString;
}

function getSVGWgetFormat() {
    let retString = "wget -P .",
        host = location.host;
    svgFiles.forEach(function (name) {
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
                    ov.getNode().innerHTML = template;
                    whisker.add(ov.getNode(), {
                        svg : getSVGWgetFormat(),
                        images : getImagesWgetFormat(),
                    });
                    ov.show();
                    ov.onBackgroundClick(function () {
                        ov.hide();
                        ov.getNode().remove()
                    });
                })
            })
        }
    }
};
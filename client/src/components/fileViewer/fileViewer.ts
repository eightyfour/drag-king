import * as canny from 'canny';
import * as url from 'canny/mod/url.js';
import { scrollToFocusedElement } from '../../utils';
import * as fileSpace from './fileSpace';
import { showSlider } from '../slider/sliderController';
import * as trade from '../../trade';
import { fileDownloaderFormat } from './fileDownLoaderFormat';
import { upload } from './upload';

const template = require('./fileViewer.html');

let fileFilter;

/**
 * calls the external file filter if exists
 * @param files
 * @returns {*}
 */
function filterViewFiles(files) {
    if (fileFilter) {
        return files.filter(function (file) {
            return fileFilter(file.file) !== undefined ? file : undefined;
        });
    }
    return files;
}

function hightlightFileFromURL() {
    const param = url.getURLParameter('file');
    if (param) {
        let node = document.querySelector(`.gallery [id*="${param}"]`);
        if (node) {
            node.classList.add('c-selected');
            scrollToFocusedElement(node);
        }
    }
}

canny.add('fileDownLoaderFormat', fileDownloaderFormat);
canny.add('fileSpace', fileSpace);
canny.add('upload', upload);
canny.add('fileViewer', {
    add : function (node: HTMLElement) {
        node.innerHTML = template;
        canny.cannyParse(node);
    }
});

trade.on({
    getFiles : function (data) {
        if (fileFilter) {
            data = filterViewFiles(data);
        }
        data.forEach(function (file) {
            fileSpace.addFile(file);
        });
        hightlightFileFromURL();
    },
    fileSend : function (err, file) {
        if (err) {
            return
        }
        if (fileFilter && fileFilter(file.file) === undefined) {
            return;
        }
        fileSpace.addFile(file);
    }
});

fileSpace.onDeleteFiles(function (fileName, fc) {
    trade.doCall('deleteFile')(fileName, fc);
});

fileSpace.onItemClicked(function (file: {file:string, name:string, type:string}, fc) {
    if (/image/.test(file.type)) {
        showSlider(file);
    } else {
        // open file in new tab
        let win = window.open(file.file, '_blank');
        win.focus();
    }
});

export const fileViewer = function () {
    return {
        filter : function (filter) {
            if (fileFilter === undefined) {
                fileFilter = filter;
            } else {
                console.error('c-gallery:fileFilter can be only registered ones!');
            }
        }
    }
};
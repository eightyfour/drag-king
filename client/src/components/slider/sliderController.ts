import { show, hide } from './slider';
import * as whisker from 'canny/mod/whisker';
import * as trade from '../../trade';

const itemImageTemplate = require('./item-image.html');
// keep this list in sync with all files updates so the slider will be actual
let actualFileList = [];

trade.on({
    getFiles : function (data) {
        // TODO image filter
        actualFileList = data.filter((file) => /image/.test(file.type));
    },
    deleteFile : function (err, filePath) {
        if (!err) {
            actualFileList = actualFileList.filter((f) => f.file !== filePath);
            console.log('sliderController:deleteFile', filePath, actualFileList);

        }
    },
    fileSend : function (err, file) {
        if (!err && /image/.test(file.type)) {
            actualFileList.push(file);
        }
    }
});

export function showSlider(file) {
    console.log('sliderController:showSlider', file);
    show(actualFileList.map((file) => {
        const div = document.createElement('div');
        div.innerHTML = itemImageTemplate;
        whisker.add(div, (fc) => {
        	fc({
                src : file.file,
                imageName : file.name,
                fullPathName : file.file
            })
        });
        return div.children[0];
    }), actualFileList.indexOf(file));
}
export const sliderController = function () {
    console.log('sliderController:sliderController');
    window.addEventListener('keydown', function(e) {
        if ((e.key=='Escape'||e.key=='Esc'||e.keyCode==27)) {
            hide();
            e.preventDefault();
            return false;
        }
    }, true);
};
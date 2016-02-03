/**
 * TODO:
 * * update slider if new files are added
 * * update slider if file was deleted
 *
 * @type {exports}
 */
var trade = require('./trade.js'),
    slider = require('./c-slider.js'),
    actualFiles = [],
    brain = {
        main : {
            init : function (node) {
                this.node = node;
            }
        },
        close : {
            init : function (node) {
                node.addEventListener('click', function () {
                    brain.main.node.classList.remove('c-show');
                })
            }
        },
        show : {
            init : function (node) {
                node.addEventListener('click', function () {
                    brain.main.node.classList.add('c-show');
                    slider.initializeSlider('imagePreview');
                })
            }
        },
        bgImage : {
            init : function (node) {
                this.node = node;
            }
        }
    };

trade.on({
    /**
     * If it called twice we have a problem so the slider can't handle this yet
     * @param files
     */
    getFiles : function (files) {
        var children = [];
        // TODO filter only images
        files.forEach(function (file) {
            if(/image\/.*/.test(file.type)){
                actualFiles.push(file.file);
            }
        });
        actualFiles.forEach(function (file) {
           var wrap = document.createElement('div'),
               img = new Image();
            img.src = file;
            img.className = "image-preview-box-content-picture";
            wrap.appendChild(img);
            children.push(wrap);
        });
        // expect it starts with index 0
        brain.bgImage.node.style.backgroundImage = 'url(' + actualFiles[0] + ')';
        slider.addItems('imagePreview', children);
    }
})
module.exports = {
    show : function () {
        brain.main.classList.add('c-show');
    },
    add : function (node, attr) {
        if (brain.hasOwnProperty(attr)) {
            brain[attr].init(node)
        }
    },
    ready : function () {
        slider.onSlideChangeListener('imagePreview', function (idx) {
           brain.bgImage.node.style.backgroundImage = 'url(' + actualFiles[idx] + ')';
        });
    }
}
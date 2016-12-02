var canny = require('canny'),
    trade = require('./trade.js');
require('./uploadBox.js');
canny.add('upload', require('./c-upload.js'));
canny.add('icons', require('./icons'));
canny.add('gallery', require('./c-gallery.js'));
canny.add('folderNav', require('./c-folderNav.js'));
canny.add('listFolders', require('./c-listFolders.js'));
canny.add('newFolder', require('./c-newFolder.js'));
canny.add('slider', require('./c-slider.js'));
canny.add('imagePreviewer', require('./c-imagePreviewer.js'));
canny.add('fileDownLoaderFormat', require('./c-fileDownLoaderFormat.js'));

// var octicons = require("octicons");
//
// var style = document.createElement('style'),
//     s = '.octicon {fill: currentColor;width:1em;height:1em;vertical-align: text-top;display: inline-block;}';

// background: url("data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M8.865 1.52c-.18-.31-.51-.5-.87-.5s-.69.19-.87.5L.275 13.5c-.18.31-.18.69 0 1 .19.31.52.5.87.5h13.7c.36 0 .69-.19.86-.5.17-.31.18-.69.01-1L8.865 1.52zM8.995 13h-2v-2h2v2zm0-3h-2V6h2v4z"/></svg>") no-repeat;
// background: url("data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M8.865 1.52c-.18-.31-.51-.5-.87-.5s-.69.19-.87.5L.275 13.5c-.18.31-.18.69 0 1 .19.31.52.5.87.5h13.7c.36 0 .69-.19.86-.5.17-.31.18-.69.01-1L8.865 1.52zM8.995 13h-2v-2h2v2zm0-3h-2V6h2v4z"/></svg>
// background: url(data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='30' height='30'><circle cx='15' cy='15' r='10' /></svg>) no-repeat;
// background: url(data:image/svg+xml,<svg viewBox='0 0 40 40' height='25' width='25' xmlns='h…08,11.899L12.958,19.648L25.877,6.733L28.707,9.561L12.958,25.308Z' /></svg>);
// background-repeat: no-repeat;

// style.setAttribute('type', 'text/css');
// Object.keys(octicons).forEach(function (key) {
//     console.log('render octicon', key);
//     s += `.octicon.octicon-${key}, .octicon.octicon-before-${key}::before{ background: url('data:image/svg+xml;utf8,${octicons[key].toSVG({ "width": "inherit" }).replace('version="1.1"', 'xmlns="http://www.w3.org/2000/svg"')}') no-repeat;}`;
// });
// style.innerHTML = s;
// document.body.appendChild(style);

trade.on({
    getFiles : function (files) {
        console.log('main:new files was loaded', files);
    },
    deleteFile : function (file) {
        console.log('main:files was deleted', file);
    }
});

canny.ready(function () {
    // load initial files
    trade.doCall('getFiles')(location.pathname);
});
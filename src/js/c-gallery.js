/**
 *  Rename the files it also show normal files
 */
var trade = require('./trade.js');

function getRandomColor() {
    function c() {
        return Math.floor(Math.random()*256).toString(10)
    }
    console.log('c-gallery:getRandomColor', "rgba("+c()+","+c()+","+c()+", 0.2)");
    return "rgba("+c()+","+c()+","+c()+", 0.2)";
}

var node;
module.exports = (function () {

    function getOpenLink(file) {
        var openButton = document.createElement('a');

//        openButton.className = 'open-btn octicon octicon-file-symlink-file';
        openButton.className = 'open-btn';
        openButton.setAttribute('href', 'http://' + location.host + file.file);
        openButton.setAttribute('target', '_blank');
        openButton.setAttribute('title', 'Open in new tab');
        return openButton;
    }

    function appendImage(container, file) {
        var imgNode = document.createElement('div'),
            openButton = getOpenLink(file),
            removeBtn = document.createElement('div'),
            controlPanel = document.createElement('div'),
            myImage = new Image(),
            fileName = file.file + '?time=' + new Date() / 1000;

        container.setAttribute('id', file.file);
        container.className = 'gallery-image-wrap';
        container.style.backgroundColor = getRandomColor();
        myImage.src = fileName ;
        myImage.addEventListener('load', function () {
            container.classList.add('c-loaded');
            container.style.backgroundColor = 'transparent';
        });
        imgNode.style.backgroundImage = "url(" + fileName + ")";
        imgNode.className = 'img';
        removeBtn.className = 'deleteBtn octicon octicon-trashcan';
        controlPanel.className = 'controlPanel';
        container.appendChild(imgNode);
        controlPanel.appendChild(removeBtn);
        imgNode.appendChild(controlPanel);
        openButton.appendChild(myImage);
        container.appendChild(openButton);

        removeBtn.setAttribute('title', 'remove this image');

        // register click listener for the remove duel request
        removeBtn.addEventListener('click', function () {
          trade.doCall('deleteFile')(file.file, function () {
              container.remove();
          })
        });
        return container;
    }

    function appendFile(container, file) {
        var icon = document.createElement('span'),
            removeBtn = document.createElement('div'),
            controlPanel = document.createElement('div'),
            openButton = getOpenLink(file),
            textNode = document.createTextNode(file.name);

        container.setAttribute('id', file.file);

        container.classList.add('gallery-file-wrap');

        icon.className = "file-icon octicon octicon-file-text";

        removeBtn.className = 'deleteBtn octicon octicon-trashcan';
        controlPanel.className = 'controlPanel';
        icon.appendChild(textNode);
        openButton.appendChild(icon);
        controlPanel.appendChild(removeBtn);
        container.appendChild(controlPanel);
        container.appendChild(openButton);

        removeBtn.setAttribute('title', 'remove this file');

        // register click listener for the remove duel request
        removeBtn.addEventListener('click', function () {
            trade.doCall('deleteFile')(file.file, function () {
                container.remove();
            })
        });

        return container;
    }

    function createFile(div, file) {
        var fileNode;
        if(/image\/.*/.test(file.type)) {
            fileNode = appendImage(div, file);
        } else {
            fileNode = appendFile(div, file);
        }
        return fileNode;
    }

    function addFile(file) {
        var div = document.getElementById(file.file);
        if (!div) {
           div = document.createElement('div');
           node.appendChild(createFile(div, file));
        } else {
            div.innerHTML = '';
            createFile(div, file);
            div.classList.add('c-fileupdated');
            setTimeout(function () {
                if (div) {
                    div.classList.remove('c-fileupdated');
                }
            }, 4000)
        }
    }

    trade.on({
        getFiles : function (data) {
            data.forEach(function (file) {
                addFile(file);
            });
        },
        fileSend : function (file) {
            addFile(file);
        }
    });

    return {
        add : function (elem, attr) {
            node = elem;
        },
        ready : function () {

        }
    }
}());





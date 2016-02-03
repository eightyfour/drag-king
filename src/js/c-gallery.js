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

    function appendImage(file) {
        var container = document.createElement('div'),
            imgNode = document.createElement('div'),
            openButton = getOpenLink(file),
            removeBtn = document.createElement('div'),
            controlPanel = document.createElement('div'),
            myImage = new Image();


        container.className = 'gallery-image-wrap';
        container.style.backgroundColor = getRandomColor();
        myImage.src = file.file;
        myImage.addEventListener('load', function () {
            container.classList.add('c-loaded');
            container.style.backgroundColor = 'transparent';
        });
        imgNode.style.backgroundImage = "url(" + file.file + ")";
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

    function appendFile(file) {
        var container = document.createElement('div'),
            icon = document.createElement('span'),
            removeBtn = document.createElement('div'),
            controlPanel = document.createElement('div'),
            openButton = getOpenLink(file),
            textNode = document.createTextNode(file.name);


        container.className = 'gallery-file-wrap';
//        container.style.backgroundColor = getRandomColor();

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

    trade.on({
        getFiles : function (data) {
            data.forEach(function (file) {
                if(/image\/.*/.test(file.type)) {
                    node.appendChild(appendImage(file));
                } else {
                    node.appendChild(appendFile(file));
                }
            });
        },
        fileSend : function (file) {
            // only interest in images
            if(/image\/.*/.test(file.type)){
                node.appendChild(appendImage([file]));
            } else {
                node.appendChild(appendFile(file));
            }
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





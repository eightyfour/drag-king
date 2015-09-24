var trade = require('./trade.js');

/**
 *
 * @returns {{add: Function, ready: Function}}
 */
function setupZeroClipboard(imageNode, url){
    var fullUrl = location.origin + url;
    var client = new ZeroClipboard(imageNode);
    client.on('ready', function(event){
        client.on( 'copy', function(event) {
            event.clipboardData.setData('text/plain', fullUrl);
        });
        client.on('aftercopy', function(event){
            imageNode.parentNode.classList.add('copied');
            imageNode.parentNode.setAttribute('data', url);
            console.debug('You just copied', fullUrl);
        })
    });
}

function getRandomColor() {
    function c() {
        return Math.floor(Math.random()*256).toString(10)
    }
    console.log('c-gallery:getRandomColor', "rgba("+c()+","+c()+","+c()+", 0.2)");
    return "rgba("+c()+","+c()+","+c()+", 0.2)";
}

var node;
module.exports = (function () {

    function appendImage(path) {
        var container = document.createElement('div'),
            imgNode = document.createElement('div'),
            clipNode = document.createElement('div'),
            removeBtn = document.createElement('div'),
            myImage = new Image();


        container.className = 'gallery-image-wrap';
        container.style.backgroundColor = getRandomColor();
        myImage.src = path;
        myImage.addEventListener('load', function () {
            container.classList.add('c-loaded');
            container.style.backgroundColor = 'transparent';
        });
        imgNode.style.backgroundImage = "url(" + path + ")";
        imgNode.className = 'img';
        removeBtn.className = 'deleteBtn';
        clipNode.className = 'copyClipNode';
        container.appendChild(imgNode);
        imgNode.appendChild(removeBtn);
        imgNode.appendChild(clipNode);
        container.appendChild(myImage);
        node.appendChild(container);

        removeBtn.setAttribute('title', 'remove this image');
        clipNode.setAttribute('title', 'Click to copy to clip board');

        // register click listener for the remove duel request
        removeBtn.addEventListener('click', function () {
          trade.doCall('deleteFile')(path, function () {
              container.remove();
          })
        });

        setupZeroClipboard(clipNode, path);
    }

    trade.on({
        getFiles : function (data) {
            data.forEach(function (path) {
                appendImage(path);
            });
        },
        fileSend : function (file) {
            // only interest in images
            if(/image\/.*/.test(file.type)){
                appendImage([file.file]);
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





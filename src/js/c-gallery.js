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
module.exports = function () {

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
           var xhr = new XMLHttpRequest();
            xhr.open("POST", "/deleteFile?filename=" + path, true);
            xhr.onload = function (e) {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        container.remove();
                    } else {
                        console.error(xhr.statusText);
                    }
                }
            };
            xhr.onerror = function (e) {
                console.error(xhr.statusText);
            };
            xhr.send(null);
        });

        setupZeroClipboard(clipNode, path);
    }

    function addImage(imagePath){
         // array is a object :)
            if (typeof imagePath === 'object') {
               imagePath.forEach(function (path) {
                   appendImage(path);
               });
            } else {
                appendImage(imagePath);
            }
    }
    return {
        add : function (elem, attr) {
            node = elem;
        },
        /**
         * pass and array of images paths or an single path as string
         */
        addImage : addImage,
        ready : function () {
            var xhr = new XMLHttpRequest();
            xhr.open("POST", "/getFiles", true);
            xhr.onload = function (e) {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        addImage(JSON.parse(xhr.responseText));
                    } else {
                        console.error(xhr.statusText);
                    }
                }
            };
            xhr.onerror = function (e) {
                console.error(xhr.statusText);
            };
            xhr.send(location.pathname);
        }
    }
};





/**
 *
 * @returns {{add: Function, ready: Function}}
 */
var node;
module.exports = function () {
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
    return {
        add : function (elem, attr) {
            node = elem;
        },
        addImage : function(url){
            var container = document.createElement('div');
            container.className = 'container';
            var myImage = new Image(300);
            myImage.src = url;
            container.appendChild(myImage);
            node.appendChild(container);
            setupZeroClipboard(myImage, url);
        }
    }
};





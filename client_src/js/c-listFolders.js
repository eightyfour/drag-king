var octicons = require('octicons');

function doPost(url, data, done) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/" + url, true);
    xhr.onload = function (e) {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                done(JSON.parse(xhr.responseText));
            } else {
                console.error(xhr.statusText);
            }
        }
    };
    xhr.onerror = function (e) {
        console.error(xhr.statusText);
    };
    xhr.send(data);
}
/**
 *
 * @returns {{add: Function, ready: Function}}
 */
module.exports = function () {

    var node;

    function printFolders(folders) {
        var path = location.pathname;
        if (path[path.length - 1] !== '/') {
            path += '/';
        }
        folders.forEach(function (folder) {
            var li = document.createElement('li');
            li.innerHTML = octicons['file-directory'].toSVG();
            li.appendChild(document.createTextNode(folder));
            li.addEventListener('click', function () {
                location.href = path + folder;
            });
            node.appendChild(li);
        });
    }

    return {
        add : function (elem, attr) {
            node = elem;
        },
        ready : function () {
            doPost('getFolders', location.pathname, printFolders);
        }
    }
};
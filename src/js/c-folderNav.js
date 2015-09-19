
/**
 *
 * @returns {{add: Function, ready: Function}}
 */
module.exports = function () {

    var node,
        template;

    function createFolderNavigation() {
        var paths = location.pathname.split('/'),
            folderLink = '/',
            child, i, folder;

        function cloneItem() {
            var child = template.cloneNode(true);
            child.children[0].innerHTML = '';
            child.children[0].setAttribute('href', folderLink);
            child.children[0].appendChild(document.createTextNode(folder));
            return child;
        }

        function createLastActive() {
            var li = document.createElement('li');
            li.classList.add('active');
            li.appendChild(document.createTextNode(folder));
            return li;
        }

        for (i = 1; i < paths.length; i++) {
            folder = paths[i];
            folderLink += folder + '/';
            if (i < paths.length - 1) {
                child = cloneItem();
            } else {
                child = createLastActive();
            }
            node.appendChild(child);
        }
    }

    return {
        add : function (elem, attr) {
            node = elem;
            template = node.children[0];
        },
        ready : function () {
            createFolderNavigation();
        }
    }
};
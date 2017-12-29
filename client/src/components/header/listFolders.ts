import { FolderItem } from '../../model/Folder'
import * as octicons from 'octicons';
import * as contextMenu from '../contextMenu/contextMenu';

let node;

function renderHoverMenuItems(node, children) {
    const ul = document.createElement('ul');
    children.forEach((item) => {
        if (item.type === 'directory') {
            const li = createLiItem(item.path.replace(item.name, ''), item.name);
            ul.appendChild(li);
        }
    });
    node.appendChild(ul);
}

function addHoverDirectoryTreeMenu(node, folders:Array<FolderItem>) {
    [...node.querySelectorAll('li[data-name]')].forEach((li) => {
        let init = false;
        li.addEventListener('mouseover', (e) => {
            const children = folders.find((item) => {
                    // get correct children item
                    return item.name === li.dataset.name;
                }).children;

            if (children) {
                const childrenFolder = children.filter((item) => {
                    // filter list to get only directories
                    return item.type === 'directory' ? item : undefined
                });
                if (childrenFolder.length > 0) {
                    if (!init) {
                        init = true;
                        li.classList.add('show-sub-menu');
                        // render first time
                        renderHoverMenuItems(li, children);
                        addHoverDirectoryTreeMenu(li, children);
                    } else {
                        li.classList.add('show-sub-menu');
                    }
                }
            }
        });
        li.addEventListener('mouseleave', (e) => {
            li.classList.remove('show-sub-menu');
        });
    })
}

function createLiItem (path, name) {
    const li = document.createElement('li');
    const span = document.createElement('span');
    li.innerHTML = octicons['file-directory'].toSVG();
    span.appendChild(document.createTextNode(name));
    li.appendChild(span);
    contextMenu.add(li, name);

    li.addEventListener('click', function (e) {
        location.href = path + name;
        e.stopPropagation();
    });
    li.dataset.name = name;
    return li;
}

export const listFolders = function (folders:Array<FolderItem>) {
    addHoverDirectoryTreeMenu(node, folders.filter((item) => {
        return item.type === 'directory' ? item : undefined
    }));
};

function printFolders(folders) {
    let path = location.pathname;
    if (path[path.length - 1] !== '/') {
        path += '/';
    }
    folders.forEach(function (folder) {
        node.appendChild(createLiItem(path, folder));
    });
}

export const listFoldersCannyMod = function () {
    return {
        add : function (elem, attr) {
            node = elem;
            fetch('/getFolders', {method: 'POST', body: location.pathname}).then((response) => {
                return response.json();
            }).then((folders) => {
                printFolders(folders);
            }).catch((e) => {
                console.error('listFolders:problems to get folders from server', e);
            });
        }
    }
};
import { FolderItem } from '../../model/Folder'
import * as contextMenu from '../contextMenu/contextMenu'
import { folderTree }  from '../folderTree/folderTree'

let node;
const folderTreeInstance = folderTree();

folderTreeInstance.onItemClicked((path, name) => {
    location.href = path + name;
});

export const listFolders = function (folders:Array<FolderItem>) {
    folderTreeInstance.render(node, folders.filter((item) => {
        return item.type === 'directory' ? item : undefined
    }));
};

function printFolders(folders) {
    let path = location.pathname;
    if (path[path.length - 1] !== '/') {
        path += '/';
    }
    folders.forEach(function (folder) {
        let liItem = folderTreeInstance.createLiItem(path, folder);
        contextMenu.add(liItem, folder);
        node.appendChild(liItem);
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
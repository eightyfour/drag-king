import { FolderItem } from '../../model/Folder'
import * as url from 'canny/mod/url.js';
import * as contextMenu from '../contextMenu/contextMenu'
import { folderTree }  from '../folderTree/folderTree'
import { pageEnvironment } from '../../pageEnvironment'

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
        contextMenu.add(liItem, {path: path, name: folder});
        node.appendChild(liItem);
    });
}

export const listFoldersCannyMod = function () {
    return {
        add : function (elem, attr) {
            node = elem;
        },
        ready : () => {
            fetch('/getFolders', {method: 'POST', body: location.pathname}).then((response) => {
                return response.json();
            }).then((folders) => {
                const allowAll = url.getURLParameter('admin') !== false;
                return new Promise((res, err) => {
                    pageEnvironment.getConfig((config) => {
                        res(folders.filter((folder) => {
                            return folder[0] !== '.' || (allowAll && (config.isAdmin || config.name === 'anonymous'))
                        }))
                    })
                })
            }).then((folders) => {
                printFolders(folders);
            }).catch((e) => {
                console.error('listFolders:problems to get folders from server', e);
            });
        }
    }
};
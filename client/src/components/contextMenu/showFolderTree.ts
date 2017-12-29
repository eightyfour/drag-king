import { tradeWs, serverCalls } from '../../tradeWs';
import { FolderItem } from '../../model/Folder'

let folderTree;
const template = "<div><ul><li data-name='/'>/</li></ul></div>";


function listFolders(folders:Array<FolderItem>) {
    const node = document.createElement('div');
    node.innerHTML = template;

    return node;
}


export function getFolderTree(cb) {

    if (!folderTree) {
        tradeWs.request(serverCalls.getDirectoryTree, location.pathname, function (result) {
            if (result) {
                folderTree = result;
                cb(listFolders(folderTree));
            } else {
                console.log('headerController:there are no sub folders :(');
            }
        });
    } else {
        cb(listFolders(folderTree));
    }
}
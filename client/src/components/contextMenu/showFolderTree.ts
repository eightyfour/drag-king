import * as whisker from 'canny/mod/whisker'
import { tradeWs, serverCalls } from '../../tradeWs'
import { FolderItem } from '../../model/Folder'
import { folderTree } from '../folderTree/folderTree'

let folders,
    whiskerFc;
const renderFolderTree = folderTree();
const template =
    "<div class='content'>" +
    "<h3>Select a folder</h3>" +
    "<p>{{item.path}} <strong>{{item.name}}</strong></p>" +
    "<ul wk-bind='item.content'></ul>" +
    "</div>";

renderFolderTree.onItemClicked((path, name) => {
    console.log('showFolderTree:', path, name);
});

renderFolderTree.onItemHover((path, name) => {
    console.log('showFolderTree:', path, name);
    whiskerFc({
        path : path + name
    })
});

function listFolders(folders:Array<FolderItem>, config:{name:string}) {
    const node = document.createElement('div');
    const ul = document.createElement('ul');
    node.style.position= 'fixed';
    node.style.zIndex= '99999';
    node.style.top= '0';
    node.style.bottom= '0';
    node.style.left= '0';
    node.style.right= '0';
    node.className = 'folders contextMenu--folderTree';
    node.innerHTML = template;
    whisker.add(node, (wfc)=> {
        whiskerFc = wfc;
        whiskerFc({
            path : '/',
            name : config.name,
            content : function (ul) {
                ul.appendChild(renderFolderTree.createLiItem('/', '/'));
                renderFolderTree.render(ul, folders.filter((item) => {
                    return item.type === 'directory' ? item : undefined
                }));
            }
        })
    });
    // temporary
    node.addEventListener('click', () => {
        node.remove();
    });

    return node;
}

/**
 *
 * @param cb
 * @param config
 */
export function getFolderTree(cb, config:{name:string}) {

    if (!folders) {
        tradeWs.request(serverCalls.getDirectoryTree, '/', function (result) {
            if (result) {
                folders = result;
                cb(listFolders(folders, config));
            } else {
                console.log('headerController:there are no sub folders :(');
            }
        });
    } else {
        cb(listFolders(folders, config));
    }
}
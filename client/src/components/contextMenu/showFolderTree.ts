import * as whisker from 'canny/mod/whisker'
import { tradeWs, serverCalls } from '../../tradeWs'
import { FolderItem } from '../../model/Folder'
import { folderTree } from '../folderTree/folderTree'

let folders,
    whiskerFc;

const renderFolderTree = folderTree();
const templateCopy = require('./showFolderTree.html');
let actualSelected = '/';

function minimizeSlashes(s) {
    while(/\/\//.test(s))
        s = s.replace('//','/');
    // add slash at the end
    s += s[s.length -1 ] !== '/' ? '/' : '';
    return s;
}

renderFolderTree.onItemClicked(function (path, name) {
    this.close();
    console.log('showFolderTree:', path, name);
});

renderFolderTree.onItemHover((path, name) => {
    actualSelected = minimizeSlashes(path + name);
    whiskerFc({
        path : actualSelected
    })
});

function listFolders(folders:Array<FolderItem>, config:{name:string, path:string, mode:string, success : (result:(null|{from:{path:string,name:string}, to:{path:string,name:string}})) => void}) {
    const node = document.createElement('div');
    node.style.position= 'fixed';
    node.style.zIndex= '99999';
    node.style.top= '0';
    node.style.bottom= '0';
    node.style.left= '0';
    node.style.right= '0';
    node.className = 'folders contextMenu--folderTree';
    node.innerHTML = templateCopy;

    actualSelected = config.path;

    whisker.add(node, (wfc)=> {
        whiskerFc = wfc;
        whiskerFc({
            mode : config.mode === 'copy' ? 'Copy' : 'Move',
            original : config.path + config.name,
            path : actualSelected,
            name : config.name,
            content : function (ul) {
                ul.appendChild(renderFolderTree.createLiItem('/', '/'));
                renderFolderTree.render(ul, folders.filter((item) => {
                    return item.type === 'directory' ? item : undefined
                }));
            },
            clickPath : (node) => {
                node.addEventListener('click', () => {
                    let res = prompt('Destination path:', actualSelected);
                    if (res) {
                        actualSelected = minimizeSlashes(res)
                        whiskerFc({
                            path : actualSelected
                        })
                    }
                })
            },
            button : (n) => {
               n.addEventListener('click', () => {
                   config.success.apply({
                       close: () => { node.remove();}
                   }, [({from: {path : config.path, name: config.name},
                       to: { path: actualSelected, name: config.name }})])
               })
            },
            cancel : (n) => {
               n.addEventListener('click', () => {
                   node.remove();
               })
            }
        })
    });
    node.addEventListener('click', (e) => {
        if (node === e.target) {
            node.remove();
        }
    })
    return node;
}



/**
 * mode : copy|move
 * @param cb
 * @param {{name: string; path: string; success: ((result: {path: string; name: string}) => void); mode: string}} config
 */
export function getFolderTree(cb, config:{name:string, path:string, mode:string, success : (result:(null|{from:{path:string,name:string}, to:{path:string,name:string}})) => void}) {

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
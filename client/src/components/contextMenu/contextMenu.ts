import * as canny from "canny";
import { icons } from '../../misc/icons'
import * as toast from 'message-toast'
import * as whisker from "canny/mod/whisker"
import { getFolderTree } from './showFolderTree';
import { tradeWs, serverCalls } from '../../tradeWs';

const contextMenuStack:Array<HTMLElement> = [];
const contextMenuTemplate:string = (
    "<div class='contextMenu'>" +
        "<h3>{{item.name}}</h3>" +
        "<ul>" +
            "<li wk-bind='item.copy'><i canny-mod='icon' canny-var='clippy'></i><span>Copy</span></li>" +
            "<li wk-bind='item.move'><i canny-mod='icon' canny-var='diff-renamed'></i><span>Move</span></li>" +
            "<li wk-bind='item.rename'><i canny-mod='icon' canny-var='text-size'></i><span>Rename</span></li>" +
            "<li wk-bind='item.remove'><i canny-mod='icon' canny-var='trashcan'></i><span>Delete</span></li>" +
        "</ul>" +
    "</div>");

function setToCursorPosition(node:HTMLElement, e:any) {
    const x = e.clientX;     // Get the horizontal coordinate
    const y = e.clientY;     // Get the vertical coordinate
    node.style.left = x + 'px';
    node.style.top = y + 'px';
    console.log('contextMenu:cursor position', x, y);
}

function showfolderTree(config) {
    getFolderTree((node) => {
        document.body.appendChild(node);
    }, config)
}


function validateFolder(s) {
    return /^[a-zA-Z_+@\-#?!0-9///.]+$/.test(s)
}

function validateName(s) {
    return !(/^[\/]+$/.test(s)) && validateFolder(s);
}

function CreateContextMenu(obj:{name: string, path:string}) {
    let contextMenuNode = document.createElement('div');
    contextMenuNode.style.position= 'fixed';
    contextMenuNode.style.zIndex= '99999';
    contextMenuNode.style.top= '0';
    contextMenuNode.style.bottom= '0';
    contextMenuNode.style.left= '0';
    contextMenuNode.style.right= '0';
    contextMenuNode.innerHTML = contextMenuTemplate;
    whisker.add(contextMenuNode, {
        name: obj.name,
        copy : (node) => {
            node.addEventListener('click', ()=> {
                // prompt('Enter a new location', obj.name);
                showfolderTree({
                    name : obj.name,
                    path: obj.path,
                    mode: 'copy',
                    success: function (res) {
                        if (res) {
                            let destination = res.to.path + res.to.name;
                            if (destination[0] !== '/') {
                                destination = res.from.path + destination;
                            }
                            if (!validateFolder(destination)) {
                                alert('ERROR!\n\nThe folder is not correct and contains invalid characters');
                                return;
                            }
                            if (confirm('Copy to ' + destination)) {
                                tradeWs.request<{ from: string; to: string }>(serverCalls.copy, obj.path + obj.name, destination)
                                    .then(({ to }) => {
                                        toast.showMessage(`Copy to <a href='${to}'>${to}</a>`);
                                        this.close();
                                    })
                                    .catch((error) => {
                                        console.error('Copy failed:', error);
                                        toast.showMessage(`Copy failed: ${error.message}`);
                                    });
                            }
                        }
                    }
                });
            })
        },
        move : (node) => {
            node.addEventListener('click', ()=> {
                // prompt('Enter a new location', obj.name);
                showfolderTree({
                    name : obj.name,
                    path: obj.path,
                    mode: 'move',
                    success: function (res) {
                        if (res) {
                            let destination = res.to.path + res.to.name;
                            if (destination[0] !== '/') {
                                destination = res.from.path + destination;
                            }
                            if (!validateFolder(destination)) {
                                alert('ERROR!\n\nThe folder is not correct and contains invalid characters');
                                return;
                            }
                            if (confirm('Move to ' + destination)) {
                                tradeWs.request<{ from: string; to: string }>(serverCalls.move, obj.path + obj.name, destination)
                                    .then(({ to }) => {
                                        toast.showMessage(`Move to <a href='${to}'>${to}</a>`);
                                        this.close();
                                    })
                                    .catch((error) => {
                                        console.error('Move failed:', error);
                                        toast.showMessage(`Move failed: ${error.message}`);
                                    });
                            }
                        }
                    }
                });
            })
        },
        remove : (node) => {
            node.addEventListener('click', ()=> {
                if (confirm('Delete this folder?\n\n' + obj.path + obj.name)) {
                    tradeWs.request<{ file: string }>(serverCalls.remove, obj.path + obj.name)
                        .then(({ file }) => {
                            toast.showMessage(`File removed ${file}`);
                            contextMenuNode.remove();
                        })
                        .catch((error) => {
                            console.error('Delete failed:', error);
                            toast.showMessage(`Delete failed: ${error.message}`);
                        });
                }
            })
        },
        rename : (node) => {
            node.addEventListener('click', ()=> {
                let newName = prompt('Enter a new name', obj.name);
                if (!newName) return;
                if (!validateName(newName)) {
                    alert('ERROR!\n\nNew name contains invalid characters:\n\n' + newName);
                    return;
                }

                if (confirm(`Confirm:\n\nRename folder to "${newName}"?`)) {
                    tradeWs.request<{ from: string; to: string }>(serverCalls.rename, obj.path + obj.name, obj.path + newName).then(({ from, to }) => {
                        contextMenuNode.remove();
                        toast.showMessage(`Rename from ${from} to ${to}`);
                    }).catch((error) => {
                        if (error.name === 'EEXIST' || error.name === 'ENOTEMPTY') {
                                if (confirm('Hups the folder already exists!!\n\n' +
                                        'Do you want to copy the content into the existing folder ' + newName + '?')) {
                                    tradeWs.request(serverCalls.copy, obj.path + obj.name, obj.path + newName).then(() => {
                                        toast.showMessage(`Folder merged <a href='${newName}'>${newName}</a>`);
                                        return tradeWs.request(serverCalls.remove, obj.path + obj.name);
                                    }).catch((error) => {
                                        console.error('Folder merge failed:', error);
                                        toast.showMessage(`Folder merge failed: ${error.message}`);
                                    });
                                } else {
                                    toast.showMessage(`Rename failed - Folder already exists!`);
                                }
                        } else {
                            console.error('Rename failed:', error);
                            toast.showMessage(`Rename failed: ${error.message}`);
                        }
                    });
                }
            })
        }
    });
    // parse HTML to initialize the octicon icons
    canny.cannyParse.apply({
        icon : icons,
    }, [contextMenuNode]);
    return contextMenuNode;
}

/**
 * Canny add method
 *
 * @param node
 * @param attr
 */
export function add (node, attr:{path:string, name:string}) {
    node.addEventListener('contextmenu', (e) => {

        let menuNode = CreateContextMenu(attr);
        menuNode.classList.add('contextMenu--overlay');
        menuNode.addEventListener('click', () => {
            // while (contextMenuStack.length > 0) {
            //     let item:Element = contextMenuStack.splice(0, 1)[0];
            //     item.remove();
            // }
            menuNode.remove();
        });
        // contextMenuStack.push(menuNode);
        setToCursorPosition(<HTMLElement>menuNode.children[0], e);
        document.body.appendChild(menuNode);

        e.preventDefault();
        e.stopPropagation();
    })
}

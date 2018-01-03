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
                                tradeWs.request(serverCalls.move, obj.path + obj.name, res.to.path + res.to.name, (from, to) => {
                                    this.close();
                                    // handle toast in separate component
                                    toast.showMessage(`Copy to <a href='${to}'>${to}</a>`);
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
                                tradeWs.request(serverCalls.move, obj.path + obj.name, res.to.path + res.to.name, (from, to) => {
                                    this.close();
                                    // handle toast in separate component
                                    toast.showMessage(`Move to <a href='${to}'>${to}</a>`);
                                });
                            }
                        }
                    }
                });
            })
        },
        remove : (node) => {
            node.addEventListener('click', ()=> {
                if (confirm('Are you sure you want delete this folder?\n\n' + obj.path + obj.name)) {
                    // TODO remove
                    tradeWs.request(serverCalls.remove, obj.path + obj.name, (file) => {
                        contextMenuNode.remove();
                        toast.showMessage(`File removed ${file}`);
                    });
                }
            })
        },
        rename : (node) => {
            node.addEventListener('click', ()=> {
                let newName = prompt('Enter a new name', obj.name);
                if (!newName || !validateName(newName)) {
                    alert('ERROR!\n\nNew name contains invalid characters:\n\n' + newName);
                    return;
                }

                if (confirm('Rename file to ' + newName)) {
                    // TODO send
                    tradeWs.request(serverCalls.rename, obj.path + obj.name, obj.path + newName, (from, to) => {
                        contextMenuNode.remove();
                        // handle toast in separate component
                        toast.showMessage(`Rename from ${from} to ${to}`);
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

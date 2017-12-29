import * as canny from "canny";
import { icons } from '../../misc/icons'
import * as whisker from "canny/mod/whisker"
import { getFolderTree } from './showFolderTree';

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

function showfolderTree() {
    getFolderTree((node)=> {
        document.body.appendChild(node);
    })
}

function CreateContextMenu(obj:{name: string}) {
    let node = document.createElement('div');
    node.style.position= 'fixed';
    node.style.zIndex= '99999';
    node.style.top= '0';
    node.style.bottom= '0';
    node.style.left= '0';
    node.style.right= '0';
    node.innerHTML = contextMenuTemplate;
    whisker.add(node, {
        name: obj.name,
        copy : (node) => {
            node.addEventListener('click', ()=> {
                prompt('Enter a new location', obj.name);
                showfolderTree();
            })
        },
        move : (node) => {
            node.addEventListener('click', ()=> {
                prompt('Enter a new name', obj.name);
            })
        },
        remove : (node) => {
            node.addEventListener('click', ()=> {
                confirm('Are you sure you want delete this folder?');
            })
        },
        rename : (node) => {
            node.addEventListener('click', ()=> {
                prompt('Enter a new name', obj.name);
            })
        }
    });
    // parse HTML to initialize the octicon icons
    canny.cannyParse.apply({
        icon : icons,
    }, [node]);
    return node;
}

/**
 * Canny add method
 *
 * @param node
 * @param attr
 */
export function add (node, attr?) {
    node.addEventListener('contextmenu', (e) => {

        let menuNode = CreateContextMenu({ name : attr});
        menuNode.classList.add('contextMenu--overlay');
        menuNode.addEventListener('click', () => {
            while (contextMenuStack.length > 0) {
                let item:Element = contextMenuStack.splice(0, 1)[0];
                item.remove();
            }
        });
        contextMenuStack.push(menuNode);
        setToCursorPosition(<HTMLElement>menuNode.children[0], e);
        document.body.appendChild(menuNode);

        e.preventDefault();
        e.stopPropagation();
    })
}

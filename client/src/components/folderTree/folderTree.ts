import { FolderItem } from '../../model/Folder'
import * as octicons from 'octicons';

export const folderTree = function () {
    const actionQueque = [];
    const hoverQueque = [];

    function renderHoverMenuItems(node, children, context?) {
        const ul = document.createElement('ul');
        children.forEach((item) => {
            if (item.type === 'directory') {
                const li = createLiItem(item.path.replace(item.name, ''), item.name, context);
                ul.appendChild(li);
            }
        });
        node.appendChild(ul);
    }

    function createLiItem (path, name, context?) {
        const li = document.createElement('li');
        const span = document.createElement('span');
        li.innerHTML = octicons['file-directory'].toSVG();
        span.appendChild(document.createTextNode(name));
        li.appendChild(span);

        li.addEventListener('click', function (e) {
            actionQueque.forEach((fc) => {
                fc.apply(context, [path, name]);
            });
            e.stopPropagation();
        });
        li.dataset.name = name;
        li.dataset.path = path;
        return li;
    }

    return {
        /**
         * register a click listener
         * @param fc
         */
        onItemClicked : function (fc:(path:string, name:string)=>void) {
            actionQueque.push(fc);
        },
        /**
         * register a mouse over listener which is called for each hovered item
         * @param fc
         */
        onItemHover : function (fc:(path:string, name:string)=>void) {
            hoverQueque.push(fc);
        },
        render : function addHoverDirectoryTreeMenu(node, folders: Array<FolderItem>) {
            const currentMouseHover = {path:'', name:''};

            [...node.querySelectorAll('li[data-name]')].forEach((li) => {
                let init = false;

                li.addEventListener('mouseover', (e) => {
                    let children;
                    // is it home then return all children
                    if (li.dataset.name === '/') {
                        children = folders;
                    }else {
                        children = folders.find((item) => {
                            // get correct children item
                            return item.name === li.dataset.name;
                        }).children;
                    }

                    if (currentMouseHover.path !== li.dataset.path && currentMouseHover.name !== li.dataset.name) {
                        currentMouseHover.path = li.dataset.path;
                        currentMouseHover.name = li.dataset.name;
                        hoverQueque.forEach((fc) => {
                            fc(currentMouseHover.path, currentMouseHover.name);
                        })
                    }

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
                                renderHoverMenuItems(li, children, {
                                    close : () => {
                                        [...node.querySelectorAll('li.show-sub-menu')].forEach((li) => {
                                            li.classList.remove('show-sub-menu');
                                        })
                                    }
                                });
                                addHoverDirectoryTreeMenu(li, children);
                            } else {
                                li.classList.add('show-sub-menu');
                            }
                        }
                    }
                    e.stopPropagation();

                });
                li.addEventListener('mouseleave', (e) => {
                    li.classList.remove('show-sub-menu');
                    currentMouseHover.path = '';
                    currentMouseHover.name = '';
                });
            })
        },
        createLiItem : createLiItem
    }
};
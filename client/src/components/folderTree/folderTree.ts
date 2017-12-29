import { FolderItem } from '../../model/Folder'
import * as octicons from 'octicons';

export function createLiItem (path, name) {
    const li = document.createElement('li');
    const span = document.createElement('span');
    li.innerHTML = octicons['file-directory'].toSVG();
    span.appendChild(document.createTextNode(name));
    li.appendChild(span);

    li.addEventListener('click', function (e) {
        location.href = path + name;
        e.stopPropagation();
    });
    li.dataset.name = name;
    return li;
}

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

export const folderTree = function addHoverDirectoryTreeMenu(node, folders:Array<FolderItem>) {
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
};
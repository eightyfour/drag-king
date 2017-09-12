import * as canny from 'canny';
import * as repeat from 'canny/mod/repeat';
import { FolderItem } from '../../model/Folder';
import { SearchResultItem } from './SearchResultItem';
import { ArrowKeyItemMarker } from './arrowKeyItemMarker';

const template = require('./fileSearch.html');
const templateSearchItem = require('./fileSearchList.html');
const arrowKeyItemMarker = ArrowKeyItemMarker((selectedNode) => {
    if (selectedNode) {
        onItemSelectFc(itemsForKeyBoardSelection[selectedNode.dataset.idx]);
    }
});

let searchNode,
    searchInput,
    searchOutputNode,
    repeatPointer,
    folderItemsList,
    itemsForKeyBoardSelection:Array<SearchResultItem> = [],
    onItemSelectFc : (item:SearchResultItem) => void;

function filterItems(folderItems:Array<FolderItem>, reg:RegExp): Array<FolderItem>{
    let items:Array<FolderItem> = [];
    folderItems.forEach((item:FolderItem) => {
        if (item.hasOwnProperty('children') && item.children.length > 0) {
            items = items.concat(filterItems(item.children, reg));
        }
        if (reg.test(item.name)) {
            items.push(item);
        }
    });
    return items;
}

function renderResult(fileName:string) {
    const items:Array<FolderItem> = filterItems(folderItemsList, new RegExp(fileName, 'i'));
    repeatPointer(itemsForKeyBoardSelection = items.sort((aItem, bItem) => {
       return aItem.name > bItem.name ? 1 : (aItem.name === bItem.name ? 0 : -1);
    }).map((item, idx) => {
        let extendedItem:SearchResultItem = Object.assign(item);
        // url is used for the click location
        extendedItem.url = item.path;
        if (item.type === 'file') extendedItem.url = item.path.replace(item.name, '');
        extendedItem.cuttedUrl = extendedItem.url.replace(window.location.pathname, '...');
        if (extendedItem.cuttedUrl[extendedItem.cuttedUrl.length - 1] !== '/') extendedItem.cuttedUrl += '/';
        extendedItem.action = (node) => {
            node.dataset.idx = idx + '';
            node.addEventListener('click', () => {
                onItemSelectFc(extendedItem);
            });
        };
        return extendedItem;
    }));
    arrowKeyItemMarker.init(searchOutputNode);
}

export function onItemSelect (fc:(item:SearchResultItem) => void) {
    onItemSelectFc = fc;
}

export function hideSearch () {
    if (searchNode) {
        searchNode.remove();
    }
}

export function showSearch (folderItems:Array<FolderItem>) {
    folderItemsList = folderItems;
    // skip if already shown
    if (searchNode) {
        document.body.appendChild(searchNode);
        searchInput.focus();
        return;
    }

    const div = document.createElement('div');

    div.innerHTML = template;
    searchNode = div.children[0];
    // append first otherwise focus want work
    document.body.appendChild(searchNode);

    canny.cannyParse.apply({
        searchInput : {
            add : (node) => {
                node.focus();
                searchInput = node;
                node.addEventListener('keyup', (e) => {
                    console.log('fileSearch:start search', e.keyCode);
                    if (e.keyCode === 8 || e.keyCode >= 49 && e.keyCode <= 90 || e.keyCode >= 186 && e.keyCode <= 190) {
                        if (node.value && node.value.length > 0) {
                            try {
                                renderResult(node.value);
                            } catch (e) {
                                console.error('fileSearch:upsssi', e);
                                node.value = '';
                            }
                        } else {
                            repeatPointer([]);
                        }
                    }
                })
            }
        },
        searchOutput : {
            add : (node) => {
                node.innerHTML = templateSearchItem;
                searchOutputNode = node.children[0];
                repeat.add(searchOutputNode, (fc) => repeatPointer = fc);
            }
        }
    }, [searchNode]);
}

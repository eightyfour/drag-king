import * as url from 'canny/mod/url.js';
import { FolderItem } from './model/Folder'
import { pageEnvironment } from './pageEnvironment'

/**
 * Reads the styleguide property and returns the value as object
 *
 * @returns {{name: string, child:string|undefined}|boolean}
 */
export function getStyleFromURL():{name: string, child: string}|undefined {
    let styleparam = url.getURLParameter('styleguide'),
        ret;
    if (styleparam) {
        let split = styleparam.split(':');
        ret = {
            name : split[0],
            child: split[1]
        }
    }
    return ret
}

export function getFileName(name) {
    return name.split('/').splice(-1);
}

function filterChildren(folderItems) {
    folderItems = folderItems.filter((folderItem) => {
        if (folderItem.hasOwnProperty('children') && folderItem.children.length > 0) {
            folderItem.children = filterChildren(folderItem.children);
        }
        // exclude .json files from gallery
        //  exclude hidden files started with a dot from view
        return /.*\.json/.test(folderItem.name) || /^\./.test(getFileName(folderItem.name)) ? undefined : folderItem
    });
    return folderItems;
}

export function fileFilter(folderItems:Array<FolderItem>) {
    const allowAll = url.getURLParameter('admin') !== false;
    // nothing to filter out
    if (allowAll && (pageEnvironment.config.name === 'anonymous' || pageEnvironment.config.isAdmin)) return folderItems;
    return filterChildren(folderItems);
}

export function scrollToFocusedElement(node) {
    const elementRect = node.getBoundingClientRect();
    const absoluteElementTop = elementRect.top + window.pageYOffset;
    const middle = absoluteElementTop - (window.innerHeight / 2);
    window.scrollTo(0, middle);
}
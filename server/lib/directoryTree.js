const directoryTree = require('directory-tree');

/**
 * @typedef {object} treeObject
 * @property {string} path
 * @property {string} name
 * @property {string} extension
 * @property {string} type - "directory"|"file"
 * @property {[{treeObject}]} children
 *
 */


/**
 * Filter function for the directory-tree module:
 *  * remove property size (not needed)
 *  * modifier the path to a ready to use URL (for client)
 *  * TODO modifier type property and add json, image/jpg and so on (or create new one)
 *
 * @param rootFolder
 * @param treeObjectList
 * @returns {NodeModule[]|*|{treeObject}[]|Array|HTMLElement[]}
 */
function treeFilter(rootFolder, treeObjectList) {
    const rec = (treeObjectList) => {
        treeObjectList.forEach((treeObject) => {
            delete treeObject.size;
            treeObject.path = treeObject.path.replace(rootFolder, '');
            if (treeObject.children) {
                rec(treeObject.children);
            }
        });
    };
    rec(treeObjectList.children);

    treeObjectList.children = filterChildren(treeObjectList.children);

    return treeObjectList.children;
}

function filterChildren(folderItems) {
    folderItems = folderItems.filter((folderItem) => {
        if (folderItem.hasOwnProperty('children') && folderItem.children.length > 0) {
            folderItem.children = filterChildren(folderItem.children);
        }
        // exclude tmb_ files
        return /^tmb_/.test(folderItem.name) ? undefined : folderItem
    });
    return folderItems;
}
/**
 *
 * @param rootFolder
 * @param path
 * @returns {Promise}
 */
module.exports = function (rootFolder, path) {
    return new Promise((res) => {
        res(treeFilter(rootFolder, directoryTree(rootFolder + path)));
    });
};
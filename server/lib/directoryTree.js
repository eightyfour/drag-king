const directoryTree = require('directory-tree');
const { resolveFile } = require('./fileHandler');
const path = require('node:path');

function filterChildren(children, root) {
    return children.filter((item) => !item.name.startsWith('tmb_')).map((item) => {
        const result = {
            name: item.name,
            path: '/' + path.relative(root, item.path).split(path.sep).join('/'),
            type: item.type
        };
        if (item.extension) result.extension = item.extension;
        if (item.children) result.children = filterChildren(item.children, root);
        return result;
    });
}

module.exports = function getDirectoryTree(root, folder) {
    const fullPath = resolveFile(root, folder);
    const result = directoryTree(fullPath);
    return result ? filterChildren(result.children || [], path.resolve(root)) : [];
};

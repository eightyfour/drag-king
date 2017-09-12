import { icons } from '../../misc/icons';
import * as canny from 'canny';
import * as whisker from 'canny/mod/whisker';
import * as stringToColor from 'string-to-color';

/**
 *  TODO Rename the files it also show normal files
 *  TODO use repeat to render the view elements
 */
const imageItemTemplate = require('./image-item-template.html'),
    fileItemTemplate = require('./file-item-big-template.html'),
    controlPanelTemplate = require('./control-panel-template.html');

let node,
    onDeletesFileFc,
    onItemClickedFc,
    // can be configured from external to ignore some files from view
    fileFilter;

/**
 *
 * @param {string} s - string to get extension from
 * @returns {string|undefined}
 */
function getExtension(s) {
    const spli = s.split('.');
    if (spli[spli.length - 1]) {
        return spli[spli.length - 1];
    }
}

function createFile(div, file) {
    if(/image\/.*/.test(file.type)) {
        createImageFile(div, file);
    } else {
        div.className = 'gallery-file-wrap';
        createDataFile(div, file);
    }
}

function createImageFile(container, file) {
    const controllerPanel = document.createElement('div'),
        fileName = file.file;

    container.innerHTML = imageItemTemplate;
    controllerPanel.innerHTML = controlPanelTemplate;

    whisker.add(container, {
        src : fileName + '?tmb',
        name : file.name,
        controlPanelContent : controllerPanel.children[0],
        url : 'http://' + location.host + file.file,
        color: stringToColor.toHex(getExtension(fileName)),
        onOpen : (node) => {
            node.addEventListener('click', (e) => {
                onItemClickedFc(file);
                e.preventDefault();
                return false;
            }, false);
        },
        controlPanel : {
            deleteButton : (node) => {
                node.addEventListener('click', () => {
                    onDeletesFileFc(file.file, (err, path) => {
                        if (err) {
                            return;
                        }
                        container.remove();
                    });
                })
            }
        }
    });
    // parse HTML to initialize the octicon icons
    canny.cannyParse.apply({
        icon : icons,
    }, [container]);

    return container;
}

function getIconFromFile(fileName) {
    let ext = getExtension(fileName);
    switch(ext) {
        case 'json': return 'lock';
        case 'md': return 'comment';
        case 'html': return 'file-symlink-file';
        case 'css':
        case 'less':
        case 'ts':
        case 'js': return 'file-binary';
        default:
            return 'file-text';
    }
}

function createDataFile(container, file) {
    const fileExtension = getExtension(file.name),
        controllerPanel = document.createElement('div');

    container.innerHTML = fileItemTemplate;
    controllerPanel.innerHTML = controlPanelTemplate;

    whisker.add(container, {
        name : file.name,
        icon : getIconFromFile(file.name),
        controlPanelContent : controllerPanel.children[0],
        url : 'http://' + location.host + file.file,
        onOpen : (node) => {
            node.addEventListener('click', (e) => {
                onItemClickedFc(file);
                e.preventDefault();
                return false;
            }, false);
        },
        color : fileExtension ? stringToColor.toHex(fileExtension) : '',
        controlPanel : {
            deleteButton : (node) => {
                node.addEventListener('click', () => {
                    onDeletesFileFc(file.file, (err, path) => {
                        if (err) {
                            return;
                        }
                        container.remove();
                    });
                })
            }
        }
    });
    // parse HTML to initialize the octicon icons
    canny.cannyParse.apply({
       icon : icons,
    }, [container]);

    return container;
}

/**
 * Will be triggered if a file will be deleted
 * @param fc
 */
export function onDeleteFiles(fc) {
    onDeletesFileFc = fc;
}

export function onItemClicked(fc) {
    onItemClickedFc = fc;
}

/**
 * Canny add method to initialize the root node
 * @param elem
 * @param attr
 */
export function add(elem, attr) {
    node = elem;
}

/**
 * Add a file to the space
 * If the element already exists then update the element with "animation"
 * @param file
 */
export function addFile(file) {
    let div = document.getElementById(file.file);
    if (!div) {
        div = document.createElement('div');
        div.setAttribute('id', file.file);
        createFile(div, file);
        node.appendChild(div);
    } else {
        div.innerHTML = '';
        createFile(div, file);
        div.classList.add('c-fileupdated');
        setTimeout(function () {
            if (div) {
                div.classList.remove('c-fileupdated');
            }
        }, 4000)
    }
}

/**
 * can be configured from external to ignore some files from view
 *
 * @param {function} fFilter - filter for files which will not be shown in teh gallery (function returns file name or undefined to filter out)
 */
export function filter(fFilter) {
    if (fileFilter === undefined) {
        fileFilter = fFilter;
    } else {
        console.error('c-gallery:fileFilter can be only registered ones!');
    }
}

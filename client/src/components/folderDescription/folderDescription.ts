/**
 * Handles the folder description UI
 *
 * Created by phen on 7/17/17.
 */
import * as canny from 'canny';
import { addPageEnvironmentNode } from '../../pageEnvironment';
import { icons } from '../../misc/icons';

const MediumEditor = require('medium-editor'),
    template = require('./folderDescription.html'),
    mediumEditorConfig = {
        targetBlank: true,
        toolbar : {
            buttons: ['bold', 'italic','h2', 'h3', 'unorderedlist', 'anchor', 'quote', 'pre', 'image', 'html']
        }
    };

let rootNode:HTMLElement,
    editorNode:HTMLElement,
    mediumEditorInstance,
    onInputChangeFunction:(content:string) => void;

canny.add('folderDescription', {
    add : (node:HTMLElement) => {
        node.innerHTML = template;
        rootNode = node;
        rootNode.classList.add('default');
        canny.cannyParse.apply({
            icons : icons,
            editor : {
                add : (node) => {
                    editorNode = node;
                    node.addEventListener('dblclick', () => {
                        // here initialize the MediumEditor
                        rootNode.classList.add('editMode');
                        rootNode.classList.remove('default');
                        if (!mediumEditorInstance) {
                            mediumEditorInstance = new MediumEditor(node, mediumEditorConfig);
                        } else {
                            mediumEditorInstance.setup(node, mediumEditorConfig);
                        }
                        console.log('folderDescription:double click detected');
                    });
                }
            },
            closeButton : {
                add : (node) => {
                    // if focus out the element then it will be saved automatically
                    node.addEventListener('click', () => {
                        if (rootNode.classList.contains('editMode') && mediumEditorInstance) {
                            rootNode.classList.remove('editMode');
                            console.log('folderDescription:mediumEditorInstance CANCEL');
                            mediumEditorInstance.resetContent();
                            mediumEditorInstance.destroy();
                        }
                    });
                }
            },
            saveButton : {
                add : (node) => {
                    // if focus out the element then it will be saved automatically
                    node.addEventListener('click', () => {
                        if (rootNode.classList.contains('editMode') && mediumEditorInstance) {
                            rootNode.classList.remove('editMode');
                            console.log('folderDescription:mediumEditorInstance SAVE Send following to server:', mediumEditorInstance.getContent());
                            onInputChangeFunction(mediumEditorInstance.getContent());
                            mediumEditorInstance.destroy();
                            addPageEnvironmentNode(rootNode);
                        }
                    });
                }
            }
        }, [node])
    }
});

/**
 * will be called if the content needs to be saved
 * @param fc
 */
export function onInputChange(fc:(content:string) => void) {
    onInputChangeFunction = fc;
}

export function renderDescription(description) {
    editorNode.innerHTML = description;
    rootNode.classList.remove('default');
    addPageEnvironmentNode(editorNode);
}
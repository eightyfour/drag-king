import * as canny from 'canny';
import { addPageEnvironmentNode } from '../../pageEnvironment';
import { icons } from '../../misc/icons';

const template = require('./header.html');

let cannyModules;

canny.add('header', {
    add : function (node) {
        node.innerHTML = template;
        cannyModules.icons = icons;
        canny.cannyParse.apply(cannyModules, [node]);
        addPageEnvironmentNode(node);
    }
});

export const header = function (mods) {
    cannyModules = mods;
};
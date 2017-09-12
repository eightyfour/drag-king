import * as whisker from 'canny/mod/whisker.js';
import * as canny from 'canny';

/**
 * For global saved data - like user name and so on.
 * Triggers also a view update about the whisker page variable
 *
 * @module pageEnvironment
 */

/**
 * Saves the global config for the application
 */
interface PageConfig {
    name: string;
    alias: string;
    isMaintainer: boolean;
    isAdmin : boolean;
}

/**
 * describe the whisker text properties
 */
interface Page {
    name: string;
    alias: string;
}

const pageConfig: PageConfig = {
    name : 'anonymous',
    alias : 'goat',
    isMaintainer: false,
    isAdmin : false
};
const texts: Page = {
    name : '',
    alias : ''
};

let whiskerCbs: Array<(scope: string, obj: Page) => void> = [];

canny.add('pageEnvironment', {
    add : function (node: HTMLElement) {
        whisker.add(node, function (fc) {
            whiskerCbs.push(fc);
            fc('page', texts);
        })
    },
    ready : function () {
        document.body.classList.add('c-show');
    }
});

/**
 * can be used to register a new node which needs the page environment variables in the HTML
 * @param node
 */
export function addPageEnvironmentNode(node: HTMLElement) {
    canny.pageEnvironment.add(node);
}

export const pageEnvironment = {
    /**
     *
     * @returns {PageConfig}
     */
    get config(): PageConfig {
        return pageConfig;
    },
    /**
     *
     * @param {{PageConfig}} config
     */
    set config(config: PageConfig) {
        Object.assign(pageConfig, config);
        Object.keys(texts).forEach(function (key) {
            if (pageConfig.hasOwnProperty(key)) {
                texts[key] = pageConfig[key];
            }
        });
        whiskerCbs.forEach((whiskerCb) => whiskerCb('page', texts));
    }
};
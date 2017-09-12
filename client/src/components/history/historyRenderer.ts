/**
 * Renders a list of given history items
 *
 * @module module:historyRenderer
 */
import * as repeat from 'canny/mod/repeat';
import * as canny from 'canny';

const historyRendererList: Array<HistoryRenderer> = [],
    template = require('./historyRenderer.html');

class HistoryRenderer {
    private ulItem: Element;
    private node: HTMLElement;
    private repeatCb: (historyItems: Array<HistoryItem>) => void;

    constructor(node: HTMLElement) {
        node.innerHTML = template;
        this.ulItem = node.children[0];
        this.node = <HTMLElement>node;
        this.node.classList.add('hidden');
        // register on the repeat method
        repeat.add(this.ulItem, (cb) => {
            this.repeatCb = cb;
        });
    }
    render (historyItems: Array<HistoryItem>) {
        this.repeatCb(historyItems);
        this.node.classList.remove('hidden');
    }
}

/**
 * The item for the view rendering (repeat callback)
 */
export interface HistoryItem {
    alias: string;
    timestamp: string;
    color: string; // hex color code - generated from the given alias name - can be applied directly to the style attribute
    action: {key: string, value: string};
}

/**
 *
 * @param {Array<HistoryItem>} historyItems
 */
export const initHistoryList = function (historyItems: Array<HistoryItem>): void {
    historyRendererList.forEach((historyRenderer) => {
        historyRenderer.render(historyItems);
    })
};

canny.add('historyRenderer', {
    add : function (node: HTMLElement, attr?: any) {
        historyRendererList.push(new HistoryRenderer(node));
        // work around to keep it open
        node.addEventListener('click', function () {
            this.classList.toggle('show');
        })
    }
});
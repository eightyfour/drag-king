/**
 * If a file os drop over this section it shows the items
 *
 * @module showOnDropOver
 *
 */


/**
 *
 * @returns {{add: add}}
 */
export const showOnDropOver = function (): {add: (HTMLElement, attr: Object) => void} {
    const items: Array<HTMLElement> = [],
        timeoutQueue: Array<any> = [];

    function showItems(): void {
        timeoutQueue.forEach((t) => clearTimeout(t));

        items.forEach((node) => {
            node.style.display = '';
        })
    }

    function hideItems(): void {
        timeoutQueue.forEach((t) => clearTimeout(t));
        timeoutQueue.push(setTimeout(() => {
            items.forEach((node) => {
                node.style.display = 'none';
            })
        }, 500));

    }
    return {
        /**
         *
         * @param {HTMLElement} node
         * @param {string} attr - nothing for initial
         */
        add : (node: HTMLElement, attr: Object) => {
            if (!attr) {
                node.addEventListener("dragover", showItems, false);
                node.addEventListener("dragleave", hideItems, false);
                node.addEventListener("drop", hideItems, false);
            } else {
                items.push(node);
                node.style.display = 'none';
            }
        }
    }
};
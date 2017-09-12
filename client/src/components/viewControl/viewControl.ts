import * as flowControl from 'canny/mod/flowControl';
import * as url from 'canny/mod/url';

const viewGroupMap = {};

export function viewControl () {
    const vControl = flowControl().createNewInstance('vControl');
    return {
        add : (node, attr) => {
            if (typeof attr === 'object') {
                if (!viewGroupMap[attr.viewGroup]) {
                    viewGroupMap[attr.viewGroup] = [node];
                    node.style.display = 'none';
                } else {
                    viewGroupMap[attr.viewGroup].add(node, {view : attr.view});
                }
            } else {
                vControl.add(node, {
                    view : attr
                });
            }
        },
        ready : () => {
        	let focus = url.getURLParameter('focus');
        	if (focus) {
        	    vControl.show(focus);
            }
            console.log('viewControl:ready', focus);
        }
    }
}

/**
 * Simple show - activates all styles from the same view group
 * @param viewGroup
 */
export const show = function (viewGroup) {
    if (viewGroupMap.hasOwnProperty(viewGroup)) {
        viewGroupMap[viewGroup].forEach((n) => n.style.display = '')
    }
};
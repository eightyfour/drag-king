import * as octicons from 'octicons';

export const icons = {
    add : function (node, attr) {
        if (octicons[attr] !== undefined) {
            node.innerHTML = octicons[attr].toSVG();
        } else {
            console.log('icons:octicon doesn\'t exists with name', attr);
        }
    }
};

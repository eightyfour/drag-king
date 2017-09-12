
let onLogout;
const brain = {
    logoutButton : function (node: HTMLElement) {
        node.addEventListener('click', onLogout);
    }
};
export const auth = {
    onLogout : function (fc) {
        onLogout = fc;
    },
    add : function (node, attr) {
        if (brain.hasOwnProperty(attr)) {
            brain[attr](node);
        }
    }
};
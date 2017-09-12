
export function ArrowKeyItemMarker(onReturnCallback) {

    let idx = -1,
        node;


    function up () {
        idx++;
        if (idx >= node.children.length) {
            idx = 0;
        }
        cleanClasses();
        node.children[idx] && node.children[idx].classList.add('active');
    }

    function down () {
        idx--;
        if (idx < 0) {
            idx = node.children.length - 1;
        }
        cleanClasses();
        node.children[idx] && node.children[idx].classList.add('active');
    }

    /**
     * register key listener for selecting the items via the keyboard
     */
    window.addEventListener('keydown', function(e) {
        if (!node) return;

        if (e.key === 'ArrowDown' || e.keyCode === 40) {
            up();
            e.preventDefault();
            return false;
        } else if (e.key === 'ArrowUp' || e.keyCode === 38) {
            down();
            e.preventDefault();
            return false;
        } else if (e.key === 'Enter' || e.keyCode === 13) {
            onReturnCallback(node.querySelector('.active'));
        }
    }, true);


    function cleanClasses() {
        if (node) [...node.children].forEach((n) => n.classList.remove('active'));
    }
    return {
        init : (elem) => {
            node = elem;
            idx = -1;
        }
    }
}
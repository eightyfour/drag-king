export const overlay = (function () {

    const overlays = [];

    function overlay() {
        const node = document.createElement('div');
        let onBackgroundClicked = function () {};

        node.classList.add('overlay-box');

        document.body.insertBefore(node, document.body.children[0]);

        node.addEventListener('click', function (e) {
            if (node === e.target) {
                onBackgroundClicked();
            }
        });

        return {
            onBackgroundClick : function (fc) {
                onBackgroundClicked = fc;
            },
            getNode : function () {
                return node;
            },
            hide: function () {
                node.style.display = "none";
            },
            show: function () {
                node.style.display = "flex";
            }
        }
    }


    return {
        add: function (fc) {
            const ov = overlay();
            overlays.push(ov);
            fc(ov);
        },
        closeAll : function () {
            overlays.forEach(function (ov) {
                ov.hide();
            })
        }
    }
}());
/**
 *
 * @returns {{add: Function, ready: Function}}
 */
module.exports = (function () {

    var overlays = [];

    function overlay() {
        var node = document.createElement('div'),
            onBackgroundClicked = function () {};

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
            var ov = overlay();
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
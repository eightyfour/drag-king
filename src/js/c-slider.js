/**
 *  slider copied from draft project - still a lot of things to do
 *
 *  TODO:
 *   * does not work correctly with less then 3 images
 *   * slider swipe has bad behavior
 *   * addItems can called more then one to add items flexible
 *   * needs also a remove item method
 */
var slider =  (function () {
    "use strict";

    var slidersMap = {},
        cClasses = {
            active: 'c-active',
            prev : 'c-prev',
            next : 'c-next',
            animate: 'c-can-animate',
            item: 'c-item'
        },
        //  define which types are slider modules and needs to be initialized with the init method (default type is swiper)
        sliderTypes = {
            coverFlow : function (id) {
                return new Swiper(id);
//                return new CoverFlow(id);
            },
            swiper : function (id) {
                return new Swiper(id);
            }
        },
        getSliderInstance = function (id) {
            if (!slidersMap.hasOwnProperty(id)) {
                slidersMap[id] = new Slider(id);
            }
            return slidersMap[id];
        },
        xform = 'transform';

    ['webkit', 'Moz', 'O', 'ms'].every(function (prefix) {
        var e = prefix + 'Transform';
        if (typeof document.body.style[e] !== 'undefined') {
            xform = e;
            return false;
        }
        return true;
    });

    function Swiper(id) {
        //common variables here
        var maxIndex = 0,
            sliderNode = {
                root: null,
                slider : null
            },
            previousIndex = 0,
            currentIndex = 0,
            nextIndex = 0,
            dragOriginX = 0,
            screenWidth = 0,
            translateXPrev = 0,
            translateXNext = 0,
            dir = 0,
            events = {
                onSlideChangeListener : function () {}
            };

        function calcArrangement(num) {
            currentIndex += num || 0;
            if (num) {
                dir = num > 0 ? 1 : -1;
            } else {
                dir = 0;
            }
            if (currentIndex < 0) {
                currentIndex = maxIndex;
                previousIndex = currentIndex - 1;
                nextIndex = 0;
            } else if (currentIndex === 0) {
                currentIndex = 0;
                previousIndex = maxIndex;
                nextIndex = 1;
            } else if (currentIndex === maxIndex) {
                currentIndex = maxIndex;
                previousIndex = maxIndex - 1;
                nextIndex = 0;
            } else if (currentIndex > maxIndex) {
                currentIndex = 0;
                previousIndex = maxIndex;
                nextIndex = 1;
            } else {
                previousIndex = currentIndex - 1;
                nextIndex = currentIndex + 1;
            }
        }

        function arrangeItems(animate) {
            var index = 0,
                children = sliderNode.slider.children;
            while (index < children.length) {
                children[index].classList.remove(cClasses.prev);
                children[index].classList.remove(cClasses.active);
                children[index].classList.remove(cClasses.next);
                children[index].classList.remove(cClasses.animate);
                children[index].style[xform] = '';
                if (animate && ((index === previousIndex && dir === 1) || index === currentIndex || (index === nextIndex && dir === -1))) {
                    children[index].classList.add(cClasses.animate);
                }
                if (index === previousIndex) {
                    children[index].classList.add(cClasses.prev);
                } else if (index === currentIndex) {
                    children[index].classList.add(cClasses.active);
                } else if (index === nextIndex) {
                    children[index].classList.add(cClasses.next);
                }
                index++;
            }
            dir = 0;
            events.onSlideChangeListener(currentIndex);
        }

        function doDragging(e) {
            var currMouseX = e.pageX || e.changedTouches[0].clientX,
                currMouseDiffX = currMouseX - dragOriginX,
                tPrev = currMouseDiffX + translateXPrev,
                tCurr = currMouseDiffX,
                tNext = currMouseDiffX + translateXNext;

            sliderNode.slider.querySelector('.' + cClasses.prev).style[xform] = "translateX(" + tPrev + "px)  translateY(0px) translateZ(0px)";
            sliderNode.slider.querySelector('.' + cClasses.active).style[xform] = "translateX(" + tCurr + "px)  translateY(0px) translateZ(0px)";
            sliderNode.slider.querySelector('.' + cClasses.next).style[xform] = "translateX(" + tNext + "px)  translateY(0px) translateZ(0px)";
            e.preventDefault();
        }

        function stopDragging(e) {
            var currMouseX = e.pageX || e.changedTouches[0].clientX,
                currMouseDiffX = currMouseX - dragOriginX;

            sliderNode.slider.removeEventListener('mousemove', doDragging, false);
            sliderNode.slider.removeEventListener('touchmove', doDragging, false);
            sliderNode.slider.removeEventListener('mouseleave', stopDragging, false);
            sliderNode.slider.removeEventListener('touchleave', stopDragging, false);

            if (Math.abs(currMouseDiffX) > 20) {
                calcArrangement((currMouseDiffX > 0) ? -1 : 1);
                arrangeItems(true);
            } else {
                calcArrangement();
                arrangeItems(true);
            }
            e.preventDefault();
        }

        function startDragging(e) {
            [].slice.call(sliderNode.slider.children).forEach(function (elem) {
                elem.classList.remove(cClasses.animate);
            });

            dragOriginX = e.pageX || e.changedTouches[0].clientX;
            screenWidth = sliderNode.slider.offsetWidth;
            translateXPrev = screenWidth * -1;
            translateXNext = screenWidth;
            sliderNode.slider.addEventListener('mousemove', doDragging, false);
            sliderNode.slider.addEventListener('touchmove', doDragging, false);
            sliderNode.slider.addEventListener('mouseleave', stopDragging, false);
            sliderNode.slider.addEventListener('touchleave', stopDragging, false);

            e.preventDefault();
        }

        function setupEvents() {
            // maybe we need a container insider the sliderNode to slide
            sliderNode.slider.addEventListener('mousedown', startDragging, false);
            sliderNode.slider.addEventListener('touchstart', startDragging, false);
            sliderNode.slider.addEventListener('mouseup', stopDragging, false);
            sliderNode.slider.addEventListener('touchend', stopDragging, false);
        }


        this.next = function () {
            calcArrangement(1);
            arrangeItems(true);
        };
        this.prev = function () {
            calcArrangement(-1);
            arrangeItems(true);
        };
        this.init = function (node) {
            // do specific Swiper stuff
            sliderNode.root = node;
            // first element must be the wraper
            sliderNode.slider = node.children[0];
            maxIndex = sliderNode.slider.children.length - 1;
            previousIndex = maxIndex;
            nextIndex = 1;

            arrangeItems(false);
            setupEvents();

            console.log('Swiper ready with id: ' + id);
            return maxIndex + 1;
        };

        this.onSlideChangeListener = function (fc) {
            events.onSlideChangeListener = fc;
        };

        this.slideToIndex = function (index) {
            if ((index - currentIndex) !== 0) {
                calcArrangement(index - currentIndex);
                arrangeItems(false);
            }
        };
        this.resize = function () {
            console.log("not implemented!");
        };
    }

    function Slider(id) {
        var sliderNode,
            sliderAttr = {},
            ignoreReady = false,
            sliderType,
            changeListenerQueue = [],
            paginationProgress = (function () {
                var pgProgNodes = [],
                    addItems = function (node, items) {
                        var i, dNode,
                            frag = document.createDocumentFragment();
                        for (i = 0; i < items; i++) {
                            dNode = document.createElement('div');
                            dNode.classList.add(cClasses.item);
                            frag.appendChild(dNode);
                        }
                        node.appendChild(frag);
                    },
                    progress = function (node, idx) {
                        var child, children = [].slice.call(node.children);
                        child = [].slice.call(node.querySelectorAll('.' + cClasses.active));
                        child.forEach(function (node) {
                            node.classList.remove(cClasses.active);
                        });
                        if (children[idx]) {
                            children[idx].classList.add(cClasses.active);
                        }
                    };

                return {
                    setup : function (node) {
                        pgProgNodes.push(node);
                    },
                    ready : function (items) {
                        if (pgProgNodes.length > 0) {
                            pgProgNodes.forEach(function (node) {
                                addItems(node, items);
                                progress(node, 0);
                            });
                        }
                    },
                    progress : function (idx) {
                        pgProgNodes.forEach(function (node) {
                            progress(node, idx);
                        });
                    }
                };
            }()),
            init = function () {
                var items;
                // do generic Slider stuff
                if (sliderType) {
                    items = sliderType.init(sliderNode, sliderAttr);
                }

                paginationProgress.ready(items);

                sliderType.onSlideChangeListener(function (index) {
                    changeListenerQueue.forEach(function (fc) {
                        fc(index);
                    });
                });
                console.log('Slider ready with id: ' + id);
            };

        this.next = function (node) {
            node.addEventListener('click', function () {
                sliderType.next();
            });
        };
        this.prev = function (node) {
            node.addEventListener('click', function () {
                sliderType.prev();
            });
        };
        /**
         * attr{
         *   type: slider type - default: swiper
         *   autoInit: can be set to false - default: true
         * }
         * @param node
         * @param attr
         */
        this.init = function (node, attr) {
            sliderNode = node;
            sliderAttr = attr;
            sliderType = sliderTypes[attr.type || 'swiper'](id);
            if (attr.autoInit !== undefined) {
                if (typeof attr.autoInit === 'string') {
                    ignoreReady = attr.autoInit === 'false';
                } else {
                    ignoreReady = attr.autoInit;
                }
            }
        };

        this.ready = function () {
            if (ignoreReady === false) {
                ignoreReady = null;
                init();
            }
        };

        this.postInit = function () {
            if (ignoreReady !== null) {
                ignoreReady = null;
                init();
            }
        };

        // listeners
        this.onSlideChangeListener = function (fc) {
            changeListenerQueue.push(fc);
        };

        this.paginationProgress = function (node) {
            paginationProgress.setup(node);
            // register eventListener
            changeListenerQueue.push(paginationProgress.progress);
        };

        this.slideToIndex = function (index) {
            sliderType.slideToIndex(index);
        };

        this.resize = function () {
            sliderType.resize();
        };
        this.addItems = function (items) {
            var wrap = sliderNode.children[0];
            items.forEach(function (node) {
                node.classList.add('c-item');
                wrap.appendChild(node);
            })
        }
    }

    return {
        addItems : function (id, items) {
            slidersMap[id].addItems(items);
        },
        /**
         * We need multiple instances from the slider. Each slider should be identifier via a id.
         * @param elem
         * @param attr {id: string, type: string[swipe|coverFlow|buttonNext|buttonPrev]}
         */
        add : function (node, attr) {
            var slider;
            if (attr.hasOwnProperty('id')) {
                slider = getSliderInstance(attr.id);
                // test is slider
                if (!attr.hasOwnProperty('type') || sliderTypes.hasOwnProperty(attr.type)) {
                    if (!slider.hasOwnProperty(attr.id)) {
                        slider.init(node, attr);
                    } else {
                        console.warn('Slider with id ´' + attr.id + "´ can't registered twice!");
                    }
                } else if (attr.hasOwnProperty('type') && slider[attr.type]) {
                    slider[attr.type](node);
                }
            }
        },
        ready : function () {
            // coverFlow needs timeout to calculate the width correctly
            setTimeout(function () {
                // call ready method to initialize al registered sliders
                Object.keys(slidersMap).forEach(function (id) {
                    slidersMap[id].ready();
                });
            }, 10);

        },
        /**
         * callback will be called with actual index
         * @param slideId
         * @param cb
         */
        onSlideChangeListener : function (slideId, cb) {
            if (slidersMap[slideId]) {
                slidersMap[slideId].onSlideChangeListener(cb);
            } else {
                console.warn('No Slider with id ´' + slideId + "´ registered!");
            }
        },
        initializeSlider : function (slideId) {
            if (slidersMap[slideId]) {
                slidersMap[slideId].postInit();
            } else {
                console.warn('No Slider with id ´' + slideId + "´ registered!");
            }
        },
        slideToIndex : function (sliderId, index) {
            if (slidersMap[sliderId]) {
                slidersMap[sliderId].slideToIndex(index);
            } else {
                console.warn('No Slider with id ´' + sliderId + "´ registered!");
            }
        },
        resize: function () {
            Object.keys(slidersMap).forEach(function (sliderName) {
                slidersMap[sliderName].resize();
            });
        }
    };
}());

module.exports = slider;
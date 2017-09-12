/*global canny, console, parseInt */
/*jslint browser: true */
// implementation
export function Carousel() {
    "use strict";

    const slidersMap = {},
        cClasses = {
            active: 'c-active',
            prev: 'c-prev',
            next: 'c-next',
            animate: 'c-can-animate',
            item: 'c-item',
            inactive: 'c-inactive',
            disabled: 'c-disabled'

        },
        getSliderInstance = function (id) {
            if (!slidersMap.hasOwnProperty(id)) {
                slidersMap[id] = new Slider(id);
            }
            return slidersMap[id];
        };

    let xform = 'transform';


    function Swiper(id) {
        //common variables here
        let maxIndex = 0, // number of children -1
            sliderNode = {
                root: null,
                slider: null
            },
            previousIndex = 0,
            currentIndex = 0, // actual index item
            nextIndex = 0,
            dragOriginX = 0,
            screenWidth = 0,
            translateXPrev = 0,
            translateXNext = 0,
            direction = 0, // -1 (prev), 0, 1 (next)
            // if limited true the carousel functionality is disabled
            limited = true,
            events = {
                onSlideChangeListener: function (num:number) {
                },
                hasNextCb : function (b:boolean) {},
                hasPrevCb : function (b:boolean) {}
            };

        /**
         *
         * @param {number} num - -1 (prev), 0 (nothing), 1 (next)
         */
        function calcArrangement(num?) {
            if (maxIndex === 0) {
                currentIndex = 0;
                nextIndex = undefined;
                previousIndex = undefined;
                return;
            }

            if (limited && ((num === 1 && currentIndex === maxIndex) || (num === -1 && currentIndex === 0))) {
                events.hasNextCb(!(num === 1 && currentIndex === maxIndex));
                events.hasPrevCb(!(num === -1 && currentIndex === 0));
                return;
            }

            currentIndex += num || 0;
            if (num) {
                direction = num > 0 ? 1 : -1;
            } else {
                direction = 0;
            }
            if (currentIndex < 0) {
                currentIndex = maxIndex;
                previousIndex = currentIndex - 1 !== 0 ? currentIndex - 1 : undefined;
                nextIndex = 0;
            } else if (currentIndex === 0) {
                currentIndex = 0;
                previousIndex = maxIndex === 1 ? undefined : maxIndex;
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

            events.hasNextCb(currentIndex !== maxIndex);
            events.hasPrevCb(currentIndex !== 0);
        }


        function cleanClasses(children, animate) {
            let node,
                index = 0;
            while (index < children.length) {
                node = children[index];
                node.classList.remove(cClasses.prev);
                node.classList.remove(cClasses.active);
                node.classList.remove(cClasses.next);
                animate && (node.classList.remove(cClasses.animate));
                node.style[xform] = '';
                index ++;
            }
        }

        function amimate(children) {
            let index = 0;
            while (index < children.length) {
                if ((index === previousIndex && direction === 1) || index === currentIndex || (index === nextIndex && direction === -1)) {
                    children[index].classList.add(cClasses.animate);
                }
                index++;
            }
        }

        /**
         * Call this to pre arrange the items -
         * @param children
         * @param animate
         */
        function preArrangeItems(direction) {
            const children = sliderNode.slider.children;
            cleanClasses(children, true);
            if (maxIndex === 1) {
                if (limited && ((direction === 1 && currentIndex === maxIndex) || (direction === -1 && currentIndex === 0))) {
                    // skip prearange (important for dragging)
                    children[currentIndex] && children[currentIndex].classList.add(cClasses.active);
                } else {
                    if (direction === 1) {
                        if (currentIndex === maxIndex) {
                            children[0].classList.add(cClasses.next);
                            children[1].classList.add(cClasses.active);
                        } else {
                            children[0].classList.add(cClasses.active);
                            children[1].classList.add(cClasses.next);
                        }
                    } else if (direction === -1) {
                        if (currentIndex === 0) {
                            children[0].classList.add(cClasses.active);
                            children[1].classList.add(cClasses.prev);
                        } else {
                            children[0].classList.add(cClasses.prev);
                            children[1].classList.add(cClasses.active);
                        }
                    }
                }
            } else {
                if (limited && ((direction === 1 && currentIndex === maxIndex) || (direction === -1 && currentIndex === 0))) {
                    // skip prearange (important for dragging)
                    children[currentIndex] && children[currentIndex].classList.add(cClasses.active);
                } else {
                    children[previousIndex] && children[previousIndex].classList.add(cClasses.prev);
                    children[currentIndex] && children[currentIndex].classList.add(cClasses.active);
                    children[nextIndex] && children[nextIndex].classList.add(cClasses.next);
                }
            }
        }
        /**
         *
         * @param {boolean} animate - if true it shows an animation
         */
        function arrangeItems(animate) {
            const children = sliderNode.slider.children;
            let index = 0;

            if (animate) {
                amimate(children);
            }
            cleanClasses(children, !animate);

            while (index < children.length) {
                if (index === previousIndex) {
                    children[index].classList.add(cClasses.prev);
                } else if (index === currentIndex) {
                    children[index].classList.add(cClasses.active);
                } else if (index === nextIndex) {
                    children[index].classList.add(cClasses.next);
                }
                index++;
            }
            direction = 0;
            events.onSlideChangeListener(currentIndex);
        }

        function doDragging(e) {
            const currMouseX = e.pageX || e.changedTouches[0].clientX,
                currMouseDiffX = currMouseX - dragOriginX,
                tPrev = currMouseDiffX + translateXPrev,
                tCurr = currMouseDiffX,
                tNext = currMouseDiffX + translateXNext,
                prev = sliderNode.slider.querySelector('.' + cClasses.prev),
                active = sliderNode.slider.querySelector('.' + cClasses.active),
                next = sliderNode.slider.querySelector('.' + cClasses.next);
            if (currMouseDiffX < 0) {
                // next direction
                preArrangeItems(1);
            } else if (currMouseDiffX > 0) {
                // prev direction
                preArrangeItems(-1);
            }
            prev   && (prev.style[xform] = "translateX(" + tPrev + "px)  translateY(0px) translateZ(0px)");
            active && (active.style[xform] = "translateX(" + tCurr + "px)  translateY(0px) translateZ(0px)");
            next   && (next.style[xform] = "translateX(" + tNext + "px)  translateY(0px) translateZ(0px)");

            e.preventDefault();
        }

        function stopDragging(e) {
            const currMouseX = e.pageX || e.changedTouches[0].clientX,
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
            preArrangeItems(1);
            calcArrangement(1);
            setTimeout(function () {
                arrangeItems(true);
            }, 100)
        };
        this.prev = function () {
            preArrangeItems(-1);
            calcArrangement(-1);
            setTimeout(function () {
                arrangeItems(true);
            }, 100)
        };
        /**
         *
         * @param {HTMLElement} node
         * @param (boolean} limited
         * @returns {number}
         */
        this.init = function (node, attr) {
            // do specific Swiper stuff
            sliderNode.root = node;
            limited = attr.limited;
            // first element must be the wrapper
            sliderNode.slider = node.children[0];
            maxIndex = sliderNode.slider.children.length - 1;
            previousIndex = maxIndex;
            nextIndex = 1;
            calcArrangement(0);
            arrangeItems(false);
            setupEvents();
            return maxIndex + 1;
        };
        this.onSlideChangeListener = function (fc:(num:number) => {}) {
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
        this.hasNext = function (fc) {
            events.hasNextCb = fc;
        };
        this.hasPrev = function (fc) {
            events.hasPrevCb = fc;
        }
    }

    function Slider(id) {
        let sliderNode,
            buttons = {
                next : undefined,
                prev : undefined
            },
            sliderAttr:{limited?:boolean} = {},
            ignoreReady = false,
            sliderType,
            changeListenerQueue = [],
            paginationProgress = (function () {
                const pgProgNodes = [];
                     function addItems(node, items) {
                        let i, dNode,
                            frag = document.createDocumentFragment();
                        for (i = 0; i < items; i++) {
                            dNode = document.createElement('div');
                            dNode.classList.add(cClasses.item);
                            addClick(dNode, i);frag.appendChild(dNode);
                        }
                        node.appendChild(frag);
                    }
                     function progress(node, idx) {
                        let child, children = [].slice.call(node.children);
                        child = [].slice.call(node.querySelectorAll('.' + cClasses.active));
                        child.forEach(function (node) {
                            node.classList.remove(cClasses.active);
                        });
                        if (children[idx]) {
                            children[idx].classList.add(cClasses.active);
                        }
                    }

                function addClick(node, idx) {
                    node.addEventListener('click', function () {
                        sliderType.slideToIndex(idx);
                    });
                }

                return {
                    setup: function (node) {
                        pgProgNodes.push(node);
                    },
                    ready: function (items) {
                        if (pgProgNodes.length > 0) {
                            pgProgNodes.forEach(function (node) {
                                addItems(node, items);
                                progress(node, 0);
                            });
                        }
                    },
                    progress: function (idx) {
                        pgProgNodes.forEach(function (node) {
                            progress(node, idx);
                        });
                    }
                };
            }());

            function init() {
                let items;
                // do generic Slider stuff
                if (sliderAttr.limited && buttons.next && buttons.prev) {
                    sliderType.hasPrev(function (bool) {
                        if (!bool) {
                            buttons.prev.classList.add(cClasses.disabled);
                        } else {
                            buttons.prev.classList.remove(cClasses.disabled);
                        }
                    });
                    sliderType.hasNext(function (bool) {
                        if (!bool) {
                            buttons.next.classList.add(cClasses.disabled);
                        } else {
                            buttons.next.classList.remove(cClasses.disabled);
                        }
                    });
                }

                if (sliderType) {
                    items = sliderType.init(sliderNode, sliderAttr);
                }

                if (items === 1) {
                    buttons.next && buttons.next.classList.add(cClasses.inactive);
                    buttons.prev && buttons.prev.classList.add(cClasses.inactive);
                }

                paginationProgress.ready(items);

                sliderType.onSlideChangeListener(function (index) {
                    changeListenerQueue.forEach(function (fc) {
                        fc(index);
                    });
                });
            }

        this.next = function (node) {
            buttons.next = node;
            node.addEventListener('click', function () {
                sliderType.next();
            });
        };
        this.prev = function (node) {
            buttons.prev = node;
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
         * @param {{id: string, autoInit: boolean|string, limited: boolean|string}} attr
         */
        this.init = function (node, attr) {
            sliderNode = node;
            sliderAttr.limited = (attr.limited === 'true' || attr.limited) === true;
            sliderType = new Swiper(id);
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
    }

    return {
        /**
         * We need multiple instances from the slider. Each slider should be identifier via a id.
         * @param elem
         * @param attr {id: string, type: string[swipe|buttonNext|buttonPrev]}
         */
        add: function (node, attr) {
            let slider;
            if (attr.hasOwnProperty('id')) {
                slider = getSliderInstance(attr.id);
                // test is slider
                if (!attr.hasOwnProperty('type') || attr.type === 'swiper') {
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
        ready: function () {
            ['webkit', 'Moz', 'O', 'ms'].every(function (prefix) {
                const e = prefix + 'Transform';
                if (typeof document.body.style[e] !== 'undefined') {
                    xform = e;
                    return false;
                }
                return true;
            });
            // coverFlow needs timeout to calculate the width correctly
            setTimeout(function () {
                // call ready method to initialize al registered sliders
                Object.keys(slidersMap).forEach(function (id) {
                    slidersMap[id].ready();
                });
            }, 10);

        },
        onSlideChangeListener: function (slideId, cb) {
            if (slidersMap[slideId]) {
                slidersMap[slideId].onSlideChangeListener(cb);
            } else {
                console.warn('No Slider with id ´' + slideId + "´ registered!");
            }
        },
        initializeSlider: function (slideId) {
            if (slidersMap[slideId]) {
                slidersMap[slideId].postInit();
            } else {
                console.warn('No Slider with id ´' + slideId + "´ registered!");
            }
        },
        slideToIndex: function (sliderId, index) {
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
}
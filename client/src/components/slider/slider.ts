import * as canny from 'canny';
import * as whisker from 'canny/mod/whisker';
import { Carousel } from './carousel';
import { icons } from '../../misc/icons'

const template = require('./slider.html'),
    mySlider = Carousel();

let sliderNode;
/**
 * hide the slider
 */
export function hide () {
    if (sliderNode) {
        sliderNode.remove();
        sliderNode = null;
    }
}

/**
 * show the slider
 * @param listOfNodes
 * @param index
 */
export function show (listOfNodes, index) {
    sliderNode = document.createElement('div');
    sliderNode.className = 'assetSlider';
    sliderNode.innerHTML = template;

    whisker.add(sliderNode, function (fc) {
        fc({
            // sliderId and className are only an example - this could already be defined in the template
            sliderId : 'assetSlider',
            className : 'assetSlider-slider',
            imageHandler : function (imageContainerNode) {
                listOfNodes.forEach(function (img, idx) {
                    const div = document.createElement('div');
                    div.className = 'c-item img_' + idx + ' slider-screenshot';
                    div.appendChild(img);
                    imageContainerNode.appendChild(div);
                });
            }
        })
    });
    // apply canny to the view and canny will initialize the modules above
    canny.cannyParse.apply({
        icon : icons,
        slider : mySlider,
        sliderCloseButton : {
            add : (node) => {
            	node.addEventListener('click', () => {
                    sliderNode.remove();
                    sliderNode = null;
            	})
            }
        }
    }, [sliderNode]);

    document.body.appendChild(sliderNode);
    mySlider.initializeSlider('assetSlider');
    if (index && index !== -1) {
        mySlider.slideToIndex('assetSlider', index);
    }
}
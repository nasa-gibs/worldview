import React from 'react';
import ReactDOM from 'react-dom';
import OpacitySlider from '../../components/compare/opacity-slider';

var map;
var slider;
var value = 50;

export class Opacity {
  constructor(olMap, isAactive, events, eventListenerStringObj, valueOverride) {
    map = olMap;
    this.compareEvents = events;
    this.sliderCase = document.createElement('div');
    value = valueOverride || value;
    this.create();
  }
  create() {
    slider = this.createSlider(map, map.getLayers().getArray()[1]);
    this.oninput(value);
  }
  /**
   * Refresh secondLayer layer group (after date change for example)
   */
  update() {
    this.secondLayer = map.getLayers().getArray()[1];
    this.oninput(value);
  }
  /**
   * Remove all nodes
   */
  destroy() {
    ReactDOM.unmountComponentAtNode(slider);
    this.mapCase.removeChild(slider);
  }
  /**
   * Render Opacity slider react component
   * @param {Object} map | OL Map Object
   * @param {Object} secondLayer | Second layer group on Map
   */
  createSlider(map, secondLayer) {
    this.secondLayer = secondLayer;
    this.mapCase = document.getElementById('wv-map');
    const Props = {
      onSlide: this.oninput.bind(this),
      onSlideEnd: value => {
        this.compareEvents.trigger('moveend', value);
      },
      value: value
    };
    this.mapCase.appendChild(this.sliderCase);
    ReactDOM.render(React.createElement(OpacitySlider, Props), this.sliderCase);
    return this.sliderCase;
  }
  /**
   * Set opacity of second layer based on opacity slider
   * @param {Number} newValue
   */
  oninput(newValue) {
    value = newValue;
    this.secondLayer.setOpacity(value / 100);
  }
}

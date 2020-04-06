import React from 'react';
import ReactDOM from 'react-dom';
import OpacitySlider from '../../components/compare/opacity-slider';

let slider;
let value = 50;

export default class Opacity {
  constructor(olMap, isAactive, events, eventListenerStringObj, valueOverride) {
    this.map = olMap;
    this.compareEvents = events;
    this.sliderCase = document.createElement('div');
    value = Number(valueOverride) || value;
    this.create();
  }

  create() {
    slider = this.createSlider(this.map.getLayers().getArray());
    this.oninput(value);
  }

  /**
   * Refresh secondLayer layer group (after date change for example)
   */
  update() {
    [this.firstLayer, this.secondLayer] = this.map.getLayers().getArray();
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
  createSlider(layerArray) {
    [this.firstLayer, this.secondLayer] = layerArray;
    this.mapCase = document.getElementById('wv-map');
    const Props = {
      onSlide: this.oninput.bind(this),
      value,
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
    const convertedValue = value / 100;
    this.firstLayer.setOpacity(1 - convertedValue);
    this.secondLayer.setOpacity(convertedValue);
    this.compareEvents.trigger('moveend', value);
  }
}

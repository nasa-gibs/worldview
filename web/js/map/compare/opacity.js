import React from 'react';
import ReactDOM from 'react-dom';
import lodashDebounce from 'lodash/debounce';
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
  update() {
    this.secondLayer = map.getLayers().getArray()[1];
    this.oninput(value);
  }
  destroy() {
    ReactDOM.unmountComponentAtNode(slider);
    this.mapCase.removeChild(slider);
  }
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
  oninput(newValue) {
    value = newValue;
    this.secondLayer.setOpacity(value / 100);
  }
}

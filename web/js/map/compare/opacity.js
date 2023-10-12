import React from 'react';
import { createRoot } from 'react-dom/client';
import OpacitySlider from '../../components/compare/opacity-slider';
import { getCompareDates } from '../../modules/compare/selectors';
import util from '../../util/util';
import { COMPARE_MOVE_END } from '../../util/constants';

const { events } = util;

let slider;
let value = 50;

export default class Opacity {
  constructor(olMap, store, eventListenerStringObj, valueOverride) {
    this.map = olMap;
    this.sliderCase = document.createElement('div');
    value = Number(valueOverride) || value;
    this.create(store);
  }

  create(store) {
    const state = store.getState();
    const { dateA, dateB } = getCompareDates(state);
    this.dateA = dateA;
    this.dateB = dateB;
    slider = this.createSlider(this.map.getLayers().getArray());
    this.oninput(value);
  }

  /**
   * Refresh secondLayer layer group (after date change for example)
   */
  update(store) {
    const state = store.getState();
    const { dateA, dateB } = getCompareDates(state);
    if (dateA !== this.dateA || dateB !== this.dateB) {
      this.destroy();
      this.create(store);
    } else {
      [this.firstLayer, this.secondLayer] = this.map.getLayers().getArray();
      this.oninput(value);
    }
  }

  /**
   * Remove all nodes
   */
  destroy() {
    const root = createRoot(slider);
    root.unmount(slider);
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
      dateA: this.dateA,
      dateB: this.dateB,
    };
    this.mapCase.appendChild(this.sliderCase);
    const root = createRoot(this.sliderCase);
    root.render(React.createElement(OpacitySlider, Props));
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
    events.trigger(COMPARE_MOVE_END, value);
  }
}

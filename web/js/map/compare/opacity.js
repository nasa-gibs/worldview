import React from 'react';
import { createRoot } from 'react-dom/client';
import OpacitySlider from '../../components/compare/opacity-slider';
import { getCompareDates } from '../../modules/compare/selectors';
import util from '../../util/util';
import { COMPARE_MOVE_END } from '../../util/constants';

const { events } = util;

let value = 50;

export default class Opacity {
  constructor(olMap, store, eventListenerStringObj, valueOverride) {
    this.map = olMap;
    this.sliderCase = document.createElement('div');
    this.root = createRoot(this.sliderCase);
    this.mapCase = null;
    this.isDestroyed = false;
    value = Number(valueOverride) || value;
    this.create(store);
  }

  create(store) {
    const state = store.getState();
    const { dateA, dateB } = getCompareDates(state);
    this.dateA = dateA;
    this.dateB = dateB;
    this.renderSlider(this.map.getLayers().getArray());
    this.oninput(value);
  }

  /**
   * Refresh secondLayer layer group (after date change for example)
   */
  update(store) {
    const state = store.getState();
    const { dateA, dateB } = getCompareDates(state);
    this.dateA = dateA;
    this.dateB = dateB;
    this.renderSlider(this.map.getLayers().getArray());
    this.oninput(value);
  }

  /**
   * Remove all nodes
   */
  destroy() {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    const root = this.root;
    const sliderCase = this.sliderCase;
    const mapCase = this.mapCase;

    // Prevent further renders immediately.
    this.root = null;

    // Avoid unmounting during an in-progress React render elsewhere.
    setTimeout(() => {
      try {
        root?.unmount();
      } finally {
        if (mapCase && sliderCase && sliderCase.parentNode === mapCase) {
          mapCase.removeChild(sliderCase);
        }
      }
    }, 0);
  }

  /**
   * Render Opacity slider react component
   * @param {Object} map | OL Map Object
   * @param {Object} secondLayer | Second layer group on Map
   */
  renderSlider(layerArray) {
    if (this.isDestroyed || !this.root) return;
    [this.firstLayer, this.secondLayer] = layerArray;
    if (!this.mapCase) {
      this.mapCase = document.getElementById('wv-map');
    }
    const Props = {
      onSlide: this.oninput.bind(this),
      value,
      dateA: this.dateA,
      dateB: this.dateB,
    };
    if (this.mapCase && this.sliderCase.parentNode !== this.mapCase) {
      this.mapCase.appendChild(this.sliderCase);
    }
    this.root.render(React.createElement(OpacitySlider, Props));
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

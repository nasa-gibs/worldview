import React from 'react';
import { createRoot } from 'react-dom/client';
import OpacitySlider from '../../components/compare/opacity-slider';
import { getCompareDates } from '../../modules/compare/selectors';
import util from '../../util/util';
import { COMPARE_MOVE_END } from '../../util/constants';

const { events } = util;

export default function Opacity(olMap, store, _eventListenerStringObj, valueOverride) {
  const self = {};
  self.map = olMap;
  self.sliderCase = document.createElement('div');
  self.root = createRoot(self.sliderCase);
  self.mapCase = null;
  self.isDestroyed = false;

  let value = Number(valueOverride) || 50;
  let firstLayer;
  let secondLayer;

  /**
   * Set opacity of second layer based on opacity slider
   * @param {Number} newValue
   */
  function oninput(newValue) {
    value = newValue;
    const convertedValue = value / 100;
    firstLayer.setOpacity(1 - convertedValue);
    secondLayer.setOpacity(convertedValue);
    events.trigger(COMPARE_MOVE_END, value);
  }

  /**
   * Render Opacity slider react component
   * @param {Object} map | OL Map Object
   * @param {Object} secondLayer | Second layer group on Map
   */
  function renderSlider(layerArray) {
    if (self.isDestroyed || !self.root) return;
    [firstLayer, secondLayer] = layerArray;
    if (!self.mapCase) {
      self.mapCase = document.getElementById('wv-map');
    }
    const Props = {
      onSlide: oninput,
      value,
      dateA: self.dateA,
      dateB: self.dateB,
    };
    if (self.mapCase && self.sliderCase.parentNode !== self.mapCase) {
      self.mapCase.appendChild(self.sliderCase);
    }
    self.root.render(React.createElement(OpacitySlider, Props));
  }

  function create(storeArg) {
    const state = storeArg.getState();
    const { dateA, dateB } = getCompareDates(state);
    self.dateA = dateA;
    self.dateB = dateB;
    renderSlider(self.map.getLayers().getArray());
    oninput(value);
  }

  /**
   * Refresh secondLayer layer group (after date change for example)
   */
  function update(storeArg) {
    const state = storeArg.getState();
    const { dateA, dateB } = getCompareDates(state);
    self.dateA = dateA;
    self.dateB = dateB;
    renderSlider(self.map.getLayers().getArray());
    oninput(value);
  }

  /**
   * Remove all nodes
   */
  function destroy() {
    if (self.isDestroyed) return;
    self.isDestroyed = true;

    const root = self.root;
    const sliderCase = self.sliderCase;
    const mapCase = self.mapCase;

    // Prevent further renders immediately.
    self.root = null;

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

  self.create = create;
  self.update = update;
  self.destroy = destroy;
  self.renderSlider = renderSlider;
  self.oninput = oninput;

  self.create(store);

  return self;
}

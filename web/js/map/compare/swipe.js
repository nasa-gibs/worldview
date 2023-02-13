import React from 'react';
import ReactDOM from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import lodashRound from 'lodash/round';
import lodashEach from 'lodash/each';
import { getRenderPixel } from 'ol/render';

import util from '../../util/util';
import { getCompareDates } from '../../modules/compare/selectors';
import { COMPARE_MOVE_START } from '../../util/constants';

const { events } = util;

let swipeOffset = null;
let line = null;
let layersSideA = [];
let layersSideB = [];
let mapCase;
let listenerObj;
let percentSwipe = null;
const SWIPE_PADDING = 30;
let dragging = false;

const restore = function(event) {
  const ctx = event.context;
  ctx.restore();
};

const applyListenersA = function(layer) {
  layer.on('prerender', this.setClipMaskA);
  layer.on('postrender', restore);
};
const applyListenersB = function(layer) {
  layer.on('prerender', this.setClipMaskB);
  layer.on('postrender', restore);
};

export default class Swipe {
  constructor(
    olMap,
    store,
    eventListenerStringObj,
    valueOverride,
  ) {
    listenerObj = eventListenerStringObj;
    this.map = olMap;
    percentSwipe = valueOverride / 100;
    this.create(store);
    window.addEventListener('resize', () => {
      if (document.querySelector('.ab-swipe-line')) {
        this.destroy();
        this.create(store);
      }
    });
  }

  create(store) {
    const state = store.getState();
    const { dateA, dateB } = getCompareDates(state);
    this.dateA = dateA;
    this.dateB = dateB;
    line = addLineOverlay(this.map, this.dateA, this.dateB, this.updateExtents);
    this.update(store);
  }

  destroy = () => {
    mapCase.removeChild(line);
    lodashEach(layersSideA, (layer) => {
      layer.un('prerender', this.setClipMaskA);
      layer.un('postrender', restore);
    });
    lodashEach(layersSideB, (layer) => {
      layer.un('prerender', this.setClipMaskB);
      layer.un('postrender', restore);
    });
    layersSideA = [];
    layersSideB = [];
  };

  getSwipeOffset = () => swipeOffset;

  update(store) {
    const state = store.getState();
    const { dateA, dateB } = getCompareDates(state);

    if (dateA !== this.dateA || dateB !== this.dateB) {
      this.destroy();
      this.create(store);
    } else {
      const layerGroups = this.map.getLayers().getArray();
      layersSideA = layerGroups[0].getLayersArray();
      layersSideB = layerGroups[1].getLayersArray();
      layersSideA.forEach((l) => {
        this.applyEventListeners(l, applyListenersA);
      });
      layersSideB.forEach((l) => {
        this.applyEventListeners(l, applyListenersB);
      });
    }
  }

  applyEventListeners(layer, callback) {
    const layers = layer.get('layers');
    if (layers) {
      lodashEach(layers.getArray(), (l) => {
        this.applyEventListeners(l, callback);
      });
    } else {
      callback.call(this, layer);
    }
  }

  /**
   * Set Clipping mask for the "A" side of a comparison.
   * Note: The "B" side is layered above the "A" side on the DOM.
   * We must mask the "A" side in case the B side has no imagery
   * @param {Object} event | Openlayers Precompose event object
   */
  setClipMaskA = (event) => {
    const ctx = event.context;
    const mapSize = this.map.getSize();
    const widthSideA = mapSize[0] * percentSwipe;

    const coordinates = {
      topLeft: getRenderPixel(event, [0, 0]),
      bottomLeft: getRenderPixel(event, [0, mapSize[1]]),
      bottomRight: getRenderPixel(event, [widthSideA, mapSize[1]]),
      topRight: getRenderPixel(event, [widthSideA, 0]),
    };
    setRectClipMask(ctx, coordinates);
  };

  /**
   * Set Clipping mask for the "B" side of a comparison.
   * Note: The "B" side is layered above the "A" side on the DOM.
   * @param {Object} event | Openlayers Precompose event object
   */
  setClipMaskB = (event) => {
    const ctx = event.context;
    const mapSize = this.map.getSize();
    const widthSideB = mapSize[0] * percentSwipe;
    const coordinates = {
      topLeft: getRenderPixel(event, [widthSideB, 0]),
      bottomLeft: getRenderPixel(event, [widthSideB, mapSize[1]]),
      bottomRight: getRenderPixel(event, mapSize),
      topRight: getRenderPixel(event, [mapSize[0], 0]),
    };
    setRectClipMask(ctx, coordinates);
  };
}

/**
 * Apply a rectangular clipping mask from the provided coordinates
 * @param {CanvasRenderingContext2D} context | Canvas context requiring a clipping mask
 * @param {Object} coordinates | Contains 4 points of the rectangle to be created
 * @param {property} topLeft | Top Left positional coordinates in XY format
 * @param {property} bottomLeft | Bottom Left positional coordinates in XY format
 * @param {property} bottomRight | Bottom Right positional coordinates in XY format
 * @param {property} topRight | Top Right positional coordinates in XY format
 */
const setRectClipMask = function(context, coordinates) {
  const {
    topLeft, bottomLeft, bottomRight, topRight,
  } = coordinates;

  context.save();
  context.beginPath();
  context.moveTo(topLeft[0], topLeft[1]);
  context.lineTo(bottomLeft[0], bottomLeft[1]);
  context.lineTo(bottomRight[0], bottomRight[1]);
  context.lineTo(topRight[0], topRight[1]);
  context.closePath();
  context.clip();
};

/**
 * Add Swiper
 * @param {Object} map | OL map object
 * @param {String} dateA | YYYY-MM-DD
 * @param {String} dateB | YYYY-MM-DD
 */
const addLineOverlay = function(map, dateA, dateB) {
  const lineCaseEl = document.createElement('div');
  const draggerEl = document.createElement('div');
  const draggerCircleEl = document.createElement('div');
  const firstLabel = document.createElement('span');
  const secondLabel = document.createElement('span');
  const windowWidth = window.innerWidth;
  mapCase = map.getTargetElement();
  draggerCircleEl.className = 'swipe-dragger-circle';
  firstLabel.className = 'ab-swipe-span left-label';
  secondLabel.className = 'ab-swipe-span right-label';

  const dateElA = document.createElement('span');
  const dateElB = document.createElement('span');
  dateElA.className = 'monospace';
  dateElB.className = 'monospace';

  const isSameDate = dateA === dateB;
  const dateAText = 'A';
  const dateBText = 'B';
  firstLabel.appendChild(document.createTextNode(dateAText));
  secondLabel.appendChild(document.createTextNode(dateBText));

  if (!isSameDate) {
    firstLabel.className += ' show-date-label';
    secondLabel.className += ' show-date-label';
    dateElA.appendChild(document.createTextNode(`: ${dateA}`));
    dateElB.appendChild(document.createTextNode(`: ${dateB}`));

    firstLabel.appendChild(dateElA);
    secondLabel.appendChild(dateElB);
  }

  draggerEl.className = 'ab-swipe-dragger';
  lineCaseEl.className = 'ab-swipe-line';
  lineCaseEl.appendChild(firstLabel);
  lineCaseEl.appendChild(secondLabel);
  draggerEl.appendChild(draggerCircleEl);
  ReactDOM.render(<FontAwesomeIcon icon="arrows-alt-h" />, draggerCircleEl);
  lineCaseEl.appendChild(draggerEl);
  mapCase.appendChild(lineCaseEl);
  swipeOffset = percentSwipe
    ? windowWidth * percentSwipe
    : swipeOffset || windowWidth / 2;
  lineCaseEl.style.transform = `translateX( ${swipeOffset}px)`;

  // Add event listeners to Elements
  [lineCaseEl, draggerEl].forEach((el) => {
    el.addEventListener(
      'mousedown',
      () => {
        listenerObj = {
          type: 'default',
          start: 'mousedown',
          move: 'mousemove',
          end: 'mouseup',
        };
        dragLine(listenerObj, lineCaseEl, map);
      },
      true,
    );

    el.addEventListener(
      'touchstart',
      () => {
        listenerObj = {
          type: 'touch',
          start: 'touchstart',
          move: 'touchmove',
          end: 'touchend',
        };
        dragLine(listenerObj, lineCaseEl, map);
      },
      true,
    );
  });

  return lineCaseEl;
};

const dragLine = function(listenerObj, lineCaseEl, map) {
  function move(evt) {
    if (!dragging) {
      dragging = true;
      events.trigger(COMPARE_MOVE_START);
    }
    const windowWidth = window.innerWidth;
    if (listenerObj.type === 'default') evt.preventDefault();
    evt.stopPropagation();

    if (listenerObj.type === 'touch') {
      swipeOffset = evt.touches[0].pageX;
    } else {
      swipeOffset = evt.clientX;
    }
    // Prevent swiper from being swiped off screen
    swipeOffset = swipeOffset > windowWidth - SWIPE_PADDING
      ? windowWidth - SWIPE_PADDING
      : swipeOffset < SWIPE_PADDING
        ? SWIPE_PADDING
        : swipeOffset;
    percentSwipe = swipeOffset / windowWidth;
    lineCaseEl.style.transform = `translateX( ${swipeOffset}px)`;
    map.render();
  }

  function end(evt) {
    dragging = false;
    events.trigger(
      'compare:moveend',
      lodashRound((swipeOffset / mapCase.offsetWidth) * 100, 0),
    );
    window.removeEventListener(listenerObj.move, move);
    window.removeEventListener(listenerObj.end, end);
  }

  window.addEventListener(listenerObj.move, move);
  window.addEventListener(listenerObj.end, end);
};

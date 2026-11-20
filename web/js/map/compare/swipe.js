import { createRoot } from 'react-dom/client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import lodashRound from 'lodash/round';
import lodashEach from 'lodash/each';
import { getRenderPixel } from 'ol/render';

import util from '../../util/util';
import { getCompareDates } from '../../modules/compare/selectors';
import { COMPARE_MOVE_START } from '../../util/constants';

const { events } = util;

const SWIPE_PADDING = 30;

const restore = function(event) {
  const ctx = event.context;
  ctx.restore();
};

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

export default function Swipe(
  olMap,
  store,
  eventListenerStringObj,
  valueOverride,
) {
  const self = {};
  self.map = olMap;

  let swipeOffset = null;
  let line = null;
  let layersSideA = [];
  let layersSideB = [];
  let mapCase;
  let listenerObj = eventListenerStringObj;
  let percentSwipe = valueOverride / 100;
  let dragging = false;

  const applyListenersA = function(layer) {
    layer.on('prerender', setClipMaskA);
    layer.on('postrender', restore);
  };
  const applyListenersB = function(layer) {
    layer.on('prerender', setClipMaskB);
    layer.on('postrender', restore);
  };

  const dragLine = function(listenerObjArg, lineCase, map) {
    const lineCaseEl = lineCase;
    function move(evt) {
      if (!dragging) {
        dragging = true;
        events.trigger(COMPARE_MOVE_START);
      }
      const windowWidth = window.innerWidth;
      if (listenerObjArg.type === 'default') evt.preventDefault();
      evt.stopPropagation();

      if (listenerObjArg.type === 'touch') {
        swipeOffset = evt.touches[0].pageX;
      } else {
        swipeOffset = evt.clientX;
      }
      // Prevent swiper from being swiped off screen
      const swipeOffsetValue = swipeOffset < SWIPE_PADDING ? SWIPE_PADDING : swipeOffset;
      swipeOffset = swipeOffset > windowWidth - SWIPE_PADDING
        ? windowWidth - SWIPE_PADDING
        : swipeOffsetValue;
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
    const root = createRoot(draggerCircleEl);
    root.render(<FontAwesomeIcon icon="arrows-alt-h" widthAuto />);
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

  function getSwipeOffset() { return swipeOffset; }

  /**
   * Set Clipping mask for the "A" side of a comparison.
   * Note: The "B" side is layered above the "A" side on the DOM.
   * We must mask the "A" side in case the B side has no imagery
   * @param {Object} event | Openlayers Precompose event object
   */
  function setClipMaskA(event) {
    const ctx = event.context;
    const mapSize = self.map.getSize();
    const widthSideA = mapSize[0] * percentSwipe;

    const coordinates = {
      topLeft: getRenderPixel(event, [0, 0]),
      bottomLeft: getRenderPixel(event, [0, mapSize[1]]),
      bottomRight: getRenderPixel(event, [widthSideA, mapSize[1]]),
      topRight: getRenderPixel(event, [widthSideA, 0]),
    };
    setRectClipMask(ctx, coordinates);
  }

  /**
   * Set Clipping mask for the "B" side of a comparison.
   * Note: The "B" side is layered above the "A" side on the DOM.
   * @param {Object} event | Openlayers Precompose event object
   */
  function setClipMaskB(event) {
    const ctx = event.context;
    const mapSize = self.map.getSize();
    const widthSideB = mapSize[0] * percentSwipe;
    const coordinates = {
      topLeft: getRenderPixel(event, [widthSideB, 0]),
      bottomLeft: getRenderPixel(event, [widthSideB, mapSize[1]]),
      bottomRight: getRenderPixel(event, mapSize),
      topRight: getRenderPixel(event, [mapSize[0], 0]),
    };
    setRectClipMask(ctx, coordinates);
  }

  function onResize() {
    if (document.querySelector('.ab-swipe-line')) {
      self.destroy();
      self.create(store);
    }
  }

  function create(storeArg) {
    const state = storeArg.getState();
    const { dateA, dateB } = getCompareDates(state);
    self.dateA = dateA;
    self.dateB = dateB;
    line = addLineOverlay(self.map, self.dateA, self.dateB);
    window.addEventListener('resize', onResize);
    update(storeArg);
  }

  function destroy() {
    window.removeEventListener('resize', onResize);
    mapCase.removeChild(line);
    lodashEach(layersSideA, (layer) => {
      layer.un('prerender', setClipMaskA);
      layer.un('postrender', restore);
    });
    lodashEach(layersSideB, (layer) => {
      layer.un('prerender', setClipMaskB);
      layer.un('postrender', restore);
    });
    layersSideA = [];
    layersSideB = [];
  }

  function update(storeArg) {
    const state = storeArg.getState();
    const { dateA, dateB } = getCompareDates(state);

    if (dateA !== self.dateA || dateB !== self.dateB) {
      self.destroy();
      self.create(storeArg);
    } else {
      const layerGroups = self.map.getLayers().getArray();
      layersSideA = layerGroups[0].getLayersArray();
      layersSideB = layerGroups[1].getLayersArray();
      layersSideA.forEach((l) => {
        applyEventListeners(l, applyListenersA);
      });
      layersSideB.forEach((l) => {
        applyEventListeners(l, applyListenersB);
      });
    }
  }

  function applyEventListeners(layer, callback) {
    const layers = layer.get('layers');
    if (layers) {
      lodashEach(layers.getArray(), (l) => {
        applyEventListeners(l, callback);
      });
    } else {
      callback(layer);
    }
  }

  self.getSwipeOffset = getSwipeOffset;
  self.create = create;
  self.update = update;
  self.destroy = destroy;
  self.applyEventListeners = applyEventListeners;
  self.setClipMaskA = setClipMaskA;
  self.setClipMaskB = setClipMaskB;

  self.create(store);

  return self;
}

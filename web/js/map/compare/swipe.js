import lodashEach from 'lodash/each';
import lodashRound from 'lodash/round';
import util from '../../util/util';

var swipeOffset = null;
var line = null;
var bottomLayers = [];
var topLayers = [];
var events;
var mapCase;
var listenerObj;
var percentSwipe = null;
const SWIPE_PADDING = 30;
var dragging = false;

export class Swipe {
  constructor(
    olMap,
    isActive,
    compareEvents,
    eventListenerStringObj,
    valueOverride
  ) {
    listenerObj = eventListenerStringObj;
    this.map = olMap;
    percentSwipe = valueOverride / 100;
    events = compareEvents;
    this.create();
    $(window).resize(() => {
      if (document.querySelector('.ab-swipe-line')) {
        this.destroy();
        this.create();
      }
    });
  }

  create() {
    line = addLineOverlay(this.map);
    this.update();
  }

  getSwipeOffset() {
    return swipeOffset;
  }

  /**
   * Recursively apply listeners to layers
   * @param {Object} layer | Layer or layer Group obj
   * @param {Function} callback | Function that will apply event listeners to layer
   */
  applyEventsToBaseLayers(layer, callback) {
    var layers = layer.get('layers');
    if (layers) {
      lodashEach(layers.getArray(), layer => {
        this.applyEventsToBaseLayers(layer, callback);
      });
    } else {
      callback.call(this, layer);
    }
  }

  update(isCompareA, groupName) {
    var mapLayers = this.map.getLayers().getArray();
    if (!groupName) {
      this.applyEventsToBaseLayers(mapLayers[1], applyLayerListeners);
      this.applyEventsToBaseLayers(mapLayers[0], applyReverseLayerListeners);
    } else if (groupName === 'active') {
      this.applyEventsToBaseLayers(mapLayers[0], applyReverseLayerListeners);
    } else {
      this.applyEventsToBaseLayers(mapLayers[1], applyLayerListeners);
    }
  }

  /**
   * Clip the top layer at the right xOffset
   * @param {Object} event | OL Precompose event object
   */
  clip(event) {
    var ctx = event.context;
    var viewportWidth = event.frameState.size[0];
    var width = ctx.canvas.width * (swipeOffset / viewportWidth);
    ctx.save();
    ctx.beginPath();
    ctx.rect(width, 0, ctx.canvas.width - width, ctx.canvas.height);
    ctx.clip();
  }

  /**
   * Clip the reverse so users don't see this layerGroup when the other
   * Layer group is transparent
   * @param {Object} event | OL Precompose event object
   */
  reverseClip(event) {
    var ctx = event.context;
    var viewportWidth = event.frameState.size[0];
    var width = ctx.canvas.width * (1 - swipeOffset / viewportWidth);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, ctx.canvas.width - width, ctx.canvas.height);
    ctx.clip();
  }

  destroy() {
    mapCase.removeChild(line);
    this.removeListenersFromLayers(topLayers);
    this.removeListenersFromBottomLayers(bottomLayers);
    topLayers = [];
    bottomLayers = [];
  }

  /**
   * Remove all listeners from layer group
   * @param {Array} layers | Layer group
   */
  removeListenersFromBottomLayers(layers) {
    lodashEach(layers, layer => {
      layer.un('precompose', this.reverseClip);
      layer.un('postcompose', restore);
    });
  }

  /**
   * Remove all listeners from layer group
   * @param {Array} layers | Layer group
   */
  removeListenersFromLayers(layers) {
    lodashEach(layers, layer => {
      layer.un('precompose', this.clip);
      layer.un('postcompose', restore);
    });
  }
}

/**
 * Add Swiper
 * @param {Object} map | OL map object
 */
var addLineOverlay = function (map) {
  var lineCaseEl = document.createElement('div');
  var draggerEl = document.createElement('div');
  var draggerCircleEl = document.createElement('div');
  var iconEl = document.createElement('i');
  var firstLabel = document.createElement('span');
  var secondLabel = document.createElement('span');
  var windowWidth = util.browser.dimensions[0];
  mapCase = map.getTargetElement();
  draggerCircleEl.className = 'swipe-dragger-circle';
  firstLabel.className = 'ab-swipe-span left-label';
  secondLabel.className = 'ab-swipe-span right-label';
  firstLabel.appendChild(document.createTextNode('A'));
  secondLabel.appendChild(document.createTextNode('B'));

  iconEl.className = 'fas fa-arrows-alt-h';
  draggerEl.className = 'ab-swipe-dragger';
  lineCaseEl.className = 'ab-swipe-line';
  lineCaseEl.appendChild(firstLabel);
  lineCaseEl.appendChild(secondLabel);
  draggerEl.appendChild(draggerCircleEl);
  draggerCircleEl.appendChild(iconEl);
  lineCaseEl.appendChild(draggerEl);
  mapCase.appendChild(lineCaseEl);
  swipeOffset = percentSwipe
    ? windowWidth * percentSwipe
    : swipeOffset || windowWidth / 2;
  lineCaseEl.style.transform = 'translateX( ' + swipeOffset + 'px)';

  // Add event listeners to Elements
  [lineCaseEl, draggerEl].forEach(el => {
    el.addEventListener(
      'mousedown',
      function onTouchEnd() {
        listenerObj = {
          type: 'default',
          start: 'mousedown',
          move: 'mousemove',
          end: 'mouseup'
        };
        dragLine(listenerObj, lineCaseEl, map);
      },
      true
    );

    el.addEventListener(
      'touchstart',
      function onTouchStart() {
        listenerObj = {
          type: 'touch',
          start: 'touchstart',
          move: 'touchmove',
          end: 'touchend'
        };
        dragLine(listenerObj, lineCaseEl, map);
      },
      true
    );
  });

  return lineCaseEl;
};

var dragLine = function (listenerObj, lineCaseEl, map) {
  function move(evt) {
    if (!dragging) {
      dragging = true;
      events.trigger('movestart');
    }
    var windowWidth = util.browser.dimensions[0];
    if (listenerObj.type === 'default') evt.preventDefault();
    evt.stopPropagation();

    if (listenerObj.type === 'touch') {
      swipeOffset = evt.touches[0].pageX;
    } else {
      swipeOffset = evt.clientX;
    }
    // Prevent swiper from being swiped off screen
    swipeOffset =
      swipeOffset > windowWidth - SWIPE_PADDING
        ? windowWidth - SWIPE_PADDING
        : swipeOffset < SWIPE_PADDING
          ? SWIPE_PADDING
          : swipeOffset;
    percentSwipe = swipeOffset / windowWidth;
    lineCaseEl.style.transform = 'translateX( ' + swipeOffset + 'px)';

    map.render();
  }
  function end(evt) {
    dragging = false;
    events.trigger(
      'moveend',
      lodashRound((swipeOffset / mapCase.offsetWidth) * 100, 0)
    );

    window.removeEventListener(listenerObj.move, move);
    window.removeEventListener(listenerObj.end, end);
  }
  window.addEventListener(listenerObj.move, move);
  window.addEventListener(listenerObj.end, end);
};
/**
 * Add listeners for layer clipping
 * @param {Object} layer | Ol Layer object
 */
var applyLayerListeners = function (layer) {
  layer.on('precompose', this.clip);
  layer.on('postcompose', restore);
  bottomLayers.push(layer);
};
/**
 * Layers need to be inversly clipped so that they can't be seen through
 * the other layergroup in cases where the layergroups layer opacity is < 100%
 * @param {Object} layer | Ol Layer object
 */
var applyReverseLayerListeners = function (layer) {
  layer.on('precompose', this.reverseClip);
  layer.on('postcompose', restore);
  topLayers.push(layer);
};

var restore = function (event) {
  var ctx = event.context;
  ctx.restore();
};
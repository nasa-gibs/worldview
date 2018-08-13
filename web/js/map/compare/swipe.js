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
export class Swipe {
  constructor(
    olMap,
    isAactive,
    compareEvents,
    eventListenerStringObj,
    valueOverride
  ) {
    listenerObj = eventListenerStringObj;
    this.map = olMap;
    percentSwipe = valueOverride / 100;
    events = compareEvents;
    this.create();
  }
  create() {
    line = addLineOverlay(this.map);
    this.update();
  }

  getSwipeOffset() {
    return swipeOffset;
  }
  update(isCompareA, groupName) {
    var mapLayers = this.map.getLayers().getArray();
    if (!groupName) {
      applyEventsToBaseLayers.call(this, mapLayers[1], applyLayerListeners);
      applyEventsToBaseLayers.call(
        this,
        mapLayers[0],
        applyReverseLayerListeners
      );
    } else if (groupName === 'active') {
      applyEventsToBaseLayers.call(
        this,
        mapLayers[0],
        applyReverseLayerListeners
      );
    } else {
      applyEventsToBaseLayers.call(this, mapLayers[1], applyLayerListeners);
    }
  }
  destroy() {
    mapCase.removeChild(line);
    removeListenersFromLayers(topLayers);
    removeListenersFromBottomLayers(bottomLayers);
  }
}
/**
 * Add Swiper
 * @param {Object} map | OL map object
 */
var addLineOverlay = function(map) {
  var lineCaseEl = document.createElement('div');
  var draggerEl = document.createElement('div');
  var iconEl = document.createElement('i');
  var firstLabel = document.createElement('span');
  var secondLabel = document.createElement('span');
  var windowWidth = util.browser.dimensions[0];
  mapCase = document.getElementById('wv-map');
  firstLabel.className = 'ab-swipe-span left-label';
  secondLabel.className = 'ab-swipe-span right-label';
  firstLabel.appendChild(document.createTextNode('A'));
  secondLabel.appendChild(document.createTextNode('B'));

  iconEl.className = 'fa fa-arrows-h';
  draggerEl.className = 'ab-swipe-dragger';
  lineCaseEl.className = 'ab-swipe-line';
  lineCaseEl.appendChild(firstLabel);
  lineCaseEl.appendChild(secondLabel);
  draggerEl.appendChild(iconEl);
  lineCaseEl.appendChild(draggerEl);
  mapCase.appendChild(lineCaseEl);
  swipeOffset = percentSwipe
    ? mapCase.offsetWidth * percentSwipe
    : swipeOffset || mapCase.offsetWidth / 2;
  lineCaseEl.style.transform = 'translateX( ' + swipeOffset + 'px)';

  // Add event listeners to Elements
  [lineCaseEl, draggerEl].forEach(el => {
    el.addEventListener(listenerObj.start, evt => {
      events.trigger('moveStart');
      evt.preventDefault();
      evt.stopPropagation();
      function move(evt) {
        evt.preventDefault();
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

        lineCaseEl.style.transform = 'translateX( ' + swipeOffset + 'px)';

        map.render();
      }
      function end(evt) {
        events.trigger(
          'moveend',
          lodashRound((swipeOffset / mapCase.offsetWidth) * 100, 0)
        );

        window.removeEventListener(listenerObj.move, move);
        window.removeEventListener(listenerObj.end, end);
      }
      window.addEventListener(listenerObj.move, move);
      window.addEventListener(listenerObj.end, end);
    });
  });
  return lineCaseEl;
};
/**
 * Add listeners for layer clipping
 * @param {Object} layer | Ol Layer object
 */
var applyLayerListeners = function(layer) {
  layer.on('precompose', clip.bind(this));
  layer.on('postcompose', restore);
  bottomLayers.push(layer);
};
/**
 * Layers need to be inversly clipped so that they can't be seen through
 * the other layergroup in cases where the layergroups layer opacity is < 100%
 * @param {Object} layer | Ol Layer object
 */
var applyReverseLayerListeners = function(layer) {
  layer.on('precompose', reverseClip.bind(this));
  layer.on('postcompose', restore);
  topLayers.push(layer);
};
/**
 * Clip the top layer at the right xOffset
 * @param {Object} event | OL Precompose event object
 */
var clip = function(event) {
  var ctx = event.context;
  var viewportWidth = this.map.getSize()[0];
  var width = ctx.canvas.width * (swipeOffset / viewportWidth);
  ctx.save();
  ctx.beginPath();
  ctx.rect(width, 0, ctx.canvas.width - width, ctx.canvas.height);
  ctx.clip();
};
/**
 * Clip the reverse so users don't see this layerGroup when the other
 * Layer group is transparent
 * @param {Object} event | OL Precompose event object
 */
var reverseClip = function(event) {
  var ctx = event.context;
  var viewportWidth = this.map.getSize()[0];
  var width = ctx.canvas.width * (1 - swipeOffset / viewportWidth);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, ctx.canvas.width - width, ctx.canvas.height);
  ctx.clip();
};
var restore = function(event) {
  var ctx = event.context;
  ctx.restore();
};
/**
 * Remove all listeners from layer group
 * @param {Array} layers | Layer group
 */
var removeListenersFromBottomLayers = function(layers) {
  lodashEach(layers, layer => {
    layer.un('precompose', reverseClip);
    layer.un('postcompose', restore);
  });
};
/**
 * Remove all listeners from layer group
 * @param {Array} layers | Layer group
 */
var removeListenersFromLayers = function(layers) {
  lodashEach(layers, layer => {
    layer.un('precompose', clip);
    layer.un('postcompose', restore);
  });
};
/**
 * Recursively apply listeners to layers
 * @param {Object} layer | Layer or layer Group obj
 * @param {Object} map | OL Map Object
 * @param {Function} callback | Function that will apply event listeners to layer
 */
var applyEventsToBaseLayers = function(layer, callback) {
  var layers = layer.get('layers');
  if (layers) {
    lodashEach(layers.getArray(), layer => {
      applyEventsToBaseLayers.call(this, layer, callback);
    });
  } else {
    callback.call(this, layer);
  }
};

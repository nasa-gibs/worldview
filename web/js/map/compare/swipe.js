import lodashEach from 'lodash/each';

var swipeOffset = null;
var line = null;
var bottomLayers = [];
var topLayers = [];
var map;
var events;
var mapCase;
export class Swipe {
  constructor(olMap, isAactive, compareEvents) {
    map = olMap;
    events = compareEvents;
    this.create();
  }
  create() {
    line = addLineOverlay(map);
    this.update();
  }

  getSwipeOffset() {
    return swipeOffset;
  }
  update() {
    var mapLayers = map.getLayers().getArray();
    applyEventsToBaseLayers(mapLayers[1], map, applyLayerListeners);
    applyEventsToBaseLayers(mapLayers[0], map, applyReverseLayerListeners);
  }
  destroy() {
    mapCase.removeChild(line);
    removeListenersFromLayers(topLayers);
    removeListenersFromBottomLayers(bottomLayers);
  }
}

var addLineOverlay = function(map) {
  var lineCaseEl = document.createElement('div');
  var draggerEl = document.createElement('div');
  var iconEl = document.createElement('i');
  var firstLabel = document.createElement('span');
  var secondLabel = document.createElement('span');
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
  swipeOffset = swipeOffset || mapCase.offsetWidth / 2;
  lineCaseEl.style.transform = 'translateX( ' + swipeOffset + 'px)';

  [lineCaseEl, draggerEl].forEach(el => {
    el.addEventListener('mousedown', evt => {
      events.trigger('mousedown');
      evt.preventDefault();
      evt.stopPropagation();
      function move(evt) {
        evt.preventDefault();
        evt.stopPropagation();
        swipeOffset = evt.clientX;
        lineCaseEl.style.transform = 'translateX( ' + swipeOffset + 'px)';

        map.render();
      }
      function end(evt) {
        events.trigger('mouseup');
        window.removeEventListener('mousemove', move);
        window.removeEventListener('mouseup', end);
      }
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', end);
    });
  });
  return lineCaseEl;
};
var applyLayerListeners = function(layer) {
  layer.on('precompose', clip);
  layer.on('postcompose', restore);
  bottomLayers.push(layer);
};
var applyReverseLayerListeners = function(layer) {
  layer.on('precompose', reverseClip);
  layer.on('postcompose', restore);
  topLayers.push(layer);
};

var clip = function(event) {
  var ctx = event.context;
  var viewportWidth = map.getSize()[0];
  var width = ctx.canvas.width * (swipeOffset / viewportWidth);
  ctx.save();
  ctx.beginPath();
  ctx.rect(width, 0, ctx.canvas.width - width, ctx.canvas.height);
  ctx.clip();
};
var reverseClip = function(event) {
  var ctx = event.context;
  var viewportWidth = map.getSize()[0];
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
var removeListenersFromBottomLayers = function(layers) {
  lodashEach(layers, layer => {
    layer.un('precompose', reverseClip);
    layer.un('postcompose', restore);
  });
};
var removeListenersFromLayers = function(layers) {
  lodashEach(layers, layer => {
    layer.un('precompose', clip);
    layer.un('postcompose', restore);
  });
};

var applyEventsToBaseLayers = function(layer, map, callback) {
  var layers = layer.get('layers');
  if (layers) {
    lodashEach(layers.getArray(), layer => {
      applyEventsToBaseLayers(layer, map, callback);
    });
  } else {
    callback(layer);
  }
};

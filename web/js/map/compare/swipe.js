import lodashEach from 'lodash/each';

var swipeOffset = null;
var line = null;
var layers = [];
var map;
export class Swipe {
  constructor(olMap) {
    map = olMap;
    this.create();
  }
  create() {
    line = addLineOverlay(map);
    this.update();
  }
  update() {
    var mapLayers = map.getLayers().getArray();
    applyEventsToBaseLayers(mapLayers[1], map, applyLayerListeners);
  }
  destroy() {
    line.remove();
    removeListenersFromLayers(layers);
  }
}

var addLineOverlay = function(map) {
  var lineCaseEl = document.createElement('div');
  var draggerEl = document.createElement('div');
  var iconEl = document.createElement('i');
  var mapCase = document.getElementById('wv-map');
  iconEl.className = 'fa fa-arrows-h';
  draggerEl.className = 'ab-swipe-dragger';
  lineCaseEl.className = 'ab-swipe-line';

  draggerEl.appendChild(iconEl);
  lineCaseEl.appendChild(draggerEl);
  mapCase.appendChild(lineCaseEl);
  swipeOffset = swipeOffset || mapCase.offsetWidth / 2;
  lineCaseEl.style.transform = 'translateX( ' + swipeOffset + 'px)';

  draggerEl.addEventListener('mousedown', evt => {
    evt.preventDefault();
    evt.stopPropagation();
    function move(evt) {
      evt.preventDefault();
      evt.stopPropagation();
      swipeOffset += evt.movementX;
      lineCaseEl.style.transform = 'translateX( ' + swipeOffset + 'px)';
      map.render();
    }
    function end(evt) {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', end);
    }
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
  });
  return lineCaseEl;
};
var applyLayerListeners = function(layer) {
  layer.on('precompose', clip);
  layer.on('postcompose', restore);
  layers.push(layer);
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
var restore = function(event) {
  var ctx = event.context;
  ctx.restore();
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

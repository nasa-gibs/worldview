import lodashEach from 'lodash/each';

var mousePosition = null;
var spy = null;
var layers = [];
var map;
var radius = 70;
export class Spy {
  constructor(olMap) {
    map = olMap;
    this.create();
  }
  create() {
    spy = this.addSpy(map);
    this.update();
  }
  update() {
    var mapLayers = map.getLayers().getArray();
    applyEventsToBaseLayers(mapLayers[1], map, applyLayerListeners);
  }
  destroy() {
    spy.removeEventListener('mousemove', this.updateSpy);
    removeListenersFromLayers(layers);
  }
  updateSpy(e) {
    mousePosition = map.getEventPixel(e);
    map.render();
  }
  addSpy(map) {
    var mapCase = document.getElementById('wv-map');
    mapCase.addEventListener('mousemove', this.updateSpy);
    return mapCase;
  }
}

var applyLayerListeners = function(layer) {
  layer.on('precompose', clip);
  layer.on('postcompose', restore);
  layers.push(layer);
};
var clip = function(event) {
  var ctx = event.context;
  var pixelRatio = event.frameState.pixelRatio;
  ctx.save();
  ctx.beginPath();
  if (mousePosition) {
    // only show a circle around the mouse
    ctx.arc(
      mousePosition[0] * pixelRatio,
      mousePosition[1] * pixelRatio,
      radius * pixelRatio,
      0,
      2 * Math.PI
    );
    ctx.lineWidth = 5 * pixelRatio;
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.stroke();
  }
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

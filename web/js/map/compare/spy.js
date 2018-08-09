import lodashEach from 'lodash/each';

var mousePosition = null;
var spy = null;
var topLayers = [];
var bottomLayers = [];
var map;
const DEFAULT_RADIUS = 140;
var radius = DEFAULT_RADIUS;
var label = null;
export class Spy {
  constructor(olMap, isBInside) {
    this.mapCase = document.getElementById('wv-map');
    map = olMap;
    this.create(isBInside);
  }
  /**
   * Init spy
   * @param {Boolean} isBInside | B is the spy value -- true|false
   */
  create(isBInside) {
    spy = this.addSpy(map, isBInside);
    this.isBInside = isBInside;
    this.update(isBInside);
  }
  /**
   * Update spy
   * @param {Boolean} isBInside | B is the spy value -- true|false
   */
  update(isBInside) {
    if (this.isBInside !== isBInside) {
      this.destroy();
      this.create(isBInside);
    } else {
      var mapLayers = map.getLayers().getArray();
      applyEventsToBaseLayers(mapLayers[0], map, applyreverseLayerListeners);
      applyEventsToBaseLayers(mapLayers[1], map, applyLayerListeners);
    }
  }
  /**
   * Remove all nodes and listeners
   */
  destroy() {
    spy.removeEventListener('mousemove', this.updateSpy);
    this.mapCase.removeChild(label);
    removeListenersFromLayers(topLayers);
    removeInverseListenersFromLayers(bottomLayers);
  }
  /**
   * On mouse move update spy location
   * @param {Object} e | mousemove event object
   */
  updateSpy(e) {
    mousePosition = map.getEventPixel(e);
    radius = DEFAULT_RADIUS;
    map.render();
  }
  /**
   * Hide spy stuff when mouse is not hovering map
   * @param {Object} e | mouseleave event object
   */
  hideSpy(e) {
    radius = 0;
    label.style.display = 'none';
    map.render();
  }
  /**
   * Show spy stuff when mouse is not hovering map
   * @param {Object} e | mouseenter event object
   */
  showSpy() {
    radius = DEFAULT_RADIUS;
    label.style.display = 'block';
    map.render();
  }
  /**
   * Add Correct listeners for layer clipping based on whether
   * B or A should be the spy
   * @param {Object} map | OL Map Object
   * @param {Boolean} isBInside | B is the spy value -- true|false
   */
  addSpy(map, isBInside) {
    var insideText = !isBInside ? 'A' : 'B';
    label = document.createElement('span');
    label.className = 'ab-spy-span inside-label';
    label.style.display = 'none';
    label.appendChild(document.createTextNode(insideText));

    this.mapCase.appendChild(label);

    this.mapCase.addEventListener('mousemove', this.updateSpy);
    this.mapCase.addEventListener('mouseleave', this.hideSpy);
    this.mapCase.addEventListener('mouseenter', this.showSpy);

    return this.mapCase;
  }
}
/**
 * Layers need to be inversly clipped so that they can't be seen through
 * the other layergroup in cases where the layergroups layer opacity is < 100%
 * @param {Object} layer | Ol Layer object
 */
var applyreverseLayerListeners = function(layer) {
  layer.on('precompose', inverseClip);
  layer.on('postcompose', restore);
  bottomLayers.push(layer);
};
/**
 * Add listeners for layer clipping
 * @param {Object} layer | Ol Layer object
 */
var applyLayerListeners = function(layer) {
  layer.on('precompose', clip);
  layer.on('postcompose', restore);
  topLayers.push(layer);
};
/**
 * Clip everything but the circle
 * @param {Object} event | Event object
 */
var inverseClip = function(event) {
  var ctx = event.context;
  var pixelRatio = event.frameState.pixelRatio;
  ctx.save();
  ctx.beginPath();
  if (mousePosition) {
    // only show a circle around the mouse
    let x = mousePosition[0];
    let y = mousePosition[1];
    ctx.arc(
      x * pixelRatio,
      y * pixelRatio,
      radius * pixelRatio,
      0,
      2 * Math.PI
    );
    ctx.rect(ctx.canvas.width, ctx.canvas.height, -ctx.canvas.width, 0);
    ctx.fill();
  }
};
/**
 * Clip the circle of a layer so users can see through
 */
var clip = function(event) {
  var ctx = event.context;
  var pixelRatio = event.frameState.pixelRatio;
  ctx.save();
  ctx.beginPath();
  if (mousePosition) {
    // only show a circle around the mouse
    let x = mousePosition[0];
    let y = mousePosition[1];
    let pixelRadius = radius * pixelRatio;

    ctx.arc(x * pixelRatio, y * pixelRatio, pixelRadius, 0, 2 * Math.PI);
    let offSetXandY = Math.sqrt((radius * radius) / 2);
    label.style.top = y + offSetXandY - 10 + 'px';
    label.style.left = x + offSetXandY - 5 + 'px';

    ctx.lineWidth = 4 * pixelRatio;
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.stroke();
  }
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
var removeListenersFromLayers = function(layers) {
  lodashEach(layers, layer => {
    layer.un('precompose', clip);
    layer.un('postcompose', restore);
  });
};
/**
 * Remove all listeners from layer group
 * @param {Array} layers | Layer group
 */
var removeInverseListenersFromLayers = function(layers) {
  lodashEach(layers, layer => {
    layer.un('precompose', inverseClip);
    layer.un('postcompose', restore);
  });
};
/**
 * Recursively apply listeners to layers
 * @param {Object} layer | Layer or layer Group obj
 * @param {Object} map | OL Map Object
 * @param {Function} callback | Function that will apply event listeners to layer
 */
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

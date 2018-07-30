import lodashEach from 'lodash/each';

var mousePosition = null;
var spy = null;
var topLayers = [];
var bottomLayers = [];
var map;
const DEFAULT_RADIUS = 70;
var radius = DEFAULT_RADIUS;
var label = null;
export class Spy {
  constructor(olMap, isBInside) {
    this.mapCase = document.getElementById('wv-map');
    map = olMap;
    this.create(isBInside);
  }
  create(isBInside) {
    spy = this.addSpy(map, isBInside);
    this.isBInside = isBInside;
    this.update(isBInside);
  }
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
  destroy() {
    spy.removeEventListener('mousemove', this.updateSpy);
    this.mapCase.removeChild(label);
    removeListenersFromLayers(topLayers);
    removeInverseListenersFromLayers(bottomLayers);
  }
  updateSpy(e) {
    mousePosition = map.getEventPixel(e);
    radius = DEFAULT_RADIUS;
    map.render();
  }
  hideSpy(e) {
    radius = 0;
    label.style.display = 'none';
    map.render();
  }
  showSpy() {
    radius = DEFAULT_RADIUS;
    label.style.display = 'block';
    map.render();
  }
  addSpy(map, isBInside) {
    var insideText = !isBInside ? 'A' : 'B';
    label = document.createElement('span');
    label.className = 'ab-spy-span inside-label';
    label.appendChild(document.createTextNode(insideText));

    this.mapCase.appendChild(label);

    this.mapCase.addEventListener('mousemove', this.updateSpy);
    this.mapCase.addEventListener('mouseleave', this.hideSpy);
    this.mapCase.addEventListener('mouseenter', this.showSpy);

    return this.mapCase;
  }
}
var applyreverseLayerListeners = function(layer) {
  layer.on('precompose', inverseClip);
  layer.on('postcompose', restore);
  bottomLayers.push(layer);
};
var applyLayerListeners = function(layer) {
  layer.on('precompose', clip);
  layer.on('postcompose', restore);
  topLayers.push(layer);
};
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
var clip = function(event) {
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
    let offSetXandY = Math.sqrt(DEFAULT_RADIUS * DEFAULT_RADIUS) / 2;
    label.style.top = y + offSetXandY + 10 + 'px';
    label.style.left = x + offSetXandY + 5 + 'px';

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
var removeListenersFromLayers = function(layers) {
  lodashEach(layers, layer => {
    layer.un('precompose', clip);
    layer.un('postcompose', restore);
  });
};
var removeInverseListenersFromLayers = function(layers) {
  lodashEach(layers, layer => {
    layer.un('precompose', inverseClip);
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

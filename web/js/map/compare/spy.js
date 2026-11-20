import { each as lodashEach } from 'lodash';
import { getRenderPixel } from 'ol/render';
import { getCompareDates } from '../../modules/compare/selectors';

const DEFAULT_RADIUS = 140;

const restore = function(event) {
  const ctx = event.context;
  ctx.restore();
};

/**
 * Recursively apply listeners to layers
 * @param {Object} layer | Layer or layer Group obj
 * @param {Object} map | OL Map Object
 * @param {Function} callback | Function that will apply event listeners to layer
 */
const applyEventsToBaseLayers = function(layer, map, callback) {
  const layers = layer.get('layers');
  if (layers) {
    lodashEach(layers.getArray(), (layerArg) => {
      applyEventsToBaseLayers(layerArg, map, callback);
    });
  } else {
    callback(layer);
  }
};

const isCompareA = (state) => state.compare.isCompareA;

const getDateText = function(state) {
  const isBInside = isCompareA(state);
  const { dateA, dateB } = getCompareDates(state);
  const isSameDate = dateA === dateB;
  let innerHtml = isBInside ? 'B' : 'A';
  if (!isSameDate) {
    const dateText = isBInside ? dateB : dateA;
    innerHtml += `: <span class="monospace">${dateText}</span>`;
  }
  return innerHtml;
};

export default function Spy(olMap, store) {
  const self = {};
  self.mapCase = document.getElementById('wv-map');
  self.map = olMap;

  let mousePosition = null;
  let label = null;
  let radius = DEFAULT_RADIUS;
  const topLayers = [];
  const bottomLayers = [];

  /**
   * Clip everything but the circle
   * @param {Object} event | Event object
   */
  const inverseClip = function(event) {
    const ctx = event.context;
    ctx.save();
    ctx.beginPath();
    if (mousePosition) {
      // only show a circle around the mouse
      const pixel = getRenderPixel(event, mousePosition);
      const offset = getRenderPixel(event, [mousePosition[0] + radius, mousePosition[1]]);
      const canvasRadius = Math.sqrt(((offset[0] - pixel[0]) ** 2) + ((offset[1] - pixel[1]) ** 2));
      ctx.arc(pixel[0], pixel[1], canvasRadius, 0, 2 * Math.PI);
      ctx.closePath();
      ctx.lineWidth = (5 * canvasRadius) / radius;
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.clip();
      ctx.clearRect(0, 0, offset, offset);
    }
  };

  /**
   * Clip the circle of a layer so users can see through
   */
  const clip = function(event) {
    const ctx = event.context;
    ctx.save();
    ctx.beginPath();
    if (mousePosition) {
      // only show a circle around the mouse
      const pixel = getRenderPixel(event, mousePosition);
      const offset = getRenderPixel(event, [mousePosition[0] + radius, mousePosition[1]]);
      const canvasRadius = Math.sqrt(((offset[0] - pixel[0]) ** 2) + ((offset[1] - pixel[1]) ** 2));
      ctx.arc(pixel[0], pixel[1], canvasRadius, 0, 2 * Math.PI);
      ctx.lineWidth = (5 * canvasRadius) / radius;
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.stroke();
    }
    ctx.clip();
  };

  /**
   * Layers need to be inversely clipped so that they can't be seen through
   * the other layergroup in cases where the layergroups layer opacity is < 100%
   * @param {Object} layer | Ol Layer object
   */
  const applyReverseLayerListeners = function(layer) {
    layer.on('postrender', inverseClip);
    layer.on('postrender', restore);
    bottomLayers.push(layer);
  };

  /**
   * Add listeners for layer clipping
   * @param {Object} layer | Ol Layer object
   */
  const applyLayerListeners = function(layer) {
    layer.on('prerender', clip);
    layer.on('postrender', restore);
    topLayers.push(layer);
  };

  /**
   * Remove all listeners from layer group
   * @param {Array} layers | Layer group
   */
  const removeListenersFromLayers = function(layers) {
    lodashEach(layers, (layer) => {
      layer.un('prerender', clip);
      layer.un('postrender', restore);
    });
  };

  /**
   * Remove all listeners from layer group
   * @param {Array} layers | Layer group
   */
  const removeInverseListenersFromLayers = function(layers) {
    lodashEach(layers, (layer) => {
      layer.un('postrender', inverseClip);
      layer.un('postrender', restore);
    });
  };

  /**
   * On mouse move update spy location
   * @param {Object} e | mousemove event object
   */
  function updateSpy(e) {
    mousePosition = e.pixel || self.map.getEventPixel(e);
    radius = DEFAULT_RADIUS;
    const offSetXandY = Math.sqrt((radius * radius) / 2);
    label.style.top = `${mousePosition[1] + offSetXandY - 10}px`;
    label.style.left = `${mousePosition[0] + offSetXandY - 5}px`;
    self.map.render();
  }

  /**
   * Hide spy stuff when mouse is not hovering map
   * @param {Object} e | mouseleave event object
   */
  function hideSpy(e) {
    radius = 0;
    label.style.display = 'none';
    self.map.render();
  }

  /**
   * Show spy stuff when mouse is not hovering map
   * @param {Object} e | mouseenter event object
   */
  function showSpy() {
    radius = DEFAULT_RADIUS;
    label.style.display = 'block';
    self.map.render();
  }

  /**
   * Add Correct listeners for layer clipping based on whether
   * B or A should be the spy
   * @param {Object} map | OL Map Object
   * @param {Boolean} isBInside | B is the spy value -- true|false
   */
  function addSpy(map, state) {
    label = document.createElement('span');
    label.className = 'ab-spy-span inside-label';
    label.style.display = 'none';
    label.innerHTML = getDateText(state);

    self.mapCase.appendChild(label);
    self.mapCase.addEventListener('mousemove', updateSpy);
    map.on('pointerdrag', updateSpy);
    self.mapCase.addEventListener('mouseleave', hideSpy);
    self.mapCase.addEventListener('mouseenter', showSpy);

    return self.mapCase;
  }

  /**
   * Init spy
   * @param {Boolean} isBInside | B is the spy value -- true|false
   */
  function create(storeArg) {
    const state = storeArg.getState();
    const isBInside = isCompareA(state);
    addSpy(self.map, state);
    self.isBInside = isBInside;
    update(storeArg);
  }

  /**
   * Update spy
   * @param {Boolean} isBInside | B is the spy value -- true|false
   */
  function update(storeArg) {
    const state = storeArg.getState();
    const isBInside = isCompareA(state);
    const { dateA, dateB } = getCompareDates(state);
    if (dateA !== self.dateA || dateB !== self.dateB || dateA === dateB) {
      label.innerHTML = getDateText(state);
    }
    self.dateA = dateA;
    self.dateB = dateB;
    if (self.isBInside !== isBInside) {
      self.destroy();
      self.create(storeArg);
    } else {
      removeListenersFromLayers(topLayers);
      removeInverseListenersFromLayers(bottomLayers);
      topLayers.length = 0;
      bottomLayers.length = 0;
      const mapLayers = self.map.getLayers().getArray();
      applyEventsToBaseLayers(
        mapLayers[0],
        self.map,
        applyReverseLayerListeners,
      );
      applyEventsToBaseLayers(mapLayers[1], self.map, applyLayerListeners);
    }
  }

  /**
   * Remove all nodes and listeners
   */
  function destroy() {
    self.mapCase.removeEventListener('mousemove', updateSpy);
    self.map.un('pointerdrag', updateSpy);
    self.mapCase.removeEventListener('mouseleave', hideSpy);
    self.mapCase.removeEventListener('mouseenter', showSpy);
    self.mapCase.removeChild(label);
    removeListenersFromLayers(topLayers);
    removeInverseListenersFromLayers(bottomLayers);
    topLayers.length = 0;
    bottomLayers.length = 0;
    mousePosition = null;
  }

  self.create = create;
  self.update = update;
  self.destroy = destroy;
  self.updateSpy = updateSpy;
  self.hideSpy = hideSpy;
  self.showSpy = showSpy;

  const state = store.getState();
  self.isBInside = isCompareA(state);
  self.create(store);

  return self;
}

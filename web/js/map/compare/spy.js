import { each as lodashEach } from 'lodash';
import { getRenderPixel } from 'ol/render';
import { getFormattedDates } from './util';

let mousePosition = null;
let spy = null;
const topLayers = [];
const bottomLayers = [];
const DEFAULT_RADIUS = 140;
let radius = DEFAULT_RADIUS;
let label = null;

export default class Spy {
  constructor(olMap, state) {
    this.mapCase = document.getElementById('wv-map');
    this.map = olMap;
    const isBInside = state.compare.isCompareA;
    this.isBInside = isBInside;
    this.create(state);
  }

  /**
   * Init spy
   * @param {Boolean} isBInside | B is the spy value -- true|false
   */
  create(state) {
    const isBInside = isCompareA(state);
    spy = this.addSpy(this.map, state);
    this.isBInside = isBInside;
    this.update(state);
  }

  /**
   * Update spy
   * @param {Boolean} isBInside | B is the spy value -- true|false
   */
  update(state) {
    const isBInside = isCompareA(state);
    const { dateA, dateB } = getFormattedDates(state);
    if (dateA !== this.dateA || dateB !== this.dateB || dateA === dateB) {
      const insideText = getDateText(state);
      label.innerText = insideText;
    }
    this.dateA = dateA;
    this.dateB = dateB;
    if (this.isBInside !== isBInside) {
      this.destroy();
      this.create(state);
    } else {
      const mapLayers = this.map.getLayers().getArray();
      applyEventsToBaseLayers(
        mapLayers[0],
        this.map,
        applyReverseLayerListeners,
      );
      applyEventsToBaseLayers(mapLayers[1], this.map, applyLayerListeners);
    }
  }

  /**
   * Remove all nodes and listeners
   */
  destroy() {
    spy.removeEventListener('mousemove', this.updateSpy);
    this.map.un('pointerdrag', this.updateSpy);
    this.mapCase.removeChild(label);
    removeListenersFromLayers(topLayers);
    removeInverseListenersFromLayers(bottomLayers);
  }

  /**
   * On mouse move update spy location
   * @param {Object} e | mousemove event object
   */
  updateSpy(e) {
    mousePosition = e.pixel || this.map.getEventPixel(e);
    radius = DEFAULT_RADIUS;
    const offSetXandY = Math.sqrt((radius * radius) / 2);
    label.style.top = `${mousePosition[1] + offSetXandY - 10}px`;
    label.style.left = `${mousePosition[0] + offSetXandY - 5}px`;
    this.map.render();
  }

  /**
   * Hide spy stuff when mouse is not hovering map
   * @param {Object} e | mouseleave event object
   */
  hideSpy(e) {
    radius = 0;
    label.style.display = 'none';
    this.map.render();
  }

  /**
   * Show spy stuff when mouse is not hovering map
   * @param {Object} e | mouseenter event object
   */
  showSpy() {
    radius = DEFAULT_RADIUS;
    label.style.display = 'block';
    this.map.render();
  }

  /**
   * Add Correct listeners for layer clipping based on whether
   * B or A should be the spy
   * @param {Object} map | OL Map Object
   * @param {Boolean} isBInside | B is the spy value -- true|false
   */
  addSpy(map, state) {
    const insideText = getDateText(state);
    label = document.createElement('span');
    label.className = 'ab-spy-span inside-label';
    label.style.display = 'none';
    label.appendChild(document.createTextNode(insideText));

    this.mapCase.appendChild(label);
    this.mapCase.addEventListener('mousemove', this.updateSpy.bind(this));
    map.on('pointerdrag', this.updateSpy.bind(this));
    this.mapCase.addEventListener('mouseleave', this.hideSpy.bind(this));
    this.mapCase.addEventListener('mouseenter', this.showSpy.bind(this));

    return this.mapCase;
  }
}
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
const restore = function(event) {
  const ctx = event.context;
  ctx.restore();
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
    layer.un('prerender', inverseClip);
    layer.un('postrender', restore);
  });
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
    lodashEach(layers.getArray(), (layer) => {
      applyEventsToBaseLayers(layer, map, callback);
    });
  } else {
    callback(layer);
  }
};

const getDateText = function(state) {
  const isBInside = isCompareA(state);
  let insideText = isBInside ? 'B' : 'A';
  const { dateA, dateB } = getFormattedDates(state);
  const isSameDate = dateA === dateB;
  if (!isSameDate) {
    const dateText = isBInside ? dateB : dateA;
    insideText += `: ${dateText}`;
  }
  return insideText;
};

const isCompareA = (state) => state.compare.isCompareA;

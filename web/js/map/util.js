const ZOOM_DURATION = 250;

/*
 * Setting a zoom action
 *
 * @function self.zoomAction
 * @static
 *
 * @param {Object} map - OpenLayers Map Object
 * @param {number} amount - Direction and
 *  amount to zoom
 * @param {number} duation - length of animation
 * @param {array} center - point to center zoom
 *
 * @returns {void}
 */

// coordinate distance helper function
const toRad = (x) => x * Math.PI / 180;
const sphericalCosinus = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLon = toRad(lon2 - lon1);
  lat1 = toRad(lat1);
  lat2 = toRad(lat2);
  const d = Math.acos(Math.sin(lat1) *
          Math.sin(lat2) + Math.cos(lat1) *
          Math.cos(lat2) * Math.cos(dLon)) * R;
  return d;
};

// improve coordinates offeered to ge tthe most out of all zoom levels (zoom dependent modifiers a good idea)
const coords = [[-90, 40], [70, 0], [-90, 20], [90, 0], [-180, 0], [90, 40], [0, 0], [-180, -40], [-180, 40]];

const getRandomCoords = (array, center) => {
  const len = array.length;
  const randomNum = Math.floor(Math.random() * (len - 0));
  const randomCoords = array[randomNum];
  if (randomCoords.toString() === center.toString()) {
    getRandomCoords(array, center);
  } else if (sphericalCosinus(center[0], center[1], randomCoords[0], randomCoords[1]) < 10000) {
    getRandomCoords(array, center);
  }
  return randomCoords;
};

let stoppedFloatMode = false;
const initFloatMode = (map) => {
  const uiElements = [
    '#wv-measure-button',
    '#timeline',
    '#wv-toolbar'
  ];
  const lowOpacityEls = [
    '#wv-logo',
    '#accordionTogglerButton'
  ];
  const uiScalesImperial = document.querySelectorAll('.wv-map-scale-imperial');
  const uiScalesMetric = document.querySelectorAll('.wv-map-scale-metric');
  const uiMapButtonsZoomOut = document.querySelectorAll('.wv-map-zoom-out');
  const uiMapButtonsZoomIn = document.querySelectorAll('.wv-map-zoom-in');
  [...uiScalesImperial, ...uiScalesMetric, ...uiMapButtonsZoomOut, ...uiMapButtonsZoomIn].forEach((el) => {
    el.style.display = 'none';
  });

  uiElements.forEach((el) => {
    const elDom = document.querySelector(el);
    elDom.style.display = 'none';
  });
  lowOpacityEls.forEach((el) => {
    const elDom = document.querySelector(el);
    elDom.style.transition = 'opacity 1.5s linear 0s';
    elDom.style.opacity = 0.5;
  });

  var stopFloatModeButton = document.createElement('div');
  stopFloatModeButton.setAttribute('class', 'stop-float-mode-button');
  stopFloatModeButton.innerHTML = 'x';

  var wvlogo = document.querySelector('#wv-logo');
  wvlogo.style.borderTopRightRadius = '0px';
  wvlogo.style.width = '250px';

  document.querySelector('#wv-sidebar').appendChild(stopFloatModeButton);
  document.querySelector('.stop-float-mode-button').addEventListener('click', () => stopFloatMode(map));
};

const exitFloatMode = () => {
  const uiElements = [
    '#wv-measure-button',
    '#wv-toolbar'
  ];
  const lowOpacityEls = [
    '#wv-logo',
    '#accordionTogglerButton'
  ];
  const uiScalesImperial = document.querySelectorAll('.wv-map-scale-imperial');
  const uiScalesMetric = document.querySelectorAll('.wv-map-scale-metric');
  const uiMapButtonsZoomOut = document.querySelectorAll('.wv-map-zoom-out');
  const uiMapButtonsZoomIn = document.querySelectorAll('.wv-map-zoom-in');
  [...uiScalesImperial, ...uiScalesMetric, ...uiMapButtonsZoomOut, ...uiMapButtonsZoomIn].forEach((el) => {
    el.style.display = 'block';
  });

  uiElements.forEach((el) => {
    const elDom = document.querySelector(el);
    elDom.style.display = 'block';
  });
  lowOpacityEls.forEach((el) => {
    const elDom = document.querySelector(el);
    elDom.style.transition = 'opacity 1.5s linear 0s';
    elDom.style.opacity = 1;
  });
  const timelineDom = document.querySelector('#timeline');
  timelineDom.style.display = 'flex';

  var stopFloatModeButton = document.querySelector('.stop-float-mode-button');
  stopFloatModeButton.style.display = 'none';
  stopFloatModeButton.parentNode.removeChild(stopFloatModeButton);

  var wvlogo = document.querySelector('#wv-logo');
  wvlogo.style.borderTopRightRadius = '5px';
  wvlogo.style.width = '286px';
};

// ADD - new logo, expanded circular close button that fades 75% after 6 seconds
// calculate duration based on distance for consistency
export const startFloatMode = (map, duration, center, start) => {
  const view = map.getView();
  const zoom = view.getZoom();
  if (!start && stoppedFloatMode) {
    return;
  }
  if (start) {
    initFloatMode(map);
    stoppedFloatMode = false;
  }
  const currentCenter = view.getCenter();
  let distance = sphericalCosinus(center[0], center[1], currentCenter[0], currentCenter[1]);
  if (distance < 10000) {
    center = getRandomCoords(coords, center);
    distance = sphericalCosinus(center[0], center[1], currentCenter[0], currentCenter[1]);
  }
  if (zoom > 3) {
    distance = distance * 0.5;
  }
  const distanceCoef = distance / 26000;
  view.animate({
    duration: duration / distanceCoef,
    center: center
  }, () => startFloatMode(map, duration, getRandomCoords(coords, center)));
};

export const stopFloatMode = (map) => {
  const view = map.getView();
  view.cancelAnimations();
  stoppedFloatMode = true;
  exitFloatMode();
};

export function mapUtilZoomAction(map, amount, duration, center) {
  var zoomDuration = duration || ZOOM_DURATION;
  var centerPoint = center || undefined;
  var view = map.getView();
  var zoom = view.getZoom();
  view.animate({
    zoom: zoom + amount,
    duration: zoomDuration,
    center: centerPoint
  });
}
export function getActiveLayerGroup(map, layerGroupString) {
  var group = null;
  var array = map.getLayers().getArray();
  for (var i = 0, len = array.length; i < len; i++) {
    const layerGroup = array[i];
    if (layerGroup.get('group') === layerGroupString) {
      group = layerGroup;
      break;
    }
  }
  return group;
}

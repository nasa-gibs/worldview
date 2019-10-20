// count used for init tile caching
let count = 0;
// save zoom level dependent durations and 'last' duration if user changes zoom
const holdDuration = {};
// set flag to indicate these changes need to be reset
let floatModeMessageNeedsReset = false;
// flag to handle stopping recursive view animations
let stoppedFloatMode = false;

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

// improve coordinates offeered to get the most out of all zoom levels (zoom dependent modifiers a good idea)
const coords = [[-90, 40], [70, 0], [-90, 20], [90, 0], [-180, 0], [90, 40], [0, 0], [-180, -40], [-180, 40]];

// return random coordinates that will 1) not be the current coordiantes and 2) not be a close distance
const getRandomCoords = (array, center) => {
  const len = array.length;
  const randomNum = Math.floor(Math.random() * (len - 0));
  const randomCoords = array[randomNum];
  if (randomCoords.toString() === center.toString()) {
    return getRandomCoords(array, center);
  } else if (sphericalCosinus(center[0], center[1], randomCoords[0], randomCoords[1]) < 10000) {
    return getRandomCoords(array, center);
  }
  return randomCoords;
};

// handle DOM related hiding elements and creating 'X' close button to exit float mode
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

  uiElements.forEach(el => {
    const elDom = document.querySelector(el);
    elDom.style.display = 'none';
  });
  lowOpacityEls.forEach(el => {
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

// return to normal DOM element styling pre float mode including removing float mode 'X' close button
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

/*
 * Start float mode - used recursively
 *
 * @function startFloatMode
 * @static
 *
 * @param {Object} map - OpenLayers Map Object
 * @param {number} duation - length of animation
 * @param {array} center - point to center zoom
 * @param {boolean} start - flag for init function invoke
 *
 * @returns {void}
 */
export const startFloatMode = (map, duration, center, start) => {
  if (!start && stoppedFloatMode) {
    return;
  }
  const view = map.getView();
  const zoom = view.getZoom();
  // initially, a flurry of quick view movements are made for caching purposes
  if (count < 20) {
    // on the first function invoke, map opacity is faded black and a progress message is displayed
    if (count === 0) {
      // fade out map
      const mapDom = document.querySelector('#wv-map');
      mapDom.style.transition = 'opacity 1.0s linear 0s';
      mapDom.style.opacity = 0;

      // create float mode welcome/progress message
      const floatModeInitMessage = document.createElement('div');
      floatModeInitMessage.setAttribute('class', 'float-mode-init-message-container');
      const icon = document.createElement('i');
      icon.setAttribute('class', 'ui-icon fab fa-fly fa-fw float-mode-init-message-icon');
      floatModeInitMessage.appendChild(icon);

      const header = document.createElement('h1');
      header.setAttribute('class', 'float-mode-init-message-header');
      header.innerHTML = 'Float Mode Initiating';
      floatModeInitMessage.appendChild(header);

      const p = document.createElement('p');
      p.setAttribute('class', 'float-mode-init-message-text');
      p.innerHTML = 'Map tiles for this zoom level are being cached for a smoother experience. Click "X" in the upper left to exit at any time. Enjoy floating around the world...';
      floatModeInitMessage.appendChild(p);

      // add floatmode message modal to dom
      document.querySelector('#wv-content').appendChild(floatModeInitMessage);
      // set flag to indicate these changes need to be reset
      floatModeMessageNeedsReset = true;
    }
    // save for zoom level - if user changes zoom levels a lot, they will face choppy view animation
    holdDuration[zoom] = holdDuration[zoom] || duration;
    holdDuration.last = holdDuration.last || duration;
    // init FAST animation duration
    duration = 30;
  } else {
    // return map opacity to normal and remove floatmode message modal
    if (floatModeMessageNeedsReset) {
      const mapDom = document.querySelector('#wv-map');
      mapDom.style.opacity = 1;

      const floatModeInitMessage = document.querySelector('.float-mode-init-message-container');
      floatModeInitMessage.style.display = 'none';
      floatModeInitMessage.parentNode.removeChild(floatModeInitMessage);
      floatModeMessageNeedsReset = false;
    }
    // revert duration from FAST to saved for this zoom or 'last'
    duration = holdDuration[zoom] || holdDuration.last;
  }
  // first function invoke
  if (start) {
    initFloatMode(map);
    stoppedFloatMode = false;
  }
  // get current center and check distance to determine if another set of coordinates is needed
  const currentCenter = view.getCenter();
  let distance = sphericalCosinus(center[0], center[1], currentCenter[0], currentCenter[1]);
  if (distance < 10000) {
    center = getRandomCoords(coords, currentCenter);
    distance = sphericalCosinus(center[0], center[1], currentCenter[0], currentCenter[1]);
  }
  // TODO: WIP to address zoom specific speeds for the best experience
  if (zoom > 3) {
    distance = distance * 0.5;
  }
  const distanceCoef = distance / 26000;
  count++;
  // animate the map view and recursively call the next coordinate movement instance as a callback
  // note init 1000ms timeout is for map the fade out
  setTimeout(() => {
    view.animate({
      duration: duration / distanceCoef,
      center: center
    }, () => startFloatMode(map, duration, getRandomCoords(coords, center)));
  }, count === 1 ? 1000 : 10);
};

/*
 * Stop float mode
 *
 * @function stopFloatMode
 * @static
 *
 * @param {Object} map - OpenLayers Map Object
 *
 * @returns {void}
 */
export const stopFloatMode = (map) => {
  const view = map.getView();
  view.cancelAnimations();
  // return DOM to normal
  stoppedFloatMode = true;
  exitFloatMode();
  const mapDom = document.querySelector('#wv-map');
  mapDom.style.opacity = 1;
  count = 0;
};

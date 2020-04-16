/*
 * update dates and layer-types here
*/
/* global ol, _ */
console.clear();
console.log(ol);
const datelineArray = [];
const dateLabel = document.getElementById('date-label');
const centerDate = '2019-11-01';
var imageryLayerId = 'VIIRS_SNPP_CorrectedReflectance_TrueColor';
var nightLayerId = 'AIRS_L3_Surface_Skin_Temperature_Daily_Night';
var orbitTrackLayerId = 'OrbitTracks_Suomi_NPP_Ascending';
let currentCenterX = 0;
let isNightMode = false;

const util = {
  getLineStyle: function(color, width, lineDash) {
    return new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: color,
        width: width,
        lineDash: lineDash || undefined
      })
    });
  },
  getLine: function(extent, coordinateArray, width, color, opacity, lineDash) {
    return new ol.layer.Vector({
      source: new ol.source.Vector({
        features: [new ol.Feature({
          geometry: new ol.geom.LineString(coordinateArray)
        })]
      }),
      zIndex: Infinity,
      opacity: opacity || 1,
      wrapX: true,
      style: [this.getLineStyle('black', width, lineDash), this.getLineStyle(color, width / 2, lineDash)]
    });
  },
  toISOStringDate: function(date) {
    return date.toISOString()
      .split('T')[0];
  },
  drawOverlay: function(coordinate, el) {
    var overlay = new ol.Overlay({
      element: el,
      stopEvent: false
    });
    overlay.setPosition(coordinate);
    return overlay;
  },
  dateAdd: function(date, interval, amount) {
    var month, maxDay, year;
    var newDate = new Date(date);
    switch (interval) {
      case 'minute':
        newDate.setUTCMinutes(newDate.getUTCMinutes() + amount);
        break;
      case 'hour':
        newDate.setUTCHours(newDate.getUTCHours() + amount);
        break;
      case 'day':
        newDate.setUTCDate(newDate.getUTCDate() + amount);
        break;
      case 'month':
        year = newDate.getUTCFullYear();
        month = newDate.getUTCMonth();
        maxDay = new Date(year, month + amount + 1, 0)
          .getUTCDate();
        if (maxDay <= date.getUTCDate()) {
          newDate.setUTCDate(maxDay);
        }
        newDate.setUTCMonth(month + amount);
        break;
      case 'year':
        newDate.setUTCFullYear(newDate.getUTCFullYear() + amount);
        break;
      default:
        throw new Error('[dateAdd] Invalid interval: ' + interval);
    }
    return newDate;
  }
};

var createMap = function(layers) {
  var scaleMetric = new ol.control.ScaleLine({
    className: 'wv-map-scale-metric',
    units: 'metric'
  });
  var scaleImperial = new ol.control.ScaleLine({
    className: 'wv-map-scale-imperial',
    units: 'imperial'
  });
  var map = new ol.Map({
    view: new ol.View({
      projection: ol.proj.get('EPSG:4326'),
      center: [0, 0],
      zoom: 2,
      maxZoom: 12
    }),
    layers: layers,
    target: 'map',
    renderer: ['canvas'],
    logo: false,
    controls: [
      scaleMetric,
      scaleImperial
    ],
    interactions: [
      new ol.interaction.DoubleClickZoom(),
      new ol.interaction.DragPan({
        kinetic: new ol.Kinetic(-0.005, 0.05, 100)
      }),
      new ol.interaction.PinchZoom(),
      new ol.interaction.MouseWheelZoom(),
      new ol.interaction.DragZoom()
    ],
    loadTilesWhileAnimating: true
  });
  map.wv = {
    small: false,
    scaleMetric: scaleMetric,
    scaleImperial: scaleImperial
  };
  return map;
};
const createLayerWMS = function(date, extent, layerId) {
  const res = [
    0.28125,
    0.140625,
    0.0703125,
    0.03515625,
    0.017578125,
    0.0087890625,
    0.00439453125,
    0.002197265625,
    0.0010986328125,
    0.00054931640625,
    0.00027465820313
  ];

  const parameters = {
    LAYERS: layerId,
    VERSION: '1.1.1'
  };
  var sourceOptions = {
    url: 'https://gibs-{a-c}.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?TIME=' + date,
    cacheSize: 4096,
    style: 'default',
    crossOrigin: 'anonymous',
    transition: 0,
    wrapX: true,
    params: parameters,
    tileGrid: new ol.tilegrid.TileGrid({
      origin: [extent[0] + 180, 90],
      resolutions: res
    })
  };
  var layer = new ol.layer.Tile({
    preload: Infinity,
    extent: [extent[0] + 180, extent[1], extent[2] + 180, extent[3]],
    source: new ol.source.TileWMS(sourceOptions)
  });
  layer.date = date;
  layer.type = 'orbit-track';
  return layer;
};
var createLayerWMTS = function(date, extent, layerId, isNightLayer) {
  const url = isNightLayer ? '//gibs.earthdata.nasa.gov/wmts/epsg4326/best/wmts.cgi?TIME=' : '//gibs-{a-c}.earthdata.nasa.gov/wmts/epsg4326/best/wmts.cgi?TIME=';
  var sourceOptions = {
    url: url + date,
    layer: layerId,
    format: isNightLayer ? 'image/png' : 'image/jpeg',
    matrixSet: isNightLayer ? '2km' : '250m',
    projection: 'EPSG:4326',
    tileGrid: new ol.tilegrid.WMTS({
      origin: [extent[0] + 180, 90],
      resolutions: [0.140625, 0.0703125, 0.03515625, 0.017578125, 0.0087890625, 0.00439453125, 0.002197265625],
      matrixIds: [2, 3, 4, 5, 6, 7, 8],
      tileSize: 512
    }),
    wrapX: false
  };
  var layer = new ol.layer.Tile({
    extent: [extent[0] + 180, extent[1], extent[2] + 180, extent[3]],
    crossOrigin: 'anonymous',
    opacity: !isNightLayer ? 1 : isNightMode ? 1 : 0,
    source: new ol.source.WMTS(sourceOptions)
  });
  layer.date = date;
  return layer;
};

var dateLayerOT = createLayerWMS(centerDate, [-360, -90, 0, 90], orbitTrackLayerId);

var dateLayer = createLayerWMTS(centerDate, [-360, -90, 0, 90], imageryLayerId);
const nightTimeLayerOne = createLayerWMTS(centerDate, [-360, -90, 0, 90], nightLayerId, true);
const fullVectorLine = util.getLine(null, [[-180, -90], [-180, 90]], 4, 'white', 1, [2, 8]);
const topVectorLine = util.getLine(null, [[-180, 100], [-180, 90]], 4, 'white', 0, [2, 5]);
const fullVectorLineNight = util.getLine(null, [[0, -90], [0, 90]], 2, 'white', 0, [2, 5]);
const topVectorLineNight = util.getLine(null, [[0, 100], [0, 90]], 2, 'white', 0.5, [2, 5]);
var map = createMap([dateLayer, nightTimeLayerOne, dateLayerOT, fullVectorLineNight, fullVectorLine]);

const orbitsArray = [dateLayerOT];
const nightTimeLayers = [nightTimeLayerOne];
const dayImageryArray = [dateLayer];
const textArray = [];
const layerUpdate = function(longitude, startDate, layerArray) {
  const numberOfLayersOff = longitude < 0 ? Math.floor(Math.abs(Math.abs(longitude) / 360)) : Math.ceil(Math.abs(Math.abs(longitude) / 360));

  const amount = longitude < 0 ? -numberOfLayersOff : numberOfLayersOff;
  const newCenterDate = util.toISOStringDate(util.dateAdd(startDate, 'day', -amount));
  const x = -360 + (360 * amount);
  const newCenterOriginX = x + 180;
  const newCenterExtent = [newCenterOriginX - 180, -90, newCenterOriginX + 180, 90];
  const newArray = [{ extent: newCenterExtent, date: newCenterDate }];
  currentCenterX = newCenterOriginX;

  for (let i = 1; i < 4; i++) {
    const date = util.toISOStringDate(util.dateAdd(newCenterDate, 'day', i));
    const xOrigin = x - 360 * i;
    const extentRight = [xOrigin, -90, xOrigin + 360, 90];
    const dateRight = util.toISOStringDate(util.dateAdd(newCenterDate, 'day', i * (-1)));
    const xOriginRight = 360 * i + x;
    const extent = [xOriginRight, -90, xOriginRight + 360, 90];
    newArray.push({ extent, date: dateRight });
    newArray.push({ extent: extentRight, date });
  }
  newArray.forEach(newLayerObj => {
    const isNotOnMap = !_.find(layerArray, { date: newLayerObj.date });
    if (isNotOnMap) {
      const imageryLayer = createLayerWMTS(newLayerObj.date, newLayerObj.extent, imageryLayerId);
      const nightTimeLayer = createLayerWMTS(newLayerObj.date, newLayerObj.extent, nightLayerId, true);
      const orbitTrackLayer = createLayerWMS(newLayerObj.date, newLayerObj.extent, orbitTrackLayerId);
      map.addLayer(imageryLayer);
      map.addLayer(nightTimeLayer);
      orbitsArray.push(orbitTrackLayer);
      nightTimeLayers.push(nightTimeLayer);
      dayImageryArray.push(imageryLayer);
    }
    if (!datelineArray.includes(newLayerObj.date)) {
      datelineArray.push(newLayerObj.date);
      const layerExtent = [newLayerObj.extent[0] + 180, newLayerObj.extent[1], newLayerObj.extent[2] + 180, newLayerObj.extent[3]];
      const leftLineCase = document.createElement('div');
      const rightLineCase = document.createElement('div');
      const leftTextCase = document.createElement('div');
      const rightTextCase = document.createElement('div');
      const sampleNightLineCase = document.createElement('div');
      const sampleNightTextCase = document.createElement('div');
      sampleNightLineCase.className = 'night night-line-overlay';
      leftLineCase.className = 'left-line-overlay';
      rightLineCase.className = 'right-line-overlay';
      leftTextCase.className = 'left-text-overlay';
      rightTextCase.className = 'right-text-overlay';
      sampleNightTextCase.className = 'night-text-overlayer';
      leftTextCase.appendChild(document.createTextNode(newLayerObj.date));
      rightTextCase.appendChild(document.createTextNode(newLayerObj.date));
      sampleNightTextCase.appendChild(document.createTextNode('Night Date line'));
      // map.addOverlay(util.drawOverlay([layerExtent[0], 100], leftLineCase));
      // map.addOverlay(util.drawOverlay([layerExtent[2], 100], rightLineCase));
      const leftOverlay = util.drawOverlay([layerExtent[0], 0], leftTextCase);
      const rightOverlay = util.drawOverlay([layerExtent[2], 0], rightTextCase);
      // map.addOverlay(leftOverlay);
      // map.addOverlay(rightOverlay);
      textArray.push(leftOverlay);
      textArray.push(rightOverlay);

      // map.addOverlay(util.drawOverlay([layerExtent[2] - 100, 100], sampleNightLineCase));
      // map.addOverlay(util.drawOverlay([layerExtent[2] - 100, 100], sampleNightTextCase));
    }
  });
  dateLabel.textContent = newCenterDate;
};
layerUpdate(0, centerDate, [dateLayer, dateLayerOT]);
let orbitVisible = false;
let dataLineVisible = false;

setTimeout(function() {
  orbitsArray.forEach(element => {
    map.removeLayer(element);
  });
}, 1000);
map.on('pointerdrag', function() {
  const view = map.getView();
  if (!orbitVisible && view.getZoom() > 3) {
    orbitsArray.forEach(element => {
      map.addLayer(element);
    });
    orbitVisible = true;
  }
  if (!dataLineVisible) {
    showLines();
    dataLineVisible = true;
  }
  const centerX = view.getCenter()[0];
  const psuedoCenterPoint = isNightMode ? centerX : centerX - 180;
  if (Math.abs(psuedoCenterPoint - currentCenterX) > 180) {
    layerUpdate(psuedoCenterPoint, centerDate, map.getLayers().getArray());
  }
});
map.getView().on('propertychange', function(e) {
  let centerX, psuedoCenterPoint;
  const view = map.getView();
  switch (e.key) {
    case 'resolution':
      if (!orbitVisible && view.getZoom() > 3) {
        orbitsArray.forEach(element => {
          map.addLayer(element);
        });
        orbitVisible = true;
      }
      if (!dataLineVisible) {
        showLines();
        dataLineVisible = true;
      }
      centerX = view.getCenter()[0];
      psuedoCenterPoint = isNightMode ? centerX : centerX - 180;
      if (Math.abs(psuedoCenterPoint - currentCenterX) > 180) {
        layerUpdate(psuedoCenterPoint, centerDate, map.getLayers().getArray());
      }
      break;
  }
});
map.on('moveend', function(e) {
  if (orbitVisible) {
    orbitsArray.forEach(element => {
      map.removeLayer(element);
    });
    orbitVisible = false;
  }
  if (dataLineVisible) {
    hideLines();
    dataLineVisible = false;
  }
});
const lessThan = document.getElementById('less');
const greaterThan = document.getElementById('greater');
const nightModeCheckbox = document.getElementById('night-checkbox');
const nightLayerCheckbox = document.getElementById('night-imagery-checkbox');
const dayLayerCheckbox = document.getElementById('day-imagery-checkbox');
lessThan.onclick = function() {
  const center = map.getView().getCenter();
  const newCenterX = center[0] + 360;
  map.getView().animate({ center: [newCenterX, center[1]], duration: 2000 });
  setTimeout(function() {
    layerUpdate(newCenterX, centerDate, map.getLayers().getArray());
  }, 2000);
};
greaterThan.onclick = function() {
  const center = map.getView().getCenter();
  const newCenterX = center[0] - 360;
  map.getView().animate({ center: [newCenterX, center[1]], duration: 2000 });
  setTimeout(function() {
    layerUpdate(newCenterX, centerDate, map.getLayers().getArray());
  }, 2000);
};
dayLayerCheckbox.onchange = function() {
  if (dayLayerCheckbox.checked === true) {
    dayImageryArray.forEach((layer) => {
      layer.setOpacity(1);
    });
  } else {
    dayImageryArray.forEach((layer) => {
      layer.setOpacity(0);
    });
  }
};
nightLayerCheckbox.onchange = function() {
  if (nightLayerCheckbox.checked === true) {
    nightTimeLayers.forEach((layer) => {
      layer.setOpacity(1);
    });
    isNightMode = true;
  } else {
    nightTimeLayers.forEach((layer) => {
      layer.setOpacity(0);
    });
    isNightMode = false;
  }
};
nightModeCheckbox.onchange = function() {
  if (nightModeCheckbox.checked === true) {
    fullVectorLineNight.setStyle([util.getLineStyle('black', 4, [2, 5]), util.getLineStyle('white', 2, [2, 5])]);
    topVectorLineNight.setStyle([util.getLineStyle('black', 4, [2, 5]), util.getLineStyle('white', 2, [2, 5])]);
    fullVectorLine.setStyle([util.getLineStyle('black', 2, [2, 5]), util.getLineStyle('white', 1, [2, 5])]);
    topVectorLine.setStyle([util.getLineStyle('black', 2, [2, 5]), util.getLineStyle('white', 1, [2, 5])]);
    fullVectorLineNight.setOpacity(1);
    topVectorLineNight.setOpacity(1);
    fullVectorLine.setOpacity(0.5);
    topVectorLine.setOpacity(0.5);
    isNightMode = true;
  } else {
    fullVectorLineNight.setStyle([util.getLineStyle('black', 2, [2, 5]), util.getLineStyle('white', 1, [2, 5])]);
    topVectorLineNight.setStyle([util.getLineStyle('black', 2, [2, 5]), util.getLineStyle('white', 1, [2, 5])]);
    fullVectorLine.setStyle([util.getLineStyle('black', 4, [2, 5]), util.getLineStyle('white', 2, [2, 5])]);
    topVectorLine.setStyle([util.getLineStyle('black', 4, [2, 5]), util.getLineStyle('white', 2, [2, 5])]);
    fullVectorLineNight.setOpacity(0.5);
    topVectorLineNight.setOpacity(0.5);
    fullVectorLine.setOpacity(1);
    topVectorLine.setOpacity(1);
    isNightMode = false;
  }
  setTimeout(function() {
    hideLines();
  }, 2000);
};
const showLines = function() {
  if (!isNightMode) {
    // fullVectorLine.setOpacity(1);
    fullVectorLineNight.setOpacity(0.5);
    textArray.forEach(element => {
      map.addOverlay(element);
    });
  } else {
    // fullVectorLine.setOpacity(0.5);
    fullVectorLineNight.setOpacity(1);
    // console.log(textArray);
    textArray.forEach(element => {
      console.log(element);
      map.addOverlay(element);
    });
  }
};
const hideLines = function() {
  // fullVectorLine.setOpacity(0);
 // fullVectorLineNight.setOpacity(0);
  // textArray.forEach(text => {
  //   map.removeOverlay(text);
  // });
};

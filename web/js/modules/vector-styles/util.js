/* eslint-disable no-restricted-syntax */
import {
  assign as lodashAssign,
  find as lodashFind,
  get as lodashGet,
  includes as lodashIncludes,
} from 'lodash';
import {
  Stroke, Style, Fill, Circle,
} from 'ol/style';
import { getVectorLayers, setStyleFunction } from './selectors';
import { isFromActiveCompareRegion } from '../compare/util';

export function getVectorStyleAttributeArray(layer) {
  let isCustomActive = false;
  let isMinActive = false;
  let isMaxActive = false;
  if (layer.custom) { isCustomActive = true; }
  if (layer.min) { isMinActive = true; }
  if (layer.max) { isMaxActive = true; }
  const styleObj = lodashAssign({}, { key: 'custom', value: layer.custom, isActive: isCustomActive });
  const minObj = lodashAssign({}, { key: 'min', value: layer.min, isActive: isMinActive });
  const maxObj = lodashAssign({}, { key: 'max', value: layer.max, isActive: isMaxActive });
  const attrArray = [];

  [styleObj, minObj, maxObj].forEach((obj) => {
    if (obj.isActive) {
      attrArray.push({
        id: obj.key === 'custom' ? 'style' : obj.key,
        value: obj.value,
      });
    }
  });
  return attrArray;
}

export function getMinValue(v) {
  return v.length ? v[0] : v;
}

export function getMaxValue(v) {
  return v.length ? v[v.length - 1] : v;
}

export function isConditional(item) {
  return Array.isArray(item) && item[0] === 'case';
}

export function adjustCircleRadius(style) {
  const styleImage = style.getImage();
  const fill = styleImage.getFill();
  const radius = styleImage.getRadius() * 0.6;
  return new Style({
    image: new Circle({
      radius,
      fill,
    }),
  });
}

export function selectedCircleStyle(style, size = 2) {
  const styleImage = style.getImage();
  const fill = styleImage.getFill();
  const radius = styleImage.getRadius() * size;
  return fill ? new Style({
    image: new Circle({
      radius,
      stroke: new Stroke({
        color: 'white',
        width: 2,
      }),
      fill: new Fill({
        color: fill.getColor().replace(/[^,]+(?=\))/, '0.5'),
      }),
    }),
  }) : style;
}

export function selectedPolygonStyle(style) {
  const fill = style.getFill();
  const color = fill.getColor().replace(/[^,]+(?=\))/, '0.5');
  const stroke = style.getStroke();
  stroke.setColor('white');
  stroke.setWidth(0.5);
  fill.setColor(color);
  return style;
}

export function offsetLineStringStyle(feature, styleArray) {
  return styleArray.map((style) => {
    const text = style.getText();
    if (text) {
      text.setOffsetX(25);
    }
    return style;
  });
}

export function selectedStyleFunction(feature, styleArray, size) {
  if (styleArray.length !== 1) return styleArray;
  return styleArray.map((style) => {
    const type = feature.getType();
    switch (type) {
      case 'Point':
        return selectedCircleStyle(style, size);
      case 'Polygon':
        return selectedPolygonStyle(style);
      default:
        return style;
    }
  });
}

export function getConditionalColors(color) {
  const array = Array.from(color);
  array.shift();
  const colors = [];
  const labels = [];
  let temp = [];
  const chunk = 2;
  // https://stackoverflow.com/a/8495740/4589331
  for (let i = 0, j = array.length; i < j; i += chunk) {
    temp = array.slice(i, i + chunk);
    if (temp.length === 2) {
      if (temp[0].length === 3
        && typeof temp[0][2] === 'string'
        && typeof temp[1] === 'string'
      ) {
        labels.push(temp[0][2]);
        colors.push(temp[1]);
      } else {
        console.warn('Irregular conditional');
      }
    } else if (temp.length === 1 && typeof temp[0] === 'string') {
      labels.push('Default');
      colors.push(temp[0]);
    } else {
      console.warn('Irregular conditional');
    }
  }
  return { colors, labels };
}

export function getPaletteForStyle(layer, layerstyleLayerObject) {
  const styleLayerObject = layerstyleLayerObject.layers[0];
  const color = styleLayerObject.paint['line-color'] || styleLayerObject.paint['circle-color'] || styleLayerObject.paint['fill-color'];
  const isConditionalStyling = styleLayerObject.paint ? isConditional(color) : false;
  let colors = [];
  let labels = [];
  if (isConditionalStyling) {
    const expressionObj = getConditionalColors(color);
    colors = expressionObj.colors;
    labels = expressionObj.labels;
  } else {
    colors.push(color);
    labels.push(layer.title);
  }
  return [{
    colors,
    type: 'classification',
    tooltips: labels,
    title: layer.title,
    id: `${layer.id}0_legend`,
  }];
}

export function isFeatureInRenderableArea(lon, wrap, acceptableExtent) {
  if (acceptableExtent) {
    return lon > acceptableExtent[0] && lon < acceptableExtent[2];
  }
  return wrap === -1 ? lon < 250 && lon > 180 : wrap === 1 ? lon > -250 && lon < -180 : false;
}

/**
 * Use modal/screen dimensions and click pixel location
 * to return X & Y offsets for modal
 *
 * @param {Object} dimensionProps
 *
 * @returns {Object}
 */
function getModalOffset(dimensionProps) {
  const {
    x, y, screenHeight, screenWidth, isMobile,
  } = dimensionProps;
  const isOnLeft = screenWidth - x >= screenWidth / 2;
  const modalWidth = isMobile ? 250 : 445;
  const modalHeight = 300;
  let offsetLeft = isOnLeft ? x + 20 : x - modalWidth - 20;
  let offsetTop = y - (modalHeight / 2);
  if (offsetLeft < 0) {
    offsetLeft = 20;
  } else if (offsetLeft + modalWidth > screenWidth) {
    offsetLeft = screenWidth - modalWidth - 20;
  }
  if (offsetTop < 0) {
    offsetTop = 20;
  } else if (offsetTop + modalHeight > screenHeight) {
    offsetTop = y - modalHeight;
  }
  return { offsetLeft, offsetTop };
}

/**
 * Get Organized data for each feature at pixel
 * @param {Object} mapProps
 * @param {Object} config
 * @param {Object} compareState
 * @param {Boolean} isMobile
 */
function getModalContentsAtPixel(mapProps, config, compareState, isMobile) {
  const metaArray = [];
  const selected = {};
  let exceededLengthLimit = false;
  let isCoordinatesMarker = false;
  const { pixels, map, swipeOffset } = mapProps;
  let modalShouldFollowClicks = false;
  const featureOptions = isMobile ? { hitTolerance: 5 } : {};
  // max displayed results of features at pixel
  const desktopLimit = 12;
  const mobileLimit = 5;
  const maxLimitOfResults = isMobile ? mobileLimit : desktopLimit;
  map.forEachFeatureAtPixel(pixels, (feature, layer) => {
    const lengthCheck = (arr) => arr.length >= maxLimitOfResults;
    const featureId = feature.getId();
    if (featureId === 'coordinates-map-marker') {
      isCoordinatesMarker = true;
      return;
    }
    if (lengthCheck(metaArray)) {
      exceededLengthLimit = true;
      return true;
    }
    const def = lodashGet(layer, 'wv.def');
    if (!def) {
      return;
    }

    const type = feature.getType();
    if (lodashIncludes(def.clickDisabledFeatures, type)
      || !isFromActiveCompareRegion(pixels, layer.wv.group, compareState, swipeOffset)) {
      return;
    }
    if (def.vectorData && def.vectorData.id && def.title) {
      const layerId = def.id;
      if (!selected[layerId]) selected[layerId] = [];
      const features = feature.getProperties();
      const vectorDataId = def.vectorData.id;
      const data = config.vectorData[vectorDataId];
      const properties = data.mvt_properties;
      const uniqueIdentifierKey = lodashFind(properties, { Function: 'Identify' }).Identifier;
      const titleObj = lodashFind(properties, 'IsLabel');
      const titleKey = titleObj.Identifier;

      const uniqueIdentifier = features[uniqueIdentifierKey];
      const title = titleKey ? features[titleKey] : 'Unknown title';
      if (selected[layerId].includes(uniqueIdentifier)) return;
      if (def.modalShouldFollowClicks) modalShouldFollowClicks = true;
      const obj = {
        legend: properties,
        features,
        id: layerId,
        title: def.title || layerId,
        subTitle: def.subtitle,
        featureTitle: title,
        disableUnitConversion: !!def.disableUnitConversion,

      };
      metaArray.push(obj);
      selected[layerId].push(uniqueIdentifier);
    }
  }, featureOptions);
  return {
    selected, metaArray, exceededLengthLimit, isCoordinatesMarker, modalShouldFollowClicks,
  };
}

/**
 * Get organized vector modal contents for clicked
 * map location
 *
 * @param {Array} pixels
 * @param {Object} map
 * @param {Object} state
 * @param {Number} swipeOffset
 *
 * @returns {Object}
 */
export function onMapClickGetVectorFeatures(pixels, map, state, swipeOffset) {
  const { config, compare } = state;
  const { screenWidth, screenHeight, isMobileDevice } = state.screenSize;
  const isMobile = isMobileDevice;
  const x = pixels[0];
  const y = pixels[1];
  const modalOffsetProps = {
    x, y, isMobile, screenHeight, screenWidth,
  };
  const mapProps = { pixels, map, swipeOffset };
  const { offsetLeft, offsetTop } = getModalOffset(modalOffsetProps);
  const {
    selected, metaArray, exceededLengthLimit, isCoordinatesMarker, modalShouldFollowClicks,
  } = getModalContentsAtPixel(mapProps, config, compare, isMobile);
  return {
    selected, // Object containing unique identifiers of selected features
    metaArray, // Organized metadata for modal
    offsetLeft, // Modal default offsetLeft
    offsetTop, // Modal default offsetTop
    isCoordinatesMarker,
    modalShouldFollowClicks,
    exceededLengthLimit,
  };
}

export function updateVectorSelection(selectionObj, lastSelection, layers, type, state) {
  const { config: { vectorStyles } } = state;
  const vectorLayers = getVectorLayers(state);

  for (const [key] of Object.entries(selectionObj)) {
    const def = lodashFind(layers, { id: key });
    if (!def) return;
    const olLayer = vectorLayers.find((layer) => layer.wv.id === key);
    setStyleFunction(def, def.vectorStyle.id, vectorStyles, olLayer, state);
    if (lastSelection[key]) delete lastSelection[key];
  }
  for (const [key] of Object.entries(lastSelection)) {
    const def = lodashFind(layers, { id: key });
    if (!def) return;
    const olLayer = vectorLayers.find((layer) => layer.wv.id === key);
    setStyleFunction(def, def.vectorStyle.id, vectorStyles, olLayer, state);
  }
}

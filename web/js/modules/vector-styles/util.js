import {
  assign as lodashAssign,
  find as lodashFind,
  get as lodashGet,
} from 'lodash';
import { Stroke, Style, Fill, Circle } from 'ol/style';
import { setStyleFunction } from './selectors';

export function getVectorStyleAttributeArray(layer) {
  var isCustomActive = false;
  var isMinActive = false;
  var isMaxActive = false;
  if (layer.custom) { isCustomActive = true; }
  if (layer.min) { isMinActive = true; }
  if (layer.max) { isMaxActive = true; }
  const styleObj = lodashAssign({}, { key: 'custom', value: layer.custom, isActive: isCustomActive });
  const minObj = lodashAssign({}, { key: 'min', value: layer.min, isActive: isMinActive });
  const maxObj = lodashAssign({}, { key: 'max', value: layer.max, isActive: isMaxActive });
  const attrArray = [];

  [styleObj, minObj, maxObj].forEach(obj => {
    if (obj.isActive) {
      attrArray.push({
        id: obj.key === 'custom' ? 'style' : obj.key,
        value: obj.value
      });
    } else {
      if (obj.isActive) {
        attrArray.push({
          id: obj.key === 'custom' ? 'style' : obj.key,
          value: ''
        });
      }
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

export function selectedCircleStyle(style) {
  const styleImage = style.getImage();
  const fill = styleImage.getFill();
  const radius = styleImage.getRadius() * 2;
  return new Style({
    image: new Circle({
      radius: radius,
      stroke: new Stroke({
        color: 'white',
        width: 2
      }),
      fill: new Fill({
        color: fill.getColor().replace(/[^,]+(?=\))/, '0.5')
      })
    })
  });
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
export function selectedStyleFunction(feature, styleArray) {
  if (styleArray.length !== 1) return styleArray;
  return styleArray.map((style) => {
    const type = feature.getType();
    switch (type) {
      case 'Point':
        return selectedCircleStyle(style);
      case 'Polygon':
        return selectedPolygonStyle(style);
      default:
        return style;
    }
  });
}
export function onMapClickGetVectorFeatures(pixels, map, state) {
  const metaArray = [];
  const selected = {};
  const config = state.config;
  map.forEachFeatureAtPixel(pixels, function (feature, layer) {
    const def = lodashGet(layer, 'wv.def');
    if (!def) return;
    if (def.vectorData && def.vectorData.id && def.title) {
      const layerId = def.id;
      if (!selected[layerId]) selected[layerId] = [];
      const features = feature.getProperties();
      const vectorDataId = def.vectorData.id;
      const data = config.vectorData[vectorDataId];
      const properties = data.mvt_properties;
      const uniqueIdentifierKey = lodashFind(properties, { Function: 'Identify' }).Identifier;
      const titleObj = lodashFind(properties, { IsLabel: 'True' });
      const titleKey = titleObj.Identifier

      const uniqueIdentifier = features[uniqueIdentifierKey];
      const title = titleKey ? features[titleKey] : 'Unknown title';
      if (selected[layerId].includes(uniqueIdentifier)) return;
      const obj = {
        legend: properties,
        features: features,
        id: vectorDataId,
        title: def.title || def.id,
        featureTitle: title
      };
      metaArray.push(obj);
      selected[layerId].push(uniqueIdentifier);
    }
  });
  return { selected, metaArray };
}
export function updateVectorSelection(selectionObj, lastSelection, layers, type, state) {
  const vectorStyles = state.config.vectorStyles;
  for (const [key, featureIdArray] of Object.entries(selectionObj)) {
    const def = lodashFind(layers, { id: key });
    setStyleFunction(def, def.vectorStyle.id, vectorStyles, null, state);
    if (lastSelection[key]) delete lastSelection[key];
  }
  for (const [key] of Object.entries(lastSelection)) {
    const def = lodashFind(layers, { id: key });
    setStyleFunction(
      def,
      def.vectorStyle.id,
      vectorStyles,
      null,
      state
    );
  }
}

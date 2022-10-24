import {
  get as lodashGet,
  isUndefined as lodashIsUndefined,
  each as lodashEach,
  find as lodashFind,
} from 'lodash';

import update from 'immutability-helper';
import { containsCoordinate } from 'ol/extent';
import { stylefunction } from 'ol-mapbox-style';
import {
  getMinValue, getMaxValue, selectedStyleFunction,
} from './util';
import {
  getActiveLayers,
} from '../layers/selectors';

/**
 * Get OpenLayers layers from state that were created from WV vector
 * layer definiteions. NOTE: This currently also will include the associate WMS
 * breakpoint layers as well.
 *
 * @param {*} state
 * @returns
 */
export function getVectorLayers(state) {
  console.log('getVectorLayers');
  const { map: { ui: { selected } } } = state;
  const layerGroups = selected.getLayers().getArray();
  return layerGroups.reduce((prev, layerGroup) => {
    const isVector = lodashGet(layerGroup, 'wv.def.type') === 'vector';
    if (!isVector) return prev;
    const layers = layerGroup.getLayersArray ? layerGroup.getLayersArray() : layerGroup;
    return [...prev, ...layers];
  }, []);
}

/**
 * Gets a single colormap (entries / legend combo)
 *
 * @param str {string} The ID of the layer
 * @param number {Number} The index of the colormap for this layer, default 0
 * object.
 * @return {object} object including the entries and legend
 */
export function getVectorStyle(layerId, index, groupStr, state) {
  console.log('getVectorStyle');
  groupStr = groupStr || state.compare.activeString;
  index = lodashIsUndefined(index) ? 0 : index;
  const renderedVectorStyle = lodashGet(
    state,
    `vectorStyles.${layerId}.layers.${index}`,
  );
  if (renderedVectorStyle) {
    return renderedVectorStyle;
  }
  return getAllVectorStyles(layerId, index, state);
}

export function getAllVectorStyles(layerId, index, state) {
  console.log('Getting All Vector Styles!');
  const { config, vectorStyles } = state;
  const name = lodashGet(config, `layers.${layerId}.vectorStyle.id`);
  console.log(`namne: ${name}`);
  let vectorStyle = vectorStyles.custom[name];
  if (!vectorStyle) {
    throw new Error(`${name} Is not a rendered vectorStyle`);
  }
  if (!lodashIsUndefined(index)) {
    if (vectorStyle.layers) {
      vectorStyle = vectorStyle.layers[index];
    }
  }
  return vectorStyle;
}

export function findIndex(layerId, type, value, index, groupStr, state) {
  console.log('findIndex');
  index = index || 0;
  const { values } = getVectorStyle(layerId, index, groupStr, state).entries;
  let result;
  lodashEach(values, (check, index) => {
    const min = getMinValue(check);
    const max = getMaxValue(check);
    if (type === 'min' && value === min) {
      result = index;
      return false;
    }
    if (type === 'max' && value === max) {
      result = index;
      return false;
    }
  });
  return result;
}

export function setRange(layerId, props, index, palettes, state) {
  console.log('setRange');
  // Placeholder filter range function
  return {
    layerId, props, index, palettes, state,
  };
}

// Review calls to this function & determine if calls are necessary for ASCAT
export function setStyleFunction(def, vectorStyleId, vectorStyles, layer, state) {
  console.log('setStyleFunction');
  const map = lodashGet(state, 'map.ui.selected');
  if (!map) return;
  const { proj } = state;
  const { selected } = state.vectorStyles;
  const { resolutions } = proj.selected;
  const layerId = def.id;
  const styleId = lodashGet(def, `vectorStyle.${proj.id}.id`) || vectorStyleId || lodashGet(def, 'vectorStyle.id') || layerId;
  const glStyle = vectorStyles[styleId];

  // Forcing a valid glStyle if one cannot be found.
  if (glStyle === undefined) {
    return;
    // console.log('Forcing glStyle for ascat...');
    // glStyle = vectorStyles.FIRMS_VIIRS_Thermal_Anomalies;
    // glStyle = {
    //   version: 8,
    //   name: 'ASCAT',
    //   sources: {
    //     ASCAT_source: {
    //       type: 'vector',
    //       tiles: [
    //         // 'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/VIIRS_SNPP_Thermal_Anomalies_375m_All/default/{Time}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.mvt',
    //         // 'https://gibs.earthdata.nasa.gov/wmts/epsg3413/best/VIIRS_SNPP_Thermal_Anomalies_375m_All/default/{Time}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.mvt',
    //         'https://sit.gitc.earthdata.nasa.gov/wmts/epsg4326/best/ascat/default/2020-01-01/16km/0/0/0.mvt',
    //       ],
    //     },
    //   },
    //   layers: [
    //     {
    //       id: 'ASCAT_source_v1_NRT',
    //       source: 'ASCAT_source',
    //       'source-layer': 'ASCAT_source_v1_NRT',
    //       type: 'circle',
    //       paint: {
    //         'circle-radius': [
    //           'step',
    //           [
    //             'zoom',
    //           ],
    //           1,
    //           1,
    //           2,
    //           3,
    //           3,
    //         ],
    //         'circle-color': 'rgb(240, 40, 40)',
    //       },
    // },
    // ],
  }

  console.log(glStyle);

  if (!layer || layer.isWMS) {
    return; // WMS breakpoint tile
  }

  console.log('getting layers');
  layer = layer.getLayers
    ? lodashFind(layer.getLayers().getArray(), 'isVector')
    : layer;

  const styleFunction = stylefunction(layer, glStyle, layerId, resolutions);
  const selectedFeatures = selected[layerId];

  // Handle selected feature style
  if ((glStyle.name !== 'Orbit Tracks') && selectedFeatures) {
    const extentStartX = layer.getExtent()[0];
    const acceptableExtent = extentStartX === 180
      ? [-180, -90, -110, 90]
      : extentStartX === -250
        ? [110, -90, 180, 90]
        : null;

    layer.setStyle((feature, resolution) => {
      const data = state.config.vectorData[def.vectorData.id];
      const properties = data.mvt_properties;
      const features = feature.getProperties();
      const idKey = lodashFind(properties, { Function: 'Identify' }).Identifier;
      const uniqueIdentifier = features[idKey];
      if (shouldRenderFeature(feature, acceptableExtent)) {
        if (uniqueIdentifier && selectedFeatures && selectedFeatures.includes(uniqueIdentifier)) {
          return selectedStyleFunction(feature, styleFunction(feature, resolution));
        }
        return styleFunction(feature, resolution);
      }
    });
  }

  return vectorStyleId;
}

const shouldRenderFeature = (feature, acceptableExtent) => {
  console.log('shouldRenderFeature');
  if (!acceptableExtent) return true;
  const midpoint = feature.getFlatCoordinates
    ? feature.getFlatCoordinates()
    : feature.getGeometry().getFlatCoordinates();
  if (containsCoordinate(acceptableExtent, midpoint)) return true;
  return false;
};

export function getKey(layerId, groupStr, state) {
  console.log('getKey');
  groupStr = groupStr || state.compare.activeString;
  if (!isActive(layerId, groupStr, state)) {
    return '';
  }
  const def = getVectorStyle(layerId, undefined, groupStr, state);
  const keys = [];
  if (def.custom) {
    keys.push(`style=${def.custom}`);
  }
  if (def.min) {
    keys.push(`min=${def.min}`);
  }
  if (def.max) {
    keys.push(`max=${def.max}`);
  }
  return keys.join(',');
}

export function isActive(layerId, group, state) {
  console.log('isActive');
  group = group || state.compare.activeString;
  if (state.vectorStyles.custom[layerId]) {
    return state.vectorStyles[group][layerId];
  }
}

export function clearStyleFunction(def, vectorStyleId, vectorStyles, layer, state) {
  console.log('clearStyleFunction');
  const layerId = def.id;
  const glStyle = vectorStyles[layerId];
  const olMap = lodashGet(state, 'legacy.map.ui.selected');
  if (olMap) {
    lodashEach(olMap.getLayers().getArray(), (subLayer) => {
      if (subLayer.wv.id === layerId) {
        layer = subLayer;
      }
    });
  }
  const styleFunction = stylefunction(layer, glStyle, vectorStyleId);
  if (glStyle.name === 'Orbit Tracks') {
    // Filter time by 5 mins
    layer.setStyle((feature, resolution) => {
      let minute;
      const minutes = feature.get('label');
      if (minutes) {
        minute = minutes.split(':');
      }
      if ((minute && minute[1] % 5 === 0) || feature.getType() === 'LineString') {
        return styleFunction(feature, resolution);
      }
    });
  }
  return update(vectorStyles, { layerId: { maps: { $unset: ['custom'] } } });
}

/** Apply style to new layer
 *
 * @param {Object} def
 * @param {Object} olVectorLayer
 * @param {Object} state
 */
export const applyStyle = (def, olVectorLayer, state) => {
  console.log('applyStyle');
  const { config } = state;
  const { vectorStyles } = config;
  const activeLayers = getActiveLayers(state) || [];
  const layerName = def.layer || def.id;
  let vectorStyleId = def.vectorStyle.id;

  if (!vectorStyles || !vectorStyleId) {
    return;
  }

  activeLayers.forEach((layer) => {
    if (layer.id === layerName && layer.custom) {
      vectorStyleId = layer.custom;
    }
  });
  console.log('setStyleFunction');
  setStyleFunction(def, vectorStyleId, vectorStyles, olVectorLayer, state);
};

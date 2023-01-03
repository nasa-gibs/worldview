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
  const { config, vectorStyles } = state;
  const name = lodashGet(config, `layers.${layerId}.vectorStyle.id`);
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
  // Placeholder filter range function
  return {
    layerId, props, index, palettes, state,
  };
}

// Review calls to this function & determine if calls are necessary for Vector Flow Layers
export function setStyleFunction(def, vectorStyleId, vectorStyles, layer, state) {
  const map = lodashGet(state, 'map.ui.selected');
  if (!map) return;
  const { proj } = state;
  const { selected } = state.vectorStyles;
  const { resolutions } = proj.selected;
  const layerId = def.id;
  const styleId = lodashGet(def, `vectorStyle.${proj.id}.id`) || vectorStyleId || lodashGet(def, 'vectorStyle.id') || layerId;
  const glStyle = vectorStyles[styleId];

  // OSCAR_Cloud & ASCAT_Ocean_Surface_Wind_Speed do not include a glStyle from /getCapabilities yet,
  // so we early return here so we can apply our own styling. Ultimately these styles will be served from
  // the provider(s) and this check will go away.
  if (glStyle === undefined) {
    return;
  }

  // This is temporary until the ASCAT JSON files from /getCapabilities are updated with
  // the appropriate vector style name.
  if (glStyle.name === 'OSCAR_Sea_Surface_Currents') {
    return;
  }

  console.log(glStyle);

  if (!layer || layer.isWMS) {
    return; // WMS breakpoint tile
  }

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
  if (!acceptableExtent) return true;
  const midpoint = feature.getFlatCoordinates
    ? feature.getFlatCoordinates()
    : feature.getGeometry().getFlatCoordinates();
  if (containsCoordinate(acceptableExtent, midpoint)) return true;
  return false;
};

export function getKey(layerId, groupStr, state) {
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
  group = group || state.compare.activeString;
  if (state.vectorStyles.custom[layerId]) {
    return state.vectorStyles[group][layerId];
  }
}

export function clearStyleFunction(def, vectorStyleId, vectorStyles, layer, state) {
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
 * @param {Object} def {object} The layer information
 * @param {Object} olVectorLayer {object} The VectorTileLayer object
 * @param {Object} state {object} application state
 */
export const applyStyle = (def, olVectorLayer, state) => {
  const { config } = state;
  const { vectorStyles } = config;
  const activeLayers = getActiveLayers(state) || [];
  const layerName = def.layer || def.id;
  let vectorStyleId = def.vectorStyle.id;

  if (!vectorStyles || !vectorStyleId) {
    return;
  }

  // iterate to find the matching layer data & apply the custom style
  activeLayers.forEach((layer) => {
    if (layer.id === layerName && layer.custom) {
      vectorStyleId = layer.custom;
    }
  });
  setStyleFunction(def, vectorStyleId, vectorStyles, olVectorLayer, state);
};

import {
  cloneDeep as lodashCloneDeep,
  eachRight as lodashEachRight,
  isUndefined as lodashIsUndefined,
  remove as lodashRemove,
  findIndex as lodashFindIndex,
  each as lodashEach
} from 'lodash';

import { addLayer } from './selectors';
import update from 'immutability-helper';
import util from '../../util/util';

export function serializeLayers(currentLayers, state, groupName) {
  const layers = currentLayers;
  const palettes = state.palettes[groupName];
  return layers.map((def, i) => {
    var item = {};

    if (def.id) {
      item = {
        id: def.id
      };
    }
    if (!item.attributes) {
      item.attributes = [];
    }
    if (!def.visible) {
      item.attributes.push({
        id: 'hidden'
      });
    }
    if (def.opacity < 1) {
      item.attributes.push({
        id: 'opacity',
        value: def.opacity
      });
    }
    if (def.custom) {
      let paletteDef = palettes[def.id];
      if (paletteDef.custom) {
        item.attributes.push({
          id: 'palette',
          value: paletteDef.custom
        });
      }
      if (paletteDef.min) {
        var minValue = paletteDef.entries.values[paletteDef.min];
        item.attributes.push({
          id: 'min',
          value: minValue
        });
      }
      if (paletteDef.max) {
        var maxValue = paletteDef.entries.values[paletteDef.max];
        item.attributes.push({
          id: 'max',
          value: maxValue
        });
      }
      if (paletteDef.squash) {
        item.attributes.push({
          id: 'squash'
        });
      }
    }
    return util.appendAttributesForURL(item);
  });
}

export function toggleVisibility(id, layers) {
  var index = lodashFindIndex(layers, {
    id: id
  });
  if (index === -1) {
    throw new Error('Invalid layer ID: ' + id);
  }
  var visibility = !layers[index].visible;

  return update(layers, { [index]: { visible: { $set: visibility } } });
}
export function removeLayer(id, layers) {
  var index = lodashFindIndex(layers, {
    id: id
  });
  if (index === -1) {
    throw new Error('Invalid layer ID: ' + id);
  }
  return update(layers, { $splice: [[index, 1]] });
}
// this function takes an array of date ranges in this format:
// [{ layer.period, dateRanges.startDate: Date, dateRanges.endDate: Date, dateRanges.dateInterval: Number}]
// the array is first sorted, and then checked for any overlap
export function dateOverlap(period, dateRanges) {
  var sortedRanges = dateRanges.sort((previous, current) => {
    // get the start date from previous and current
    var previousTime = util.parseDate(previous.startDate);
    previousTime = previousTime.getTime();
    var currentTime = util.parseDate(current.startDate);
    currentTime = currentTime.getTime();

    // if the previous is earlier than the current
    if (previousTime < currentTime) {
      return -1;
    }

    // if the previous time is the same as the current time
    if (previousTime === currentTime) {
      return 0;
    }

    // if the previous time is later than the current time
    return 1;
  });

  var result = sortedRanges.reduce(
    (result, current, idx, arr) => {
      // get the previous range
      if (idx === 0) {
        return result;
      }
      var previous = arr[idx - 1];

      // check for any overlap
      var previousEnd = util.parseDate(previous.endDate);
      // Add dateInterval
      if (previous.dateInterval > 1 && period === 'daily') {
        previousEnd = new Date(
          previousEnd.setTime(
            previousEnd.getTime() +
              (previous.dateInterval * 86400000 - 86400000)
          )
        );
      }
      if (period === 'monthly') {
        previousEnd = new Date(
          previousEnd.setMonth(
            previousEnd.getMonth() + (previous.dateInterval - 1)
          )
        );
      } else if (period === 'yearly') {
        previousEnd = new Date(
          previousEnd.setFullYear(
            previousEnd.getFullYear() + (previous.dateInterval - 1)
          )
        );
      }
      previousEnd = previousEnd.getTime();

      var currentStart = util.parseDate(current.startDate);
      currentStart = currentStart.getTime();

      var overlap = previousEnd >= currentStart;
      // store the result
      if (overlap) {
        // yes, there is overlap
        result.overlap = true;
        // store the specific ranges that overlap
        result.ranges.push({
          previous: previous,
          current: current
        });
      }

      return result;
    },
    {
      overlap: false,
      ranges: []
    }
  );

  // return the final results
  return result;
}
// Takes a layer id and returns a true or false value
// if the layer exists in the active layer list
export function exists(layer, activeLayers) {
  var found = false;
  lodashEach(activeLayers, function(current) {
    if (layer === current.id) {
      found = true;
    }
  });
  return found;
}
// Permalink versions 1.0 and 1.1
export function layersParse11(str, config) {
  var layers = [];
  var ids = str.split(/[~,.]/);
  lodashEach(ids, function(id) {
    if (id === 'baselayers' || id === 'overlays') {
      return;
    }
    var visible = true;
    if (id.startsWith('!')) {
      visible = false;
      id = id.substring(1);
    }
    if (config.redirects && config.redirects.layers) {
      id = config.redirects.layers[id] || id;
    }
    if (!config.layers[id]) {
      console.warn('No such layer: ' + id);
      return;
    }
    var lstate = {
      id: id,
      attributes: []
    };
    if (!visible) {
      lstate.attributes.push({
        id: 'hidden',
        value: true
      });
    }
    layers.push(lstate);
  });
  return createLayerArrayFromState(layers, config);
}

// Permalink version 1.2
export function layersParse12(stateObj, config) {
  var parts;
  var str = stateObj;
  // Split by layer definitions (commas not in parens)
  var layerDefs = str.match(/[^(,]+(\([^)]*\))?,?/g);
  var lstates = [];
  lodashEach(layerDefs, function(layerDef) {
    // Get the text before any paren or comma
    var layerId = layerDef.match(/[^(,]+/)[0];
    if (config.redirects && config.redirects.layers) {
      layerId = config.redirects.layers[layerId] || layerId;
    }
    var lstate = {
      id: layerId,
      attributes: []
    };
    // Everything inside parens
    var arrayAttr = layerDef.match(/\(.*\)/);
    if (arrayAttr) {
      // Get single match and remove parens
      var strAttr = arrayAttr[0].replace(/[()]/g, '');
      // Key value pairs
      var kvps = strAttr.split(',');
      lodashEach(kvps, function(kvp) {
        parts = kvp.split('=');
        if (parts.length === 1) {
          lstate.attributes.push({
            id: parts[0],
            value: true
          });
        } else {
          lstate.attributes.push({
            id: parts[0],
            value: parts[1]
          });
        }
      });
    }
    lstates.push(lstate);
  });
  return createLayerArrayFromState(lstates, config);
}
const createLayerArrayFromState = function(state, config) {
  let layerArray = [];
  lodashEach(state, obj => {
    if (!lodashIsUndefined(state)) {
      lodashEachRight(state, function(layerDef) {
        let hidden = false;
        let opacity = 1.0;
        if (!config.layers[layerDef.id]) {
          console.warn('No such layer: ' + layerDef.id);
          return;
        }
        lodashEach(layerDef.attributes, function(attr) {
          if (attr.id === 'hidden') {
            hidden = true;
          }
          if (attr.id === 'opacity') {
            opacity = util.clamp(parseFloat(attr.value), 0, 1);
            if (isNaN(opacity)) opacity = 0; // "opacity=0.0" is opacity in URL, resulting in NaN
          }
        });
        layerArray = addLayer(
          layerDef.id,
          {
            hidden: hidden,
            opacity: opacity
          },
          layerArray,
          config.layers
        );
      });
    }
  });
  return layerArray;
};
export function validate(errors, config) {
  var error = function(layerId, cause) {
    errors.push({
      message: 'Invalid layer: ' + layerId,
      cause: cause,
      layerRemoved: true
    });
    delete config.layers[layerId];
    lodashRemove(config.layerOrder.baselayers, function(e) {
      return e === layerId;
    });
    lodashRemove(config.layerOrder.overlays, function(e) {
      return e === layerId;
    });
  };

  var layers = lodashCloneDeep(config.layers);
  lodashEach(layers, function(layer) {
    if (!layer.group) {
      error(layer.id, 'No group defined');
      return;
    }
    if (!layer.projections) {
      error(layer.id, 'No projections defined');
    }
  });

  var orders = lodashCloneDeep(config.layerOrder);
  lodashEach(orders, function(layerId) {
    if (!config.layers[layerId]) {
      error(layerId, 'No configuration');
    }
  });
}

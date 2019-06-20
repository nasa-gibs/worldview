import {
  get as lodashGet,
  isUndefined as lodashIsUndefined,
  each as lodashEach
  // cloneDeep as lodashCloneDeep
} from 'lodash';
import {
  getLayers
} from '../layers/selectors';
import { getMinValue, getMaxValue } from './util';
import update from 'immutability-helper';
import stylefunction from 'ol-mapbox-style/stylefunction';

/**
 * Gets a single colormap (entries / legend combo)
 *
 *
 * @method get
 * @static
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
    `vectorStyles.${layerId}.layers.${index}`
  );
  if (renderedVectorStyle) {
    return renderedVectorStyle;
  }
  return getAllVectorStyles(layerId, index, state);
}

export function getAllVectorStyles(layerId, index, state) {
  const { config, vectorStyles } = state;
  var name = lodashGet(config, `layers.${layerId}.vectorStyle.id`);
  var vectorStyle = vectorStyles.custom[name];
  if (!vectorStyle) {
    throw new Error(name + ' Is not a rendered vectorStyle');
  }
  if (!lodashIsUndefined(index)) {
    if (vectorStyle.layers) {
      vectorStyle = vectorStyle.layers[index];
    }
  }
  return vectorStyle;
}

export function getCount(layerId, state) {
  const renderedVectorStyle = getAllVectorStyles(layerId, undefined, state);
  if (renderedVectorStyle && renderedVectorStyle.layers) {
    return renderedVectorStyle.layers.length;
  } else {
    return 0;
  }
}

// export function getCustomVectorStyle(vectorStyleId, customsVectorStyleConfig) {
//   var vectorStyle = customsVectorStyleConfig[vectorStyleId];
//   if (!vectorStyle) {
//     throw new Error('Invalid vectorStyle: ' + vectorStyleId);
//   }
//   return vectorStyle;
// }
// var useLookup = function(layerId, vectorStylesObj, state) {
//   var use = false;
//   var active = vectorStylesObj[layerId].maps;

//   lodashEach(active, function(vectorStyle, index) {
//     if (vectorStyle.custom) {
//       use = true;
//       return false;
//     }
//     var rendered = getAllVectorStyles(layerId, index, state);
//     console.log(rendered);
//     if (vectorStyle.min <= 0) {
//       delete vectorStyle.min;
//     }
//     if (vectorStyle.max >= rendered.entries.values.length) {
//       delete vectorStyle.max;
//     }
//     if (!lodashIsUndefined(vectorStyle.min) || !lodashIsUndefined(vectorStyle.max)) {
//       use = true;
//       return false;
//     }
//   });
//   return use;
// };
// Looks up options/colormaps/layer.xml colormap entry
export function getLookup(layerId, groupstr, state) {
  groupstr = groupstr || state.compare.activeString;
  return state.vectorStyles[groupstr][layerId].lookup;
}
// var updateLookup = function(layerId, vectorStylesObj, state) {
//   let newVectorStyles = vectorStylesObj;
//   if (!useLookup(layerId, newVectorStyles, state)) {
//     delete newVectorStyles[layerId];
//     return newVectorStyles;
//   }
//   var lookup = {};
//   var active = newVectorStyles[layerId].maps;
//   lodashEach(active, function(vectorStyle, index) {
//     var oldLegend = vectorStyle.legend;
//     var entries = vectorStyle.entries;
//     var legend = {
//       colors: [],
//       minLabel: oldLegend.minLabel,
//       maxLabel: oldLegend.maxLabel,
//       tooltips: oldLegend.tooltips,
//       units: oldLegend.units,
//       type: entries.type,
//       title: entries.title,
//       id: oldLegend.id
//     };
//     var source = entries.colors;
//     var target = vectorStyle.custom
//       ? getCustomVectorStyle(vectorStyle.custom, state.vectorStyles.custom).colors
//       : source;

//     var min = vectorStyle.min || 0;
//     var max = vectorStyle.max || source.length;

//     var sourceCount = source.length;
//     var targetCount = target.length;
//     lodashEach(source, function(color, index) {
//       var targetColor;
//       if (index < min || index > max) {
//         targetColor = '00000000';
//       } else {
//         var sourcePercent, targetIndex;
//         if (vectorStyle.squash) {
//           sourcePercent = (index - min) / (max - min);
//           if (index === max) {
//             sourcePercent = 1.0;
//           }
//           targetIndex = Math.floor(sourcePercent * targetCount);
//           if (targetIndex >= targetCount) {
//             targetIndex = targetCount - 1;
//           }
//         } else {
//           sourcePercent = index / sourceCount;
//           targetIndex = Math.floor(sourcePercent * targetCount);
//         }
//         targetColor = target[targetIndex];
//       }
//       legend.colors.push(targetColor);
//       var lookupSource =
//         lodashParseInt(color.substring(0, 2), 16) +
//         ',' +
//         lodashParseInt(color.substring(2, 4), 16) +
//         ',' +
//         lodashParseInt(color.substring(4, 6), 16) +
//         ',' +
//         lodashParseInt(color.substring(6, 8), 16);
//       var lookupTarget = {
//         r: lodashParseInt(targetColor.substring(0, 2), 16),
//         g: lodashParseInt(targetColor.substring(2, 4), 16),
//         b: lodashParseInt(targetColor.substring(4, 6), 16),
//         a: lodashParseInt(targetColor.substring(6, 8), 16)
//       };
//       lookup[lookupSource] = lookupTarget;
//     });

//     newVectorStyles = update(newVectorStyles, {
//       [layerId]: {
//         maps: { [index]: { legend: { $set: legend } } }
//       }
//     });
//   });
//   return update(newVectorStyles, { [layerId]: { lookup: { $set: lookup } } });
// };

export function findIndex(layerId, type, value, index, groupStr, state) {
  index = index || 0;
  var values = getVectorStyle(layerId, index, groupStr, state).entries.values;
  var result;
  lodashEach(values, function(check, index) {
    var min = getMinValue(check);
    var max = getMaxValue(check);
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
// export function setCustomSelector(def, vectorStyleId, vectorStyles, layer, state, groupName) {
//   const { config } = state;
//   if (!config.layers[def.id]) {
//     throw new Error('Invalid layer: ' + def.id);
//   }
//   let newVectorStyles = prepare(def.id, vectorStyles[groupName], state);
//   def = lodashIsUndefined(def) ? 0 : def;
//   var active = newVectorStyles[def.id];
//   var vectorStyle = active.maps[def];
//   if (vectorStyle.custom === vectorStyleId) {
//     return;
//   }
//   vectorStyle.custom = vectorStyleId;
//   setStyleFunction(def, vectorStyleId, vectorStyles, layer, state);

//   return updateLookup(def.id, newVectorStyles, state);
// }

export function setStyleFunction(def, vectorStyleId, vectorStyles, layer, state) {
  var styleFunction;
  var layerId = def.id;
  var glStyle = vectorStyles[layerId];
  var olMap = lodashGet(state, 'map.ui.selected');
  var layerState = state.layers;
  const activeLayerStr = state.compare.activeString;
  var activeLayers = getLayers(
    layerState[activeLayerStr],
    {},
    state
  ).reverse();
  var layerGroups;
  var layerGroup;
  if (state.compare && state.compare.active) {
    layerGroups = olMap.getLayers().getArray();
    if (layerGroups.length === 2) {
      layerGroup =
        layerGroups[0].get('group') === activeLayerStr
          ? layerGroups[0]
          : layerGroups[1].get('group') === activeLayerStr
            ? layerGroups[1]
            : null;
    }
  }
  lodashEach(activeLayers, function(def) {
    if (!['subdaily', 'daily', 'monthly', 'yearly'].includes(def.period)) {
      return;
    }

    if (state.compare && state.compare.active) {
      if (layerGroup && layerGroup.getLayers().getArray().length) {
        lodashEach(layerGroup.getLayers().getArray(), subLayer => {
          if (subLayer.wv && (subLayer.wv.id === layerId)) {
            layer = subLayer;
          }
        });
      }
    } else {
      lodashEach(layerGroups, subLayer => {
        if (subLayer.wv && (subLayer.wv.id === layerId)) {
          layer = subLayer;
        }
      });
    }
  });

  if (olMap) {
    console.log(olMap);
    lodashEach(olMap.getLayers().getArray(), subLayer => {
      console.log(subLayer);
      if (subLayer.wv && (subLayer.wv.id === layerId)) {
        layer = subLayer;
      }
    });
  }
  styleFunction = stylefunction(layer, glStyle, vectorStyleId);
  if (glStyle.name === 'Orbit Tracks') {
    // Filter time by 5 mins
    layer.setStyle(function(feature, resolution) {
      var minute;
      var minutes = feature.get('label');
      if (minutes) {
        minute = minutes.split(':');
      }
      if ((minute && minute[1] % 5 === 0) || feature.type_ === 'LineString') {
        return styleFunction(feature, resolution);
      }
    });
  }
  return glStyle; // this is wrong
}

export function getKey(layerId, groupStr, state) {
  groupStr = groupStr || state.compare.activeString;
  if (!isActive(layerId, groupStr, state)) {
    return '';
  }
  var def = getVectorStyle(layerId, undefined, groupStr, state);
  var keys = [];
  if (def.custom) {
    keys.push('vectorStyle=' + def.custom);
  }
  if (def.min) {
    keys.push('min=' + def.min);
  }
  if (def.max) {
    keys.push('max=' + def.max);
  }
  return keys.join(',');
}
export function isActive(layerId, group, state) {
  group = group || state.compare.activeString;
  if (state.vectorStyles['custom'][layerId]) {
    return state.vectorStyles[group][layerId];
  }
}
export function setRange(layerId, props, index, vectorStyles, state) {
  let min = props.min;
  let max = props.max;
  // let squash = props.squash;
  // let newVectorStyles = prepare(layerId, vectorStyles, state);
  index = lodashIsUndefined(index) ? 0 : index;
  if (min === 0) {
    min = undefined;
  }
  const legend = getVectorStyle(layerId, index, undefined, state);
  if (
    legend.entries &&
    legend.entries.values &&
    max === legend.entries.values.length - 1
  ) {
    max = undefined;
  }

  // Merge custom vectorStyle props with correct colormap
  // newVectorStyles = update(newVectorStyles, {
  //   [layerId]: {
  //     maps: {
  //       [index]: {
  //         $merge: {
  //           max,
  //           min,
  //           squash
  //         }
  //       }
  //     }
  //   }
  // });

  // return updateLookup(layerId, newVectorStyles, state);
}
export function clearCustomSelector(layerId, index, vectorStyles) {
  index = lodashIsUndefined(index) ? 0 : index;
  var active = vectorStyles[layerId];
  if (!active) {
    return vectorStyles;
  }
  var vectorStyle = active.maps[index];
  if (!vectorStyle.custom) {
    return vectorStyles;
  }
  return update(vectorStyles, { layerId: { maps: { $unset: ['custom'] } } }); // remove custom key
}

export function clearStyleFunction(def, vectorStyleId, vectorStyles, layer, state) {
  var styleFunction;
  var layerId = def.id;
  var glStyle = vectorStyles[layerId];
  var olMap = lodashGet(state, 'legacy.map.ui.selected');
  if (olMap) {
    lodashEach(olMap.getLayers().getArray(), subLayer => {
      if (subLayer.wv.id === layerId) {
        layer = subLayer;
      }
    });
  }

  styleFunction = stylefunction(layer, glStyle, vectorStyleId);
  if (glStyle.name === 'Orbit Tracks') {
    // Filter time by 5 mins
    layer.setStyle(function(feature, resolution) {
      var minute;
      var minutes = feature.get('label');
      if (minutes) {
        minute = minutes.split(':');
      }
      if ((minute && minute[1] % 5 === 0) || feature.type_ === 'LineString') {
        return styleFunction(feature, resolution);
      }
    });
  }
  return update(vectorStyles, { layerId: { maps: { $unset: ['custom'] } } });
}

// var prepare = function(layerId, vectorStylesObj, state) {
//   var newVectorStyles = lodashCloneDeep(vectorStylesObj);
//   if (!newVectorStyles[layerId]) newVectorStyles[layerId] = {};
//   var active = newVectorStyles[layerId];
//   active.maps = active.maps || [];
//   lodashEach(getAllVectorStyles(layerId, undefined, state).maps, function(
//     vectorStyle,
//     index
//   ) {
//     if (!active.maps[index]) {
//       newVectorStyles = update(newVectorStyles, {
//         [layerId]: { maps: { [index]: { $set: vectorStyle } } }
//       });
//     }
//   });
//   return newVectorStyles;
// };

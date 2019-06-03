import update from 'immutability-helper';
import {
  each as lodashEach,
  find as lodashFind,
  assign as lodashAssign
} from 'lodash';
import {
  setCustom as setCustomSelector,
  getCount,
  setRange as setRangeSelector,
  findIndex as findVectorStyleExtremeIndex
} from './selectors';
import util from '../../util/util';

export function loadRenderedVectorStyle(config, layerId) {
  var layer = config.layers[layerId];
  return util.load.config(config.vectorStyles.rendered,
    layer.vectorStyle.id, 'config/vectorstyles/' + layer.vectorStyle.id + '.json');
}
// export function loadCustom(config) {
//   return util.load.config(
//     config.vectorStyles,
//     'custom',
//     'config/vectorStyles-custom.json'
//   );
// }

export function parseVectorStyles(state, errors, config) {
  if (state.vectorStyles) {
    var parts = state.vectorStyles.split('~');
    lodashEach(parts, function(part) {
      var items = part.split(',');
      var layerId = items[0];
      var vectorStyleId = items[1];
      if (!config.layers[layerId]) {
        errors.push({
          message: 'Invalid layer for vectorStyle ' + vectorStyleId + ': ' + layerId
        });
      } else if (!config.layers[layerId].vectorStyle) {
        errors.push({
          message: 'Layer ' + layerId + ' does not ' + 'support vectorStyles'
        });
      } else {
        var layer = lodashFind(state.l, {
          id: layerId
        });
        if (layer) {
          layer.attributes.push({
            id: 'vectorStyle',
            value: vectorStyleId
          });
        } else {
          errors.push({
            message: 'Layer ' + layerId + ' is not ' + 'active'
          });
        }
      }
    });
    delete state.vectorStyles;
  }
}

// export function getVectorStyleAttributeArray(layerId, vectorStyles, state) {
//   const count = getCount(layerId, state);
//   const DEFAULT_OBJ = { isActive: false, value: undefined };
//   let palObj = lodashAssign({}, { key: 'custom', array: [] }, DEFAULT_OBJ);
//   let minObj = lodashAssign({}, { key: 'min', array: [] }, DEFAULT_OBJ);
//   let maxObj = lodashAssign({}, { key: 'max', array: [] }, DEFAULT_OBJ);
//   let squashObj = lodashAssign({}, { key: 'squash', array: [] }, DEFAULT_OBJ);
//   let attrArray = [];
//   for (var i = 0; i < count; i++) {
//     let vectorStyleDef = vectorStyles[layerId].maps[i];
//     let entryLength = vectorStyleDef.entries.values.length;
//     let maxValue = vectorStyleDef.max
//       ? vectorStyleDef.entries.values[vectorStyleDef.max || entryLength]
//       : undefined;
//     let minValue = vectorStyleDef.min
//       ? vectorStyleDef.entries.values[vectorStyleDef.min || 0]
//       : undefined;
//     palObj = createVectorStyleAttributeObject(
//       vectorStyleDef,
//       vectorStyleDef.custom,
//       palObj,
//       count
//     );
//     maxObj = createVectorStyleAttributeObject(vectorStyleDef, maxValue, maxObj, count);
//     minObj = createVectorStyleAttributeObject(vectorStyleDef, minValue, minObj, count);

//     squashObj = createVectorStyleAttributeObject(
//       vectorStyleDef,
//       true,
//       squashObj,
//       count
//     );
//   }

//   [palObj, minObj, maxObj, squashObj].forEach(obj => {
//     if (obj.isActive) {
//       attrArray.push({
//         id: obj.key === 'custom' ? 'vectorStyle' : obj.key,
//         value: obj.value
//       });
//     }
//   });
//   return attrArray;
// }
// const createVectorStyleAttributeObject = function(def, value, attrObj, count) {
//   const key = attrObj.key;
//   const attrArray = attrObj.array;
//   let hasAtLeastOnePair = attrObj.isActive;
//   value = isArray(value) ? value.join(',') : value;
//   if (def[key] && value) {
//     attrArray.push(value);
//     hasAtLeastOnePair = true;
//   } else if (count > 1) {
//     attrArray.push('');
//   }
//   return lodashAssign({}, attrObj, {
//     array: attrArray,
//     isActive: hasAtLeastOnePair,
//     value: attrArray.join(';')
//   });
// };
export function loadVectorStyles(permlinkState, state) {
  var stateArray = [{ stateStr: 'l', groupStr: 'active' }];
  if (permlinkState.l1) {
    stateArray = [
      { stateStr: 'l', groupStr: 'active' },
      { stateStr: 'l1', groupStr: 'activeB' }
    ];
  }
  lodashEach(stateArray, stateObj => {
    lodashEach(state.layers[stateObj.groupStr], function(layerDef) {
      var layerId = layerDef.id;
      var min = [];
      var max = [];
      var squash = [];
      var count = 0;
      if (layerDef.custom) {
        lodashEach(layerDef.custom, function(value, index) {
          try {
            let newVectorStyles = setCustomSelector(
              layerId,
              value,
              index,
              stateObj.groupStr,
              state
            );
            state = update(state, {
              vectorStyles: { [stateObj.groupStr]: { $set: newVectorStyles } }
            });
          } catch (error) {
            console.warn(' Invalid vectorStyle: ' + value);
          }
        });
      }
      if (layerDef.min) {
        lodashEach(layerDef.min, function(value, index) {
          try {
            min.push(
              findVectorStyleExtremeIndex(
                layerId,
                'min',
                value,
                index,
                stateObj.groupStr,
                state
              )
            );
          } catch (error) {
            console.warn('Unable to set min: ' + value);
          }
        });
      }
      if (layerDef.max) {
        lodashEach(layerDef.max, function(value, index) {
          try {
            max.push(
              findVectorStyleExtremeIndex(
                layerId,
                'max',
                value,
                index,
                stateObj.groupStr,
                state
              )
            );
          } catch (error) {
            console.warn('Unable to set max index: ' + value);
          }
        });
      }
      if (layerDef.squash) {
        squash = layerDef.squash;
      }

      if (min.length > 0 || max.length > 0) {
        count = getCount(layerId, state);
        for (var i = 0; i < count; i++) {
          var vmin = min.length > 0 ? min[i] : undefined;
          var vmax = max.length > 0 ? max[i] : undefined;
          var vsquash = squash.length > 0 ? squash[i] : undefined;
          let props = { min: vmin, max: vmax, squash: vsquash };
          let newVectorStyles = setRangeSelector(
            layerId,
            props,
            i,
            state.vectorStyles[stateObj.groupStr],
            state
          );
          state = update(state, {
            vectorStyles: { [stateObj.groupStr]: { $set: newVectorStyles } }
          });
        }
      }
    });
  });
  return state;
}
export function mapLocationToVectorStyleState(
  parameters,
  stateFromLocation,
  state,
  config
) {
  if (parameters.l1 || parameters.l) {
    stateFromLocation = loadVectorStyles(
      parameters,
      lodashAssign({}, stateFromLocation, {
        vectorStyles: state.vectorStyles,
        config
      })
    );
  }
  return stateFromLocation;
}

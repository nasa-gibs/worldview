import update from 'immutability-helper';
import {
  each as lodashEach,
  // find as lodashFind,
  assign as lodashAssign
} from 'lodash';
import {
  setStyleFunction,
  getCount,
  setRange as setRangeSelector,
  findIndex as findVectorStyleExtremeIndex
} from './selectors';
// import util from '../../util/util';

export function getVectorStyleAttributeArray(layer) {
  var isCustomActive = false;
  var isMinActive = false;
  var isMaxActive = false;
  if (layer.custom) { isCustomActive = true; }
  if (layer.min) { isMinActive = true; }
  if (layer.max) { isMaxActive = true; }
  let styleObj = lodashAssign({}, { key: 'custom', value: layer.custom, isActive: isCustomActive });
  let minObj = lodashAssign({}, { key: 'min', value: layer.min, isActive: isMinActive });
  let maxObj = lodashAssign({}, { key: 'max', value: layer.max, isActive: isMaxActive });
  let attrArray = [];

  [styleObj, minObj, maxObj].forEach(obj => {
    if (obj.isActive) {
      attrArray.push({
        id: obj.key === 'custom' ? 'vectorStyle' : obj.key,
        value: obj.value
      });
    }
  });
  return attrArray;
}

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
      if (layerDef.vectorStyle) {
        var min = [];
        var max = [];
        var count = 0;
        if (layerDef.custom && layerDef.custom[0]) {
          let vectorStyleId = layerDef.custom[0];
          try {
            let newVectorStyles = setStyleFunction(
              layerDef,
              vectorStyleId,
              state.vectorStyles.custom,
              stateObj.groupStr,
              state
            );
            state = update(state, {
              vectorStyles: { [stateObj.groupStr]: { $set: newVectorStyles } }
            });
          } catch (error) {
            console.warn(' Invalid vectorStyle: ' + vectorStyleId);
          }
        }
        if (layerDef.min) {
          lodashEach(layerDef.min, function(value, index) {
            try {
              min.push(
                findVectorStyleExtremeIndex(
                  layerDef.id,
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
                  layerDef.id,
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

        if (min.length > 0 || max.length > 0) {
          count = getCount(layerDef.id, state);
          for (var i = 0; i < count; i++) {
            var vmin = min.length > 0 ? min[i] : undefined;
            var vmax = max.length > 0 ? max[i] : undefined;
            let props = { min: vmin, max: vmax };
            let newVectorStyles = setRangeSelector(
              layerDef.id,
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

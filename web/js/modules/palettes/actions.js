import { requestAction } from '../core/actions';
import {
  REQUEST_PALETTE,
  SET_THRESHOLD_RANGE_AND_SQUASH,
  CLEAR_CUSTOM,
  SET_CUSTOM,
  SET_DISABLED_CLASSIFICATION,
  LOADED_CUSTOM_PALETTES
} from './constants';
import { forOwn as lodashForOwn } from 'lodash';
import {
  setRange as setRangeSelector,
  setCustomSelector,
  clearCustomSelector,
  setDisabledSelector
} from './selectors';
/**
 * Request palette using core request utility
 *
 * @param {String} id | Layer Id
 */
export function requestPalette(id) {
  return (dispatch, getState) => {
    const config = getState().config;
    var layer = config.layers[id];
    const paletteID = layer.palette.id;
    const location = 'config/palettes/' + paletteID + '.json';
    return requestAction(
      dispatch,
      REQUEST_PALETTE,
      location,
      'application/json',
      paletteID
    );
  };
}

/**
 * @param {String} layerId
 * @param {Object} props | contains min max and squash attributes
 * @param {Number} index | Palette index value for multi-paletted layers
 * @param {String} groupName | layer group string
 */
export function setThresholdRangeAndSquash(layerId, props, index, groupName) {
  return (dispatch, getState) => {
    const state = getState();
    const newActivePalettesObj = setRangeSelector(
      layerId,
      props,
      index,
      state.palettes[groupName],
      state
    );
    dispatch({
      type: SET_THRESHOLD_RANGE_AND_SQUASH,
      groupName: groupName,
      activeString: groupName,
      layerId,
      palettes: newActivePalettesObj,
      props
    });
  };
}
/**
 * Action to set custom palette
 *
 * @param {String} layerId
 * @param {String} paletteId
 * @param {Number} index | Palette index value for multi-paletted layers
 * @param {String} groupName | layer group string
 */
export function setCustomPalette(layerId, paletteId, index, groupName) {
  return (dispatch, getState) => {
    const state = getState();
    const newActivePalettesObj = setCustomSelector(
      layerId,
      paletteId,
      index,
      groupName,
      state
    );
    dispatch({
      type: SET_CUSTOM,
      layerId: layerId,
      paletteId: paletteId,
      groupName: groupName,
      activeString: groupName,
      palettes: newActivePalettesObj
    });
  };
}
/**
 * Action to remove custom palette
 *
 * @param {String} layerId
 * @param {Number} index | Palette index value for multi-paletted layers
 * @param {String} groupName | layer group string
 */
export function clearCustomPalette(layerId, index, groupName) {
  return (dispatch, getState) => {
    const state = getState();
    const { palettes } = state;
    const newActivePalettesObj = clearCustomSelector(
      layerId,
      index,
      palettes[groupName],
      state
    );

    dispatch({
      type: CLEAR_CUSTOM,
      groupName,
      layerId,
      activeString: groupName,
      palettes: newActivePalettesObj
    });
  };
}
/**
 * Action to remove custom palettes
 *
 * @param {String} layerId
 * @param {Number} index | Palette index value for multi-paletted layers
 * @param {String} groupName | layer group string
 */
export function clearCustoms() {
  return (dispatch, getState) => {
    const state = getState();
    const { palettes, compare } = state;
    const groupName = compare.activeString;
    const activePalettes = palettes[groupName];
    const props = { squash: undefined, min: undefined, max: undefined };
    lodashForOwn(activePalettes, function(value, key) {
      activePalettes[key].maps.forEach((colormap, index) => {
        if (colormap.custom) {
          dispatch(clearCustomPalette(key, index, groupName));
        }
        if (colormap.max || colormap.min || colormap.squash) {
          dispatch(setThresholdRangeAndSquash(key, props, index, groupName));
        }
      });
    });
  };
}
/**
 * Action signifying custom palettes have been loaded
 *
 * @param {Object} customs | Custom Palettes from Config
 */
export function loadedCustomPalettes(customs) {
  return {
    type: LOADED_CUSTOM_PALETTES,
    custom: customs
  };
}
// TODO
export function setToggledClassification(layerId, classIndex, index, groupName) {
  return (dispatch, getState) => {
    const state = getState();
    const newActivePalettesObj = setDisabledSelector(
      layerId,
      classIndex,
      index,
      state.palettes[groupName],
      state
    );
    dispatch({
      type: SET_DISABLED_CLASSIFICATION,
      groupName: groupName,
      activeString: groupName,
      layerId,
      palettes: newActivePalettesObj,
      props: { disabled: classIndex }
    });
  };
};

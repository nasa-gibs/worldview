import { requestAction } from '../core/actions';
import {
  REQUEST_PALETTE,
  SET_RANGE_AND_SQUASH,
  CLEAR_CUSTOM,
  SET_CUSTOM,
  LOADED_CUSTOM_PALETTES
} from './constants';
import {
  setRange as setRangeSelector,
  setCustom as setCustomSelector,
  clearCustom as clearCustomSelector
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
export function setRangeAndSquash(layerId, props, index, groupName) {
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
      type: SET_RANGE_AND_SQUASH,
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
export function setCustom(layerId, paletteId, index, groupName) {
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
export function clearCustom(layerId, index, groupName) {
  return (dispatch, getState) => {
    const { palettes } = getState();
    const newActivePalettesObj = clearCustomSelector(
      layerId,
      index,
      palettes[groupName]
    );

    dispatch({
      type: CLEAR_CUSTOM,
      groupName: groupName,
      palettes: newActivePalettesObj
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

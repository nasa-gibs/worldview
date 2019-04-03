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

export function requestPalette(location, id) {
  return dispatch => {
    return requestAction(
      dispatch,
      REQUEST_PALETTE,
      location,
      'application/json',
      id
    );
  };
}

export function setRange(layerId, min, max, squash, index, groupName) {
  return (dispatch, getState) => {
    const { config, palettes } = getState();
    const props = {
      min: min,
      max: max,
      squash: squash
    };
    const newActivePalettesObj = setRangeSelector(
      layerId,
      props,
      index,
      palettes[groupName],
      palettes.rendered,
      config
    );
    dispatch({
      type: SET_RANGE_AND_SQUASH,
      groupName: groupName,
      palettes: newActivePalettesObj
    });
  };
}
export function setCustom(layerId, paletteId, index, groupName) {
  return (dispatch, getState) => {
    const { config, palettes } = getState();
    const newActivePalettesObj = setCustomSelector(
      layerId,
      paletteId,
      index,
      palettes[groupName],
      config,
      palettes.rendered
    );
    dispatch({
      type: SET_CUSTOM,
      groupName: groupName,
      palettes: newActivePalettesObj
    });
  };
}
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
export function loadedCustomPalettes(customs) {
  return {
    type: LOADED_CUSTOM_PALETTES,
    custom: customs
  };
}

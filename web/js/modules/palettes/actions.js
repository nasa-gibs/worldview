import {
  forOwn as lodashForOwn,
  findIndex as lodashFindIndex,
} from 'lodash';
import { requestAction } from '../core/actions';
import {
  REQUEST_PALETTE,
  SET_THRESHOLD_RANGE_AND_SQUASH,
  CLEAR_CUSTOM,
  SET_CUSTOM,
  SET_DISABLED_CLASSIFICATION,
  LOADED_CUSTOM_PALETTES,
} from './constants';
import {
  setRange as setRangeSelector,
  setCustomSelector,
  clearCustomSelector,
  refreshDisabledSelector,
  setDisabledSelector,
} from './selectors';

/**
 * Request palette using core request utility
 *
 * @param {String} id | Layer Id
 */
export function requestPalette(id) {
  return (dispatch, getState) => {
    const { config } = getState();
    const layer = config.layers[id];
    const paletteID = layer.palette.id;
    const location = `config/palettes/${paletteID}.json`;
    return requestAction(
      dispatch,
      REQUEST_PALETTE,
      location,
      'application/json',
      paletteID,
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
      state,
    );
    dispatch({
      type: SET_THRESHOLD_RANGE_AND_SQUASH,
      groupName,
      activeString: groupName,
      layerId,
      palettes: newActivePalettesObj,
      props,
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
      state,
    );
    dispatch({
      type: SET_CUSTOM,
      layerId,
      paletteId,
      groupName,
      activeString: groupName,
      palettes: newActivePalettesObj,
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
      state,
    );

    dispatch({
      type: CLEAR_CUSTOM,
      groupName,
      layerId,
      activeString: groupName,
      palettes: newActivePalettesObj,
    });
  };
}

export function setToggledClassification(layerId, classIndex, index, groupName) {
  return (dispatch, getState) => {
    const state = getState();
    const newActivePalettesObj = setDisabledSelector(
      layerId,
      classIndex,
      index,
      state.palettes[groupName],
      state,
    );
    let hasDisabled = false;

    if (newActivePalettesObj[layerId] !== undefined) {
      newActivePalettesObj[layerId].maps.forEach((colorMap) => {
        if (colorMap.disabled && colorMap.disabled.length) {
          hasDisabled = true;
        }
      });
    }

    // sometimes an active palette will be related to layers that we already removed during the
    // tour process. need to check if the layer is active to prevent errors when dispatching
    const getLayerIndex = () => {
      const activeLayers = state.layers[groupName].layers;
      return lodashFindIndex(activeLayers, { id: layerId });
    };
    const layerIndex = state.layers[groupName].layers[getLayerIndex()];
    if (layerIndex) {
      dispatch({
        type: SET_DISABLED_CLASSIFICATION,
        groupName,
        activeString: groupName,
        layerId,
        palettes: newActivePalettesObj,
        props: { disabled: hasDisabled },
      });
    }
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
    lodashForOwn(activePalettes, (value, key) => {
      activePalettes[key].maps.forEach((colormap, index) => {
        if (colormap.custom) {
          dispatch(clearCustomPalette(key, index, groupName));
        }
        if (colormap.max || colormap.min || colormap.squash) {
          dispatch(setThresholdRangeAndSquash(key, props, index, groupName));
        }
        if (colormap.disabled) {
          dispatch(setToggledClassification(key, undefined, index, groupName));
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
    custom: customs,
  };
}

export function refreshDisabledClassification(layerId, disabledArray, index, groupName) {
  return (dispatch, getState) => {
    const state = getState();
    const newActivePalettesObj = refreshDisabledSelector(
      layerId,
      disabledArray,
      index,
      state.palettes[groupName],
      state,
    );
    let hasDisabled = false;
    if (!Object.prototype.hasOwnProperty.call(newActivePalettesObj, layerId)) return;
    newActivePalettesObj[layerId].maps.forEach((colorMap) => {
      if (colorMap.disabled && colorMap.disabled.length) {
        hasDisabled = true;
      }
    });
    dispatch({
      type: SET_DISABLED_CLASSIFICATION,
      groupName,
      activeString: groupName,
      layerId,
      palettes: newActivePalettesObj,
      props: { disabled: hasDisabled },
    });
  };
}
export function refreshPalettes(activePalettes) {
  return (dispatch, getState) => {
    const groupName = getState().compare.activeString;
    lodashForOwn(activePalettes, (value, key) => {
      activePalettes[key].maps.forEach((colormap, index) => {
        if (colormap.custom) {
          dispatch(setCustomPalette(key, colormap.custom, index, groupName));
        }
        if (colormap.max || colormap.min || colormap.squash) {
          dispatch(setThresholdRangeAndSquash(key, { squash: colormap.squash, min: colormap.min, max: colormap.max }, index, groupName));
        }
        if (colormap.disabled) {
          dispatch(refreshDisabledClassification(key, colormap.disabled, index, groupName));
        }
      });
    });
  };
}

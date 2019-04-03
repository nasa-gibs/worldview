import { findIndex as lodashFindIndex } from 'lodash';
import {
  addLayer as addLayerSelector,
  resetLayers as resetLayersSelector
} from './selectors';
import {
  RESET_LAYERS,
  ADD_LAYER,
  INIT_SECOND_LAYER_GROUP,
  REORDER_LAYER_GROUP,
  TOGGLE_ACTIVE_STATE,
  ON_LAYER_HOVER,
  TOGGLE_LAYER_VISIBILITY,
  REMOVE_LAYER,
  UPDATE_OPACITY
} from './constants';

export function resetLayers(activeString) {
  return (dispatch, getState) => {
    const { config } = getState();
    const newLayers = resetLayersSelector(
      config.defaults.startingLayers,
      config.layers
    );

    dispatch({
      type: RESET_LAYERS,
      activeString,
      layers: newLayers
    });
  };
}
export function addLayer(id) {
  return (dispatch, getState) => {
    const { layers, compare } = getState();
    const activeString = compare.isActiveA ? 'active' : 'activeB';
    const newLayers = addLayerSelector(
      id,
      {},
      layers[activeString],
      layers.layerConfig
    );

    dispatch({
      type: ADD_LAYER,
      id,
      activeString,
      layers: newLayers
    });
  };
}
export function initSecondLayerGroup() {
  return {
    type: INIT_SECOND_LAYER_GROUP
  };
}
export function reorderLayers(layerArray) {
  return {
    type: REORDER_LAYER_GROUP,
    layerArray: layerArray
  };
}
export function toggleActiveState() {
  return {
    type: TOGGLE_ACTIVE_STATE
  };
}
export function layerHover(id, isMouseOver) {
  return {
    type: ON_LAYER_HOVER,
    id: id,
    active: isMouseOver
  };
}
export function toggleVisibility(id, visible) {
  return (dispatch, getState) => {
    const { layers, compare } = getState();
    const activeString = compare.isActiveA ? 'active' : 'activeB';
    const index = lodashFindIndex(layers[activeString], {
      id: id
    });

    dispatch({
      type: TOGGLE_LAYER_VISIBILITY,
      id,
      index,
      visible,
      activeString
    });
  };
}
export function removeLayer(id) {
  return (dispatch, getState) => {
    const { layers, compare } = getState();
    const activeString = compare.isActiveA ? 'active' : 'activeB';
    const index = lodashFindIndex(layers[activeString], {
      id: id
    });
    if (index === -1) {
      throw new Error('Invalid layer ID: ' + id);
    }

    dispatch({
      type: REMOVE_LAYER,
      id,
      index,
      activeString
    });
  };
}
export function setOpacity(id, opacity) {
  return (dispatch, getState) => {
    const { layers, compare } = getState();
    const activeString = compare.isActiveA ? 'active' : 'activeB';
    const index = lodashFindIndex(layers[activeString], {
      id: id
    });
    if (index === -1) {
      throw new Error('Invalid layer ID: ' + id);
    }

    dispatch({
      type: UPDATE_OPACITY,
      id,
      index,
      opacity,
      activeString
    });
  };
}

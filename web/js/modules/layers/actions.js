import {
  RESET_LAYERS,
  ADD_LAYER,
  INIT_SECOND_LAYER_GROUP,
  REORDER_LAYER_GROUP,
  TOGGLE_ACTIVE_STATE,
  ON_LAYER_HOVER,
  TOGGLE_LAYER_VISIBILITY,
  REMOVE_LAYER
} from './constants';

export function addLayer(layerId) {
  return {
    type: ADD_LAYER,
    id: layerId
  };
}
export function resetLayers(stateStr) {
  return {
    type: RESET_LAYERS,
    stateStr: stateStr || 'A'
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
export function toggleVisibility(id) {
  return {
    type: TOGGLE_LAYER_VISIBILITY,
    id: id
  };
}
export function removeLayer(id) {
  return {
    type: REMOVE_LAYER,
    id: id
  };
}

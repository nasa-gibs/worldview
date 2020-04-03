import { findIndex as lodashFindIndex } from 'lodash';
// eslint-disable-next-line import/no-unresolved
import googleTagManager from 'googleTagManager';
import {
  addLayer as addLayerSelector,
  resetLayers as resetLayersSelector,
  getLayers as getLayersSelector,
  activateLayersForEventCategory as activateLayersForEventCategorySelector,
} from './selectors';
import {
  RESET_LAYERS,
  ADD_LAYER,
  INIT_SECOND_LAYER_GROUP,
  REORDER_LAYER_GROUP,
  ON_LAYER_HOVER,
  TOGGLE_LAYER_VISIBILITY,
  REMOVE_LAYER,
  UPDATE_OPACITY,
  ADD_LAYERS_FOR_EVENT,
} from './constants';
import { selectProduct } from '../data/actions';

export function resetLayers(activeString) {
  return (dispatch, getState) => {
    const { config } = getState();
    const newLayers = resetLayersSelector(
      config.defaults.startingLayers,
      config.layers,
    );

    dispatch({
      type: RESET_LAYERS,
      activeString,
      layers: newLayers,
    });
  };
}
export function activateLayersForEventCategory(activeLayers) {
  return (dispatch, getState) => {
    const state = getState();
    const newLayers = activateLayersForEventCategorySelector(
      activeLayers,
      state,
    );

    dispatch({
      type: ADD_LAYERS_FOR_EVENT,
      activeString: state.compare.activeString,
      layers: newLayers,
    });
  };
}
export function addLayer(id, spec) {
  spec = spec || {};
  googleTagManager.pushEvent({
    event: 'layer_added',
    layers: {
      id,
    },
  });
  return (dispatch, getState) => {
    const state = getState();
    const { layers, compare, proj } = state;
    const { activeString } = compare;
    const layerObj = getLayersSelector(
      layers[activeString],
      { group: 'all' },
      state,
    );
    const newLayers = addLayerSelector(
      id,
      spec,
      layers[activeString],
      layers.layerConfig,
      layerObj.overlays.length || 0,
      proj.id,
    );

    dispatch({
      type: ADD_LAYER,
      id,
      activeString,
      layers: newLayers,
    });
  };
}
export function clearGraticule() {
  return (dispatch) => {
    dispatch(toggleVisibility('Graticule', false));
  };
}
export function refreshGraticule() {
  return (dispatch) => {
    dispatch(toggleVisibility('Graticule', true));
  };
}
export function initSecondLayerGroup() {
  return {
    type: INIT_SECOND_LAYER_GROUP,
  };
}
export function reorderLayers(layerArray) {
  return {
    type: REORDER_LAYER_GROUP,
    layers: layerArray,
  };
}

export function layerHover(id, isMouseOver) {
  return {
    type: ON_LAYER_HOVER,
    id,
    active: isMouseOver,
  };
}
export function toggleVisibility(id, visible) {
  return (dispatch, getState) => {
    const { layers, compare } = getState();
    const activeString = compare.isCompareA ? 'active' : 'activeB';
    const index = lodashFindIndex(layers[activeString], {
      id,
    });

    dispatch({
      type: TOGGLE_LAYER_VISIBILITY,
      id,
      index,
      visible,
      activeString,
    });
  };
}
export function removeLayer(id) {
  return (dispatch, getState) => {
    const { layers, compare, data } = getState();
    const { activeString } = compare;
    const index = lodashFindIndex(layers[activeString], {
      id,
    });
    if (index === -1) {
      return console.warn(`Invalid layer ID: ${id}`);
    }

    const def = layers[activeString][index];
    if (def.product && def.product === data.selectedProduct) {
      dispatch(selectProduct('')); // Clear selected Data product
    }
    dispatch({
      type: REMOVE_LAYER,
      id,
      index,
      activeString,
      def,
    });
  };
}
export function setOpacity(id, opacity) {
  return (dispatch, getState) => {
    const { layers, compare } = getState();
    const activeString = compare.isCompareA ? 'active' : 'activeB';
    const index = lodashFindIndex(layers[activeString], {
      id,
    });
    if (index === -1) {
      return console.warn(`Invalid layer ID: ${id}`);
    }

    dispatch({
      type: UPDATE_OPACITY,
      id,
      index,
      opacity,
      activeString,
    });
  };
}

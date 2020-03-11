import { findIndex as lodashFindIndex } from 'lodash';
import {
  addLayer as addLayerSelector,
  resetLayers as resetLayersSelector,
  getLayers as getLayersSelector,
  activateLayersForEventCategory as activateLayersForEventCategorySelector
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
  UPDATE_GRANULE_LAYER_DATES,
  RESET_GRANULE_LAYER_DATES,
  UPDATE_GRANULE_CMR_GEOMETRY,
  TOGGLE_HOVERED_GRANULE
} from './constants';
import { selectProduct } from '../data/actions';

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
export function activateLayersForEventCategory(activeLayers) {
  return (dispatch, getState) => {
    const state = getState();
    const newLayers = activateLayersForEventCategorySelector(
      activeLayers,
      state
    );

    dispatch({
      type: ADD_LAYERS_FOR_EVENT,
      activeString: state.compare.activeString,
      layers: newLayers
    });
  };
}
export function addLayer(id, spec) {
  spec = spec || {};
  return (dispatch, getState) => {
    const state = getState();
    const { layers, compare, proj } = state;

    const activeString = compare.activeString;
    const layerObj = getLayersSelector(
      layers[activeString],
      { group: 'all' },
      state
    );
    const newLayers = addLayerSelector(
      id,
      spec,
      layers[activeString],
      layers.layerConfig,
      layerObj.overlays.length || 0,
      proj.id
    );

    dispatch({
      type: ADD_LAYER,
      id,
      activeString,
      layers: newLayers
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
    type: INIT_SECOND_LAYER_GROUP
  };
}
export function reorderLayers(layerArray) {
  return {
    type: REORDER_LAYER_GROUP,
    layers: layerArray
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
    const activeString = compare.isCompareA ? 'active' : 'activeB';
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
    const { layers, compare, data } = getState();
    const activeString = compare.activeString;
    const index = lodashFindIndex(layers[activeString], {
      id: id
    });
    if (index === -1) {
      return console.warn('Invalid layer ID: ' + id);
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
      def
    });
  };
}
export function updateGranuleCMRGeometry(id, projection, geometry) {
  return (dispatch, getState) => {
    const { compare } = getState();
    const activeString = compare.activeString;
    dispatch({
      type: UPDATE_GRANULE_CMR_GEOMETRY,
      id,
      activeKey: activeString,
      proj: projection,
      geometry
    });
  };
}
export function updateGranuleLayerDates(dates, id, projection, count) {
  return (dispatch, getState) => {
    const { compare } = getState();
    const activeString = compare.activeString;
    dispatch({
      type: UPDATE_GRANULE_LAYER_DATES,
      id,
      activeKey: activeString,
      dates,
      proj: projection,
      count
    });
  };
}
export function resetGranuleLayerDates(id, projection) {
  return (dispatch, getState) => {
    const { compare } = getState();
    const activeString = compare.activeString;
    dispatch({
      type: RESET_GRANULE_LAYER_DATES,
      id,
      activeKey: activeString,
      proj: projection
    });
  };
}
export function toggleHoveredGranule(id, projection, granuleDate) {
  return (dispatch, getState) => {
    const { compare } = getState();
    const activeString = compare.activeString;
    const hoveredGranule = granuleDate ? { granuleDate, activeString, projection, id } : null;
    dispatch({
      type: TOGGLE_HOVERED_GRANULE,
      hoveredGranule,
      projection,
      id,
      activeString
    });
  };
}
export function setOpacity(id, opacity) {
  return (dispatch, getState) => {
    const { layers, compare } = getState();
    const activeString = compare.isCompareA ? 'active' : 'activeB';
    const index = lodashFindIndex(layers[activeString], {
      id: id
    });
    if (index === -1) {
      return console.warn('Invalid layer ID: ' + id);
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

import { findIndex as lodashFindIndex } from 'lodash';
import googleTagManager from 'googleTagManager';
import update from 'immutability-helper';
import {
  addLayer as addLayerSelector,
  resetLayers as resetLayersSelector,
  getLayers as getLayersSelector,
  getActiveLayers as getActiveLayersSelector,
  getActiveLayersMap,
  activateLayersForEventCategory as activateLayersForEventCategorySelector,
} from './selectors';
import {
  RESET_LAYERS,
  ADD_LAYER,
  INIT_SECOND_LAYER_GROUP,
  REORDER_LAYERS,
  REORDER_OVERLAY_GROUPS,
  ON_LAYER_HOVER,
  TOGGLE_LAYER_VISIBILITY,
  TOGGLE_COLLAPSE_OVERLAY_GROUP,
  TOGGLE_OVERLAY_GROUP_VISIBILITY,
  TOGGLE_OVERLAY_GROUPS,
  REMOVE_LAYER,
  REMOVE_GROUP,
  UPDATE_OPACITY,
  ADD_LAYERS_FOR_EVENT,
} from './constants';
import { selectProduct } from '../data/actions';
import { updateRecentLayers } from '../product-picker/util';
import { getOverlayGroups } from './util';

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

export function initSecondLayerGroup() {
  return {
    type: INIT_SECOND_LAYER_GROUP,
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

export function toggleOverlayGroups() {
  return (dispatch, getState) => {
    const state = getState();
    const { activeString } = state.compare;
    const { groupOverlays, layers, overlayGroups } = state.layers[activeString];
    const getLayersFromGroups = (groups) => {
      const baselayers = getLayersSelector(state, { group: 'baselayers' });
      const activeLayersMap = getActiveLayersMap(state);
      return groups
        ? groups.flatMap((g) => g.layers)
          .map((id) => activeLayersMap[id])
          .concat(baselayers)
        : [];
    };

    // Disabling Groups
    if (groupOverlays) {
      dispatch({
        type: TOGGLE_OVERLAY_GROUPS,
        activeString,
        groupOverlays: false,
        layers: getLayersFromGroups(overlayGroups),
        overlayGroups: [],
      });

    // Enabling Groups
    } else {
      const groups = getOverlayGroups(layers);
      dispatch({
        type: TOGGLE_OVERLAY_GROUPS,
        groupOverlays: true,
        activeString,
        layers: getLayersFromGroups(groups),
        overlayGroups: groups,
      });
    }
  };
}

export function addLayer(id, spec = {}) {
  googleTagManager.pushEvent({
    event: 'layer_added',
    layers: { id },
  });
  return (dispatch, getState) => {
    const state = getState();
    const {
      layers, compare, proj, config,
    } = state;
    const layerObj = layers.layerConfig[id];
    const { groupOverlays } = layers[compare.activeString];
    const activeLayers = getActiveLayersSelector(state);
    const overlays = getLayersSelector(state, { group: 'overlays' });
    const newLayers = addLayerSelector(
      id,
      spec,
      activeLayers,
      layers.layerConfig,
      overlays.length || 0,
      proj.id,
      groupOverlays,
    );
    const projections = Object.keys(config.projections);
    updateRecentLayers(layerObj, projections);
    dispatch({
      type: ADD_LAYER,
      id,
      activeString: compare.activeString,
      layers: newLayers,
    });
  };
}

export function reorderLayers(reorderedLayers) {
  return (dispatch, getState) => {
    const { compare } = getState();
    dispatch({
      type: REORDER_LAYERS,
      activeString: compare.activeString,
      layers: reorderedLayers,
    });
  };
}

export function reorderLayerGroups(layers, overlayGroups) {
  return (dispatch, getState) => {
    const { compare } = getState();
    dispatch({
      type: REORDER_OVERLAY_GROUPS,
      activeString: compare.activeString,
      layers,
      overlayGroups,
    });
  };
}

export function removeLayer(id) {
  return (dispatch, getState) => {
    const { compare, data } = getState();
    const { activeString } = compare;
    const activeLayers = getActiveLayersSelector(getState());
    const index = lodashFindIndex(activeLayers, { id });
    if (index === -1) {
      return console.warn(`Invalid layer ID: ${id}`);
    }
    const def = activeLayers[index];
    if (def.product && def.product === data.selectedProduct) {
      dispatch(selectProduct('')); // Clear selected Data product
    }
    dispatch({
      type: REMOVE_LAYER,
      activeString,
      layersToRemove: [def],
      layers: update(activeLayers, { $splice: [[index, 1]] }),
    });
  };
}

export function removeGroup(ids) {
  return (dispatch, getState) => {
    const { compare } = getState();
    const { activeString } = compare;
    const activeLayers = getActiveLayersSelector(getState());
    const layersToRemove = activeLayers.filter((l) => ids.includes(l.id));
    const newLayers = activeLayers.filter((l) => !ids.includes(l.id));

    dispatch({
      type: REMOVE_GROUP,
      activeString,
      layersToRemove,
      layers: newLayers,
    });
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
    const { compare } = getState();
    dispatch({
      type: TOGGLE_LAYER_VISIBILITY,
      id,
      visible,
      activeString: compare.activeString,
    });
  };
}

export function toggleGroupVisibility(ids, visible) {
  return (dispatch, getState) => {
    const { compare } = getState();
    const activeLayers = getActiveLayersSelector(getState());
    activeLayers.forEach((layer) => {
      if (ids.includes(layer.id)) {
        layer.visible = visible;
      }
    });
    dispatch({
      type: TOGGLE_OVERLAY_GROUP_VISIBILITY,
      layers: activeLayers,
      activeString: compare.activeString,
    });
  };
}

export function toggleGroupCollapsed(groupName, collapsed) {
  return (dispatch, getState) => {
    const state = getState();
    dispatch({
      type: TOGGLE_COLLAPSE_OVERLAY_GROUP,
      groupName,
      activeString: state.compare.activeString,
      collapsed,
    });
  };
}

export function setOpacity(id, opacity) {
  return (dispatch, getState) => {
    const { compare } = getState();
    const activeLayers = getActiveLayersSelector(getState());
    const index = lodashFindIndex(activeLayers, { id });
    if (index === -1) {
      return console.warn(`Invalid layer ID: ${id}`);
    }
    dispatch({
      type: UPDATE_OPACITY,
      id,
      opacity: Number(opacity),
      activeString: compare.activeString,
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

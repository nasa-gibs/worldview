import {
  findIndex as lodashFindIndex,
} from 'lodash';
import googleTagManager from 'googleTagManager';
import update from 'immutability-helper';
import {
  addLayer as addLayerSelector,
  getLayers as getLayersSelector,
  getActiveLayers as getActiveLayersSelector,
  activateLayersForEventCategory as activateLayersForEventCategorySelector,
  findEventLayers,
  getGranuleLayer,
  getGranuleLayersOfActivePlatform,
  getActiveGranuleLayers,
} from './selectors';
import {
  ADD_LAYER,
  INIT_SECOND_LAYER_GROUP,
  REORDER_LAYERS,
  REORDER_OVERLAY_GROUPS,
  TOGGLE_LAYER_VISIBILITY,
  TOGGLE_COLLAPSE_OVERLAY_GROUP,
  TOGGLE_OVERLAY_GROUP_VISIBILITY,
  TOGGLE_OVERLAY_GROUPS,
  REMOVE_LAYER,
  REMOVE_GROUP,
  UPDATE_OPACITY,
  ADD_LAYERS_FOR_EVENT,
  ADD_GRANULE_LAYER_DATES,
  UPDATE_GRANULE_LAYER_OPTIONS,
  UPDATE_GRANULE_LAYER_GEOMETRY,
  RESET_GRANULE_LAYER_OPTIONS,
  CHANGE_GRANULE_SATELLITE_INSTRUMENT_GROUP,
} from './constants';
import { updateRecentLayers } from '../product-picker/util';
import { getOverlayGroups, getLayersFromGroups } from './util';
import safeLocalStorage from '../../util/local-storage';
import { getGranuleFootprints } from '../../map/granule/util';

export function initSecondLayerGroup() {
  return {
    type: INIT_SECOND_LAYER_GROUP,
  };
}

export function activateLayersForEventCategory(category) {
  return (dispatch, getState) => {
    const state = getState();

    const originalLayers = state.layers.active.layers;
    const newLayers = activateLayersForEventCategorySelector(state, category);
    const overlayGroups = getOverlayGroups(newLayers);

    const newEventLayers = findEventLayers(originalLayers, newLayers);
    overlayGroups.forEach((group) => { group.collapsed = true; });

    dispatch({
      type: ADD_LAYERS_FOR_EVENT,
      activeString: state.compare.activeString,
      layers: newLayers,
      overlayGroups,
      eventLayers: newEventLayers,
    });
  };
}

export function toggleOverlayGroups() {
  return (dispatch, getState) => {
    const state = getState();
    const { activeString } = state.compare;
    const {
      groupOverlays,
      layers,
      prevLayers,
      overlayGroups,
    } = state.layers[activeString];
    const { GROUP_OVERLAYS } = safeLocalStorage.keys;

    // Disabling Groups
    if (groupOverlays) {
      safeLocalStorage.setItem(GROUP_OVERLAYS, 'disabled');
      const ungroupedLayers = prevLayers && prevLayers.length
        ? prevLayers
        : getLayersFromGroups(state, overlayGroups);

      dispatch({
        type: TOGGLE_OVERLAY_GROUPS,
        activeString,
        groupOverlays: false,
        layers: ungroupedLayers,
        overlayGroups: [],
      });

    // Enabling Groups
    } else {
      safeLocalStorage.removeItem(GROUP_OVERLAYS);
      const groups = getOverlayGroups(layers);
      dispatch({
        type: TOGGLE_OVERLAY_GROUPS,
        activeString,
        groupOverlays: true,
        layers: getLayersFromGroups(state, groups),
        overlayGroups: groups,
        prevLayers: layers,
      });
    }
  };
}

export function addLayer(id) {
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
      {},
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

export function reorderOverlayGroups(layers, overlayGroups) {
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
    const state = getState();
    const { compare } = state;
    const { activeString } = compare;
    const activeLayers = getActiveLayersSelector(state);
    const granuleLayers = getActiveGranuleLayers(state);
    const index = lodashFindIndex(activeLayers, { id });
    if (index === -1) {
      return console.warn(`Invalid layer ID: ${id}`);
    }
    const def = activeLayers[index];
    dispatch({
      type: REMOVE_LAYER,
      activeString,
      layersToRemove: [def],
      layers: update(activeLayers, { $splice: [[index, 1]] }),
      granuleLayers: update(granuleLayers, { $unset: [id] }),
    });
  };
}

export function removeGroup(ids) {
  return (dispatch, getState) => {
    const state = getState();
    const { compare } = state;
    const { activeString } = compare;
    const activeLayers = getActiveLayersSelector(state);
    const granuleLayers = getActiveGranuleLayers(state);
    const layersToRemove = activeLayers.filter((l) => ids.includes(l.id));
    const newLayers = activeLayers.filter((l) => !ids.includes(l.id));

    dispatch({
      type: REMOVE_GROUP,
      activeString,
      layersToRemove,
      layers: newLayers,
      granuleLayers: update(granuleLayers, { $unset: [ids] }),
    });
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

export function hideLayers(layers) {
  return (dispatch) => {
    layers.forEach((obj) => {
      dispatch(toggleVisibility(obj.id, false));
    });
  };
}

export function showLayers(layers) {
  return (dispatch) => {
    layers.forEach((obj) => {
      dispatch(toggleVisibility(obj.id, true));
    });
  };
}

export function updateGranuleLayerState(layer) {
  return (dispatch, getState) => {
    const state = getState();
    const {
      id, def: { endDate, subtitle }, reorderedGranules, granuleDates,
    } = layer.wv;

    const mostRecentGranuleDate = granuleDates[0];
    const isMostRecentDateOutOfRange = new Date(mostRecentGranuleDate) > new Date(endDate);
    const updatedDates = isMostRecentDateOutOfRange ? [] : reorderedGranules || granuleDates;
    const granuleFootprints = getGranuleFootprints(layer);
    const existingLayer = getGranuleLayer(state, id);

    if (existingLayer) {
      dispatch(updateGranuleLayerGeometry(layer, updatedDates, granuleFootprints));
    }
    dispatch(addGranuleLayerDates(layer, granuleFootprints, `${subtitle}`));
  };
}

function updateGranuleLayerGeometry(layer, dates, granuleGeometry) {
  return (dispatch, getState) => {
    const { compare, layers } = getState();
    const { activeString } = compare;
    const { id, count } = layer.wv;
    const layerDef = layers.layerConfig[id];
    const granulePlatform = `${layerDef.subtitle}`;
    const activeSatelliteInstrumentGroup = layers[activeString].granulePlatform;
    const activeGeometry = layers.granuleFootprints;

    // determine if active satellite instrument, then update global geometry,
    // else use current global geometry
    const newGranuleGeometry = activeSatelliteInstrumentGroup === granulePlatform
      ? granuleGeometry
      : activeGeometry;

    dispatch({
      type: UPDATE_GRANULE_LAYER_GEOMETRY,
      id,
      activeKey: activeString,
      granuleFootprints: newGranuleGeometry,
      dates,
      count,
    });
  };
}

function addGranuleLayerDates(layer, granuleFootprints, granulePlatform) {
  return (dispatch, getState) => {
    const { compare: { activeString } } = getState();
    const { id, granuleDates, count } = layer.wv;

    dispatch({
      type: ADD_GRANULE_LAYER_DATES,
      id,
      activeKey: activeString,
      dates: granuleDates,
      granuleFootprints,
      granulePlatform,
      count,
    });
  };
}

export function updateGranuleLayerOptions(dates, def, count) {
  return (dispatch, getState) => {
    const state = getState();
    const { activeString } = state.compare;

    const granulePlatform = def.subtitle;
    const activeGranuleLayers = getActiveGranuleLayers(state);
    const platformLayers = getGranuleLayersOfActivePlatform(granulePlatform, activeGranuleLayers);

    platformLayers.forEach((layer) => {
      dispatch({
        type: UPDATE_GRANULE_LAYER_OPTIONS,
        id: layer,
        activeKey: activeString,
        dates,
        count,
      });
    });
  };
}

export function resetGranuleLayerDates(id) {
  return (dispatch, getState) => {
    const { compare } = getState();
    const { activeString } = compare;
    dispatch({
      type: RESET_GRANULE_LAYER_OPTIONS,
      id,
      activeKey: activeString,
    });
  };
}

export function changeGranuleSatelliteInstrumentGroup(id, granulePlatform) {
  return (dispatch, getState) => {
    const { compare } = getState();
    const { activeString } = compare;
    const { geometry } = getGranuleLayer(getState(), id);

    dispatch({
      type: CHANGE_GRANULE_SATELLITE_INSTRUMENT_GROUP,
      granulePlatform,
      geometry,
      activeKey: activeString,
    });
  };
}

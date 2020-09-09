import initSearch from './search-config';
import {
  getRecentLayers,
  clearRecentLayers as clearRecentFromLocalStorage,
  clearSingleRecentLayer as clearSingleRecentLayerFromLocalStorage,
} from './util';

import {
  SAVE_SEARCH_STATE,
  INIT_STATE,
  COLLAPSE_FACET,
  SELECT_CATEGORY_TYPE,
  SELECT_MEASUREMENT,
  SELECT_SOURCE,
  SELECT_LAYER,
  SHOW_MEASUREMENTS,
  TOGGLE_FEATURED_TAB,
  TOGGLE_MEASUREMENTS_TAB,
  TOGGLE_RECENT_LAYERS_TAB,
  TOGGLE_SEARCH_MODE,
  TOGGLE_CATEGORY_MODE,
  TOGGLE_MOBILE_FACETS,
  CLEAR_RECENT_LAYERS,
  CLEAR_SINGLE_RECENT_LAYER,
  RESET_STATE,
} from './constants';

export function initState() {
  return (dispatch, getState) => {
    const state = getState();
    const projection = state.proj.id;
    dispatch({
      type: INIT_STATE,
      searchConfig: initSearch(state),
      projection,
    });
  };
}

export function saveSearchState(filters, searchTerm, searchConfig) {
  return {
    type: SAVE_SEARCH_STATE,
    filters,
    searchTerm,
    searchConfig,
  };
}

export function collapseFacet(field) {
  return {
    type: COLLAPSE_FACET,
    field,
  };
}

export function selectCategoryType(value) {
  return {
    type: SELECT_CATEGORY_TYPE,
    value,
  };
}

export function selectMeasurement(value) {
  return {
    type: SELECT_MEASUREMENT,
    value,
  };
}

export function selectSource(value) {
  return {
    type: SELECT_SOURCE,
    value,
  };
}
export function selectLayer(value) {
  return {
    type: SELECT_LAYER,
    value,
  };
}

export function showMeasurements(value) {
  return {
    type: SHOW_MEASUREMENTS,
    value,
  };
}

export function toggleFeatureTab() {
  return (dispatch, getState) => {
    dispatch({
      type: TOGGLE_FEATURED_TAB,
      config: getState().config,
    });
  };
}

export function toggleMeasurementsTab() {
  return {
    type: TOGGLE_MEASUREMENTS_TAB,
  };
}

export function toggleRecentLayersTab() {
  return (dispatch, getState) => {
    const { layers, proj } = getState();
    const { layerConfig } = layers;

    dispatch({
      type: TOGGLE_RECENT_LAYERS_TAB,
      recentLayers: getRecentLayers(layerConfig, proj.id),
    });
  };
}

export function toggleSearchMode() {
  return {
    type: TOGGLE_SEARCH_MODE,
  };
}

export function toggleCategoryMode() {
  return {
    type: TOGGLE_CATEGORY_MODE,
  };
}

export function toggleMobileFacets() {
  return {
    type: TOGGLE_MOBILE_FACETS,
  };
}

export function clearRecentLayers() {
  clearRecentFromLocalStorage();
  return {
    type: CLEAR_RECENT_LAYERS,
  };
}

export function clearSingleRecentLayer(layer) {
  return (dispatch, getState) => {
    const { layers, proj, config } = getState();
    const { layerConfig } = layers;
    const projections = Object.keys(config.projections);

    clearSingleRecentLayerFromLocalStorage(layer, projections);

    dispatch({
      type: CLEAR_SINGLE_RECENT_LAYER,
      recentLayers: getRecentLayers(layerConfig, proj.id),
    });
  };
}

export function resetProductPickerState(projection) {
  return {
    type: RESET_STATE,
    projection,
  };
}

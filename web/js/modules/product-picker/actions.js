import initSearch from './search-config';
import {
  SAVE_SEARCH_STATE,
  INIT_SEARCH_STATE,
  COLLAPSE_FACET,
  SELECT_CATEGORY,
  SELECT_MEASUREMENT,
  SELECT_SOURCE,
  SELECT_LAYER,
  SHOW_MEASUREMENTS,
  TOGGLE_FEATURED_TAB,
  TOGGLE_RECENT_LAYERS,
  TOGGLE_SEARCH_MODE,
  TOGGLE_CATEGORY_MODE,
  TOGGLE_MOBILE_FACETS,
  RESET_STATE,
} from './constants';

export function initSearchState() {
  return (dispatch, getState) => {
    dispatch({
      type: INIT_SEARCH_STATE,
      searchConfig: initSearch(getState()),
    });
  };
}
export function saveSearchState(filters, searchTerm) {
  return {
    type: SAVE_SEARCH_STATE,
    filters,
    searchTerm,
  };
}
export function collapseFacet(field) {
  return {
    type: COLLAPSE_FACET,
    field,
  };
}
export function selectCategory(value) {
  return {
    type: SELECT_CATEGORY,
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
export function toggleRecentLayersTab() {
  return {
    type: TOGGLE_RECENT_LAYERS,
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
export function resetProductPickerState(projection) {
  return {
    type: RESET_STATE,
    projection,
  };
}

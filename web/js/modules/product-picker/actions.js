import { getSearchConfig } from './selectors';
import {
  SAVE_SEARCH_STATE,
  INIT_SEARCH_STATE,
  SELECT_CATEGORY,
  SELECT_MEASUREMENT,
  SELECT_SOURCE,
  SELECT_LAYER,
  SHOW_MEASUREMENTS,
  TOGGLE_FEATURED_TAB,
  TOGGLE_SEARCH_MODE,
  TOGGLE_CATEGORY_MODE,
  UPDATE_LIST_SCROLL_TOP,
  RESET_STATE,
} from './constants';

export function initSearchState() {
  return (dispatch, getState) => {
    dispatch({
      type: INIT_SEARCH_STATE,
      searchConfig: getSearchConfig(getState()),
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
export function updateListScrollTop(value) {
  return {
    type: UPDATE_LIST_SCROLL_TOP,
    value,
  };
}
export function resetProductPickerState(projection) {
  return {
    type: RESET_STATE,
    projection,
  };
}

import {
  UPDATE_PRODUCT_PICKER,
  UPDATE_LIST_SCROLL_TOP,
  RESET_STATE
} from './constants';

import { assign as lodashAssign } from 'lodash';

export const productPickerState = {
  listType: 'category',
  category: undefined,
  filteredRows: [],
  searchResultRows: undefined,
  numRowsFilteredOut: undefined,
  inputValue: '',
  filterByAvailable: true,
  listScrollTop: 0,
  selectedLayer: undefined,
  selectedMeasurement: undefined,
  selectedMeasurementSourceIndex: 0
};

export function getInitialState(config) {
  return lodashAssign({}, productPickerState, {
    categoryType: Object.keys(config.categories)[1]
  });
};

export function productPickerReducer(state = productPickerState, action) {
  switch (action.type) {
    case UPDATE_PRODUCT_PICKER:
      return lodashAssign({}, state, action.value);
    case UPDATE_LIST_SCROLL_TOP:
      return lodashAssign({}, state, {
        listScrollTop: action.value
      });
    case RESET_STATE:
      return lodashAssign({}, state, productPickerState);
    default:
      return state;
  }
}

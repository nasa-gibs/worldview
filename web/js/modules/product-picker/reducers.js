import {
  UPDATE_PRODUCT_PICKER
} from './constants';

import { assign as lodashAssign } from 'lodash';

export const productPickerState = {
  listType: 'category',
  category: undefined,
  selectedLayer: undefined,
  selectedMeasurement: undefined,
  measurementSourceIndex: 0,
  filteredRows: undefined,
  searchResultRows: undefined,
  numRowsFilteredOut: undefined,
  inputValue: '',
  filterByAvailable: true
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
    default:
      return state;
  }
}

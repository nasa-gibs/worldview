import {
  UPDATE_PRODUCT_PICKER,
  UPDATE_LIST_SCROLL_TOP,
  RESET_STATE,
} from './constants';

const projToListType = {
  arctic: 'measurements',
  antarctic: 'measurements',
  geographic: 'category',
};

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
  selectedMeasurementSourceIndex: 0,
};

export function getInitialState(config) {
  return { ...productPickerState, categoryType: Object.keys(config.categories)[1] };
}

export function productPickerReducer(state = productPickerState, action) {
  switch (action.type) {
    case UPDATE_PRODUCT_PICKER:
      return { ...state, ...action.value };
    case UPDATE_LIST_SCROLL_TOP:
      return { ...state, listScrollTop: action.value };
    case RESET_STATE:
      var listType = projToListType[action.value];
      var newState = { ...productPickerState, listType };
      return { ...state, ...newState };
    default:
      return state;
  }
}

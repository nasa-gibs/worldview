// eslint-disable-next-line import/no-unresolved
import googleTagManager from 'googleTagManager';
import {
  UPDATE_PRODUCT_PICKER,
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

const projToListType = {
  arctic: 'measurements',
  antarctic: 'measurements',
  geographic: 'category',
};

export const productPickerState = {
  mode: 'category',
  category: undefined,
  results: [],
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
  return {
    ...productPickerState,
    categoryType: Object.keys(config.categories)[1],
  };
}

export function productPickerReducer(state = productPickerState, action) {
  switch (action.type) {
    case UPDATE_PRODUCT_PICKER:
      return {
        ...state,
        ...action.value,
      };
    case SELECT_CATEGORY: {
      googleTagManager.pushEvent({
        event: 'layers_meta_category',
        layers: {
          meta_category: action.value,
        },
      });
      return {
        ...state,
        mode: 'category',
        categoryType: action.value,
        selectedMeasurement: null,
      };
    }
    case SELECT_MEASUREMENT: {
      return {
        ...state,
        selectedMeasurement: action.value !== state.selectedMeasurement ? action.value : null,
        selectedMeasurementSourceIndex: 0,
      };
    }
    case SELECT_SOURCE:
      return {
        ...state,
        selectedMeasurementSourceIndex: action.value,
      };
    case SELECT_LAYER:
      return {
        ...state,
        selectedLayer: action.value,
      };
    case SHOW_MEASUREMENTS: {
      const { category, selectedMeasurement } = action.value;
      googleTagManager.pushEvent({
        event: 'layers_category',
        layers: {
          category: category.title,
        },
      });
      return {
        ...state,
        mode: 'measurements',
        category,
        selectedMeasurement,
      };
    }
    case TOGGLE_SEARCH_MODE:
      return {
        ...state,
        mode: 'search',
        selectedLayer: null,
      };
    case TOGGLE_FEATURED_TAB: {
      const { config } = action;
      const category = config.categories.featured.All;
      const selectedMeasurement = category.measurements[0];
      const selectedMeasurementId = config.measurements[selectedMeasurement].id;
      return {
        ...state,
        categoryType: 'featured',
        category,
        mode: 'measurements',
        selectedMeasurement: selectedMeasurementId,
      };
    }
    case TOGGLE_CATEGORY_MODE:
      return {
        ...state,
        mode: 'category',
        selectedLayer: null,
        selectedMeasurement: null,
        selectedMeasurementSourceIndex: 0,
        listScrollTop: 0,
      };
    case UPDATE_LIST_SCROLL_TOP:
      return {
        ...state,
        listScrollTop: action.value,
      };
    case RESET_STATE: {
      const listType = projToListType[action.value];
      const newState = {
        ...productPickerState,
        listType,
      };
      return { ...state, ...newState };
    }
    default:
      return state;
  }
}

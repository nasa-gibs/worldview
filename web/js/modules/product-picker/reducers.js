// eslint-disable-next-line import/no-unresolved
import googleTagManager from 'googleTagManager';

import {
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
  INIT_SEARCH_STATE,
  SAVE_SEARCH_STATE,
} from './constants';

export const productPickerState = {
  mode: 'category',
  category: undefined,
  categoryType: 'hazards and disasters',
  filters: [],
  searchTerm: '',
  selectedLayer: undefined,
  selectedMeasurement: undefined,
  selectedMeasurementSourceIndex: 0,
  searchConfig: undefined,
  results: [],
  // searchResultRows: undefined,
  // numRowsFilteredOut: undefined,
  // filterByAvailable: true,
  // listScrollTop: 0,
};

export function getInitialState(config) {
  return productPickerState;
}

export function productPickerReducer(state = productPickerState, action) {
  switch (action.type) {
    case INIT_SEARCH_STATE: {
      const { searchConfig } = action;
      return {
        ...state,
        searchConfig,
      };
    }

    case SAVE_SEARCH_STATE: {
      const { filters, searchTerm } = action;
      return {
        ...state,
        filters,
        searchTerm,
        searchConfig: null,
      };
    }

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

    case SELECT_SOURCE: {
      return {
        ...state,
        selectedMeasurementSourceIndex: action.value,
      };
    }

    case SELECT_LAYER: {
      return {
        ...state,
        selectedLayer: action.value,
      };
    }

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

    case TOGGLE_SEARCH_MODE: {
      return {
        ...state,
        mode: 'search',
        selectedLayer: null,
      };
    }

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

    case TOGGLE_CATEGORY_MODE: {
      return {
        ...productPickerState,
        mode: 'category',
      };
    }

    // TODO this one unused?
    case UPDATE_LIST_SCROLL_TOP: {
      return {
        ...state,
        listScrollTop: action.value,
      };
    }

    case RESET_STATE: {
      // When switching projections: if we were in 'search'
      // mode stay there.  Otherwise if in a polar projection
      // show 'measurement' rather than 'category'
      const projToListMode = {
        arctic: 'measurements',
        antarctic: 'measurements',
        geographic: 'category',
      };
      const modeForProj = projToListMode[action.projection];
      const prevMode = state.mode;
      const newState = {
        ...state,
        mode: prevMode === 'search' ? prevMode : modeForProj,
        filters: [],
        searchTerm: '',
      };
      return { ...state, ...newState };
    }
    default:
      return state;
  }
}

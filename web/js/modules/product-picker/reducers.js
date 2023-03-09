import googleTagManager from 'googleTagManager';
import { get as lodashGet } from 'lodash';

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
  PROJ_SWITCH,
  RESET_STATE,
} from './constants';

let CATEGORY_GROUP_ORDER = [];

const productPickerState = {
  mode: 'category',
  category: undefined,
  categoryType: undefined,
  filters: [],
  showMobileFacets: true,
  searchTerm: '',
  selectedLayer: undefined,
  selectedMeasurement: undefined,
  selectedMeasurementSourceIndex: 0,
  searchConfig: undefined,
  collapsedFacets: {},
  recentLayers: [],
};


export function getInitialState({ categories, categoryGroupOrder }) {
  if (Object.keys(categories).length !== categoryGroupOrder.length) {
    throw new Error(
      'Number of category groups did not match defined category group order. '
      + '\nCheck categoryGroupOrder.json',
    );
  }

  CATEGORY_GROUP_ORDER = categoryGroupOrder;

  return {
    ...productPickerState,
    categoryType: CATEGORY_GROUP_ORDER[0],
  };
}

export function productPickerReducer(state = productPickerState, action) {
  switch (action.type) {
    case INIT_STATE: {
      const { searchConfig, projection } = action;
      const { mode } = state;
      return {
        ...state,
        searchConfig,
        mode: mode || (projection === 'geographic' ? 'category' : 'measurements'),
      };
    }

    case SAVE_SEARCH_STATE: {
      const { filters, searchTerm, searchConfig } = action;
      return {
        ...state,
        filters,
        searchTerm,
        searchConfig,
      };
    }

    case COLLAPSE_FACET: {
      const { field } = action;
      const { collapsedFacets } = state;
      return {
        ...state,
        collapsedFacets: {
          ...state.collapsedFacets,
          [field]: !collapsedFacets[field],
        },
      };
    }

    case SELECT_CATEGORY_TYPE: {
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
        category: null,
        selectedLayer: null,
        selectedMeasurement: null,
        selectedMeasurementSourceIndex: 0,
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
          category: category && category.title,
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
        showMobileFacets: true,
        category: null,
        categoryType: CATEGORY_GROUP_ORDER[0],
        selectedMeasurementSourceIndex: 0,
      };
    }

    case TOGGLE_FEATURED_TAB: {
      const { config } = action;
      const category = lodashGet(config, 'categories.featured.All');
      const selectedMeasurement = lodashGet(category, 'measurements[0]');
      const selectedMeasurementId = lodashGet(config, `measurements[${selectedMeasurement}].id`);
      return {
        ...state,
        categoryType: 'featured',
        category: null,
        mode: 'measurements',
        selectedLayer: null,
        selectedMeasurement: selectedMeasurementId,
        selectedMeasurementSourceIndex: 0,
      };
    }

    case TOGGLE_MEASUREMENTS_TAB: {
      return {
        ...state,
        mode: 'measurements',
        categoryType: 'measurements',
      };
    }

    case TOGGLE_RECENT_LAYERS_TAB: {
      const { recentLayers } = action;
      return {
        ...state,
        category: null,
        categoryType: 'recent',
        recentLayers,
        selectedMeasurement: null,
        selectedMeasurementSourceIndex: 0,
      };
    }

    case TOGGLE_CATEGORY_MODE: {
      return {
        ...state,
        mode: 'category',
        category: null,
        selectedLayer: null,
        selectedMeasurement: null,
        selectedMeasurementSourceIndex: 0,
      };
    }

    case TOGGLE_MOBILE_FACETS: {
      return {
        ...state,
        showMobileFacets: !state.showMobileFacets,
      };
    }

    case CLEAR_RECENT_LAYERS: {
      return {
        ...state,
        recentLayers: [],
      };
    }

    case CLEAR_SINGLE_RECENT_LAYER: {
      const { recentLayers } = action;
      return {
        ...state,
        recentLayers,
      };
    }

    case PROJ_SWITCH: {
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
        selectedLayer: null,
        category: null,
        categoryType: action.projection === 'geographic' ? CATEGORY_GROUP_ORDER[0] : 'measurements',
        selectedMeasurement: null,
        selectedMeasurementSourceIndex: 0,
      };
      return {
        ...state,
        ...newState,
      };
    }

    // When running the product picker tutorial, need to start with a known clear state
    case RESET_STATE: {
      return {
        ...productPickerState,
        categoryType: CATEGORY_GROUP_ORDER[0],
      };
    }

    default:
      return state;
  }
}

import googleTagManager from 'googleTagManager';
import { get as lodashGet } from 'lodash';

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
  CLEAR_RECENT_LAYERS,
  CLEAR_SINGLE_RECENT_LAYER,
  RESET_STATE,
} from './constants';

export const productPickerState = {
  mode: 'category',
  category: undefined,
  categoryType: 'hazards and disasters',
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
        selectedLayer: null,
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
        showMobileFacets: true,
        category: null,
        categoryType: 'hazards and disasters',
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
        category,
        mode: 'measurements',
        selectedMeasurement: selectedMeasurementId,
        selectedLayer: null,
      };
    }

    case TOGGLE_RECENT_LAYERS: {
      const { recentLayers } = action;
      return {
        ...state,
        categoryType: 'recent',
        recentLayers,
      };
    }

    case TOGGLE_CATEGORY_MODE: {
      return {
        ...state,
        mode: 'category',
        selectedLayer: null,
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
        selectedLayer: null,
        category: null,
        selectedMeasurement: null,
        selectedMeasurementSourceIndex: 0,
      };
      return { ...state, ...newState };
    }
    default:
      return state;
  }
}

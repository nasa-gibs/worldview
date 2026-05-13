import { productPickerReducer, getInitialState } from './reducers';
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

jest.mock('googleTagManager', () => ({
  pushEvent: jest.fn(),
}), { virtual: true });

import googleTagManager from 'googleTagManager';

const baseState = {
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

describe('getInitialState', () => {
  it('returns state with first categoryGroupOrder entry as categoryType', () => {
    const result = getInitialState({
      categories: { science: {}, hazards: {} },
      categoryGroupOrder: ['science', 'hazards'],
    });
    expect(result.categoryType).toBe('science');
  });

  it('throws when categories length does not match categoryGroupOrder length', () => {
    expect(() =>
      getInitialState({
        categories: { science: {} },
        categoryGroupOrder: ['science', 'hazards'],
      }),
    ).toThrow('Number of category groups did not match defined category group order.');
  });

  it('returns productPickerState base properties', () => {
    const result = getInitialState({
      categories: { science: {} },
      categoryGroupOrder: ['science'],
    });
    expect(result.mode).toBe('category');
    expect(result.filters).toEqual([]);
    expect(result.recentLayers).toEqual([]);
  });
});

describe('productPickerReducer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getInitialState({
      categories: { science: {}, hazards: {} },
      categoryGroupOrder: ['science', 'hazards'],
    });
  });

  it('returns default state when no action matches', () => {
    const result = productPickerReducer(baseState, { type: '@@INIT' });
    expect(result).toEqual(baseState);
  });

  it('returns initial productPickerState when called with undefined state', () => {
    const result = productPickerReducer(undefined, { type: '@@INIT' });
    expect(result.mode).toBe('category');
    expect(result.filters).toEqual([]);
  });

  describe('INIT_STATE', () => {
    it('sets searchConfig and keeps existing mode when mode is set', () => {
      const state = { ...baseState, mode: 'search' };
      const searchConfig = { index: {} };
      const result = productPickerReducer(state, {
        type: INIT_STATE,
        searchConfig,
        projection: 'geographic',
      });
      expect(result.searchConfig).toBe(searchConfig);
      expect(result.mode).toBe('search');
    });

    it('sets mode to "category" for geographic projection when mode is empty', () => {
      const state = { ...baseState, mode: '' };
      const result = productPickerReducer(state, {
        type: INIT_STATE,
        searchConfig: {},
        projection: 'geographic',
      });
      expect(result.mode).toBe('category');
    });

    it('sets mode to "measurements" for non-geographic projection when mode is empty', () => {
      const state = { ...baseState, mode: '' };
      const result = productPickerReducer(state, {
        type: INIT_STATE,
        searchConfig: {},
        projection: 'arctic',
      });
      expect(result.mode).toBe('measurements');
    });
  });

  describe('SAVE_SEARCH_STATE', () => {
    it('updates filters, searchTerm, and searchConfig', () => {
      const filters = [{ field: 'category', value: 'Atmosphere' }];
      const searchTerm = 'aerosol';
      const searchConfig = { index: {} };
      const result = productPickerReducer(baseState, {
        type: SAVE_SEARCH_STATE,
        filters,
        searchTerm,
        searchConfig,
      });
      expect(result.filters).toBe(filters);
      expect(result.searchTerm).toBe(searchTerm);
      expect(result.searchConfig).toBe(searchConfig);
    });
  });

  describe('COLLAPSE_FACET', () => {
    it('toggles a facet field to true when previously undefined', () => {
      const result = productPickerReducer(baseState, {
        type: COLLAPSE_FACET,
        field: 'category',
      });
      expect(result.collapsedFacets.category).toBe(true);
    });

    it('toggles a facet field to false when previously true', () => {
      const state = { ...baseState, collapsedFacets: { category: true } };
      const result = productPickerReducer(state, {
        type: COLLAPSE_FACET,
        field: 'category',
      });
      expect(result.collapsedFacets.category).toBe(false);
    });

    it('toggles a facet field to true when previously false', () => {
      const state = { ...baseState, collapsedFacets: { category: false } };
      const result = productPickerReducer(state, {
        type: COLLAPSE_FACET,
        field: 'category',
      });
      expect(result.collapsedFacets.category).toBe(true);
    });
  });

  describe('SELECT_CATEGORY_TYPE', () => {
    it('sets mode to "category" and updates categoryType', () => {
      const result = productPickerReducer(baseState, {
        type: SELECT_CATEGORY_TYPE,
        value: 'hazards',
      });
      expect(result.mode).toBe('category');
      expect(result.categoryType).toBe('hazards');
      expect(result.category).toBeNull();
      expect(result.selectedLayer).toBeNull();
      expect(result.selectedMeasurement).toBeNull();
      expect(result.selectedMeasurementSourceIndex).toBe(0);
    });

    it('calls googleTagManager.pushEvent with the correct payload', () => {
      productPickerReducer(baseState, {
        type: SELECT_CATEGORY_TYPE,
        value: 'science',
      });
      expect(googleTagManager.pushEvent).toHaveBeenCalledWith({
        event: 'layers_meta_category',
        layers: { meta_category: 'science' },
      });
    });
  });

  describe('SELECT_MEASUREMENT', () => {
    it('sets selectedMeasurement when value differs from current', () => {
      const state = { ...baseState, selectedMeasurement: 'aerosol' };
      const result = productPickerReducer(state, {
        type: SELECT_MEASUREMENT,
        value: 'temperature',
      });
      expect(result.selectedMeasurement).toBe('temperature');
      expect(result.selectedMeasurementSourceIndex).toBe(0);
    });

    it('sets selectedMeasurement to null when value matches current (toggle off)', () => {
      const state = { ...baseState, selectedMeasurement: 'aerosol' };
      const result = productPickerReducer(state, {
        type: SELECT_MEASUREMENT,
        value: 'aerosol',
      });
      expect(result.selectedMeasurement).toBeNull();
      expect(result.selectedMeasurementSourceIndex).toBe(0);
    });
  });

  describe('SELECT_SOURCE', () => {
    it('updates selectedMeasurementSourceIndex', () => {
      const result = productPickerReducer(baseState, {
        type: SELECT_SOURCE,
        value: 3,
      });
      expect(result.selectedMeasurementSourceIndex).toBe(3);
    });
  });

  describe('SELECT_LAYER', () => {
    it('updates selectedLayer', () => {
      const result = productPickerReducer(baseState, {
        type: SELECT_LAYER,
        value: 'MODIS_Terra_CorrectedReflectance_TrueColor',
      });
      expect(result.selectedLayer).toBe('MODIS_Terra_CorrectedReflectance_TrueColor');
    });
  });

  describe('SHOW_MEASUREMENTS', () => {
    it('sets mode to "measurements" and updates category and selectedMeasurement', () => {
      const category = { title: 'Atmosphere' };
      const result = productPickerReducer(baseState, {
        type: SHOW_MEASUREMENTS,
        value: { category, selectedMeasurement: 'aerosol' },
      });
      expect(result.mode).toBe('measurements');
      expect(result.category).toBe(category);
      expect(result.selectedMeasurement).toBe('aerosol');
    });

    it('calls googleTagManager.pushEvent with category title', () => {
      const category = { title: 'Hazards' };
      productPickerReducer(baseState, {
        type: SHOW_MEASUREMENTS,
        value: { category, selectedMeasurement: null },
      });
      expect(googleTagManager.pushEvent).toHaveBeenCalledWith({
        event: 'layers_category',
        layers: { category: 'Hazards' },
      });
    });
  });

  describe('TOGGLE_SEARCH_MODE', () => {
    it('sets mode to "search" and resets related fields', () => {
      const state = {
        ...baseState,
        selectedLayer: 'some-layer',
        category: { title: 'Atmosphere' },
        selectedMeasurementSourceIndex: 2,
      };
      const result = productPickerReducer(state, { type: TOGGLE_SEARCH_MODE });
      expect(result.mode).toBe('search');
      expect(result.selectedLayer).toBeNull();
      expect(result.showMobileFacets).toBe(true);
      expect(result.category).toBeNull();
      expect(result.selectedMeasurementSourceIndex).toBe(0);
      expect(result.categoryType).toBe('science');
    });
  });

  describe('TOGGLE_FEATURED_TAB', () => {
    it('sets categoryType to "featured" and resolves selectedMeasurement from config', () => {
      const config = {
        categories: {
          featured: {
            All: { measurements: ['Aerosol Optical Depth'] },
          },
        },
        measurements: {
          'Aerosol Optical Depth': { id: 'aerosol-id' },
        },
      };
      const result = productPickerReducer(baseState, {
        type: TOGGLE_FEATURED_TAB,
        config,
      });
      expect(result.categoryType).toBe('featured');
      expect(result.category).toBeNull();
      expect(result.mode).toBe('measurements');
      expect(result.selectedLayer).toBeNull();
      expect(result.selectedMeasurement).toBe('aerosol-id');
      expect(result.selectedMeasurementSourceIndex).toBe(0);
    });

    it('handles missing featured config gracefully', () => {
      const result = productPickerReducer(baseState, {
        type: TOGGLE_FEATURED_TAB,
        config: {},
      });
      expect(result.categoryType).toBe('featured');
      expect(result.selectedMeasurement).toBeUndefined();
    });
  });

  describe('TOGGLE_MEASUREMENTS_TAB', () => {
    it('sets mode to "measurements" and categoryType to "measurements"', () => {
      const result = productPickerReducer(baseState, { type: TOGGLE_MEASUREMENTS_TAB });
      expect(result.mode).toBe('measurements');
      expect(result.categoryType).toBe('measurements');
    });
  });

  describe('TOGGLE_RECENT_LAYERS_TAB', () => {
    it('sets categoryType to "recent" and updates recentLayers', () => {
      const recentLayers = [{ id: 'layer1' }];
      const result = productPickerReducer(baseState, {
        type: TOGGLE_RECENT_LAYERS_TAB,
        recentLayers,
      });
      expect(result.categoryType).toBe('recent');
      expect(result.recentLayers).toBe(recentLayers);
      expect(result.category).toBeNull();
      expect(result.selectedMeasurement).toBeNull();
      expect(result.selectedMeasurementSourceIndex).toBe(0);
    });
  });

  describe('TOGGLE_CATEGORY_MODE', () => {
    it('sets mode to "category" and resets selection fields', () => {
      const state = {
        ...baseState,
        mode: 'search',
        category: { title: 'Atmosphere' },
        selectedLayer: 'layer1',
        selectedMeasurement: 'aerosol',
        selectedMeasurementSourceIndex: 2,
      };
      const result = productPickerReducer(state, { type: TOGGLE_CATEGORY_MODE });
      expect(result.mode).toBe('category');
      expect(result.category).toBeNull();
      expect(result.selectedLayer).toBeNull();
      expect(result.selectedMeasurement).toBeNull();
      expect(result.selectedMeasurementSourceIndex).toBe(0);
    });
  });

  describe('TOGGLE_MOBILE_FACETS', () => {
    it('toggles showMobileFacets from true to false', () => {
      const state = { ...baseState, showMobileFacets: true };
      const result = productPickerReducer(state, { type: TOGGLE_MOBILE_FACETS });
      expect(result.showMobileFacets).toBe(false);
    });

    it('toggles showMobileFacets from false to true', () => {
      const state = { ...baseState, showMobileFacets: false };
      const result = productPickerReducer(state, { type: TOGGLE_MOBILE_FACETS });
      expect(result.showMobileFacets).toBe(true);
    });
  });

  describe('CLEAR_RECENT_LAYERS', () => {
    it('resets recentLayers to empty array', () => {
      const state = { ...baseState, recentLayers: [{ id: 'layer1' }] };
      const result = productPickerReducer(state, { type: CLEAR_RECENT_LAYERS });
      expect(result.recentLayers).toEqual([]);
    });
  });

  describe('CLEAR_SINGLE_RECENT_LAYER', () => {
    it('replaces recentLayers with the provided list', () => {
      const recentLayers = [{ id: 'layer2' }];
      const state = { ...baseState, recentLayers: [{ id: 'layer1' }, { id: 'layer2' }] };
      const result = productPickerReducer(state, {
        type: CLEAR_SINGLE_RECENT_LAYER,
        recentLayers,
      });
      expect(result.recentLayers).toBe(recentLayers);
    });
  });

  describe('PROJ_SWITCH', () => {
    it('sets mode to "category" and categoryType to first group order for geographic', () => {
      const state = { ...baseState, mode: 'category' };
      const result = productPickerReducer(state, {
        type: PROJ_SWITCH,
        projection: 'geographic',
      });
      expect(result.mode).toBe('category');
      expect(result.categoryType).toBe('science');
      expect(result.filters).toEqual([]);
      expect(result.searchTerm).toBe('');
      expect(result.selectedLayer).toBeNull();
      expect(result.category).toBeNull();
      expect(result.selectedMeasurement).toBeNull();
      expect(result.selectedMeasurementSourceIndex).toBe(0);
    });

    it('sets mode to "measurements" for arctic projection', () => {
      const state = { ...baseState, mode: 'category' };
      const result = productPickerReducer(state, {
        type: PROJ_SWITCH,
        projection: 'arctic',
      });
      expect(result.mode).toBe('measurements');
      expect(result.categoryType).toBe('measurements');
    });

    it('sets mode to "measurements" for antarctic projection', () => {
      const state = { ...baseState, mode: 'category' };
      const result = productPickerReducer(state, {
        type: PROJ_SWITCH,
        projection: 'antarctic',
      });
      expect(result.mode).toBe('measurements');
      expect(result.categoryType).toBe('measurements');
    });

    it('preserves "search" mode when switching projections', () => {
      const state = { ...baseState, mode: 'search' };
      const result = productPickerReducer(state, {
        type: PROJ_SWITCH,
        projection: 'arctic',
      });
      expect(result.mode).toBe('search');
    });
  });

  describe('RESET_STATE', () => {
    it('resets to productPickerState with first categoryGroupOrder as categoryType', () => {
      const dirtyState = {
        ...baseState,
        mode: 'search',
        searchTerm: 'aerosol',
        selectedLayer: 'some-layer',
        filters: [{ field: 'category' }],
      };
      const result = productPickerReducer(dirtyState, { type: RESET_STATE });
      expect(result.mode).toBe('category');
      expect(result.searchTerm).toBe('');
      expect(result.selectedLayer).toBeUndefined();
      expect(result.filters).toEqual([]);
      expect(result.categoryType).toBe('science');
    });
  });
});

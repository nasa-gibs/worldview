import {
  initState,
  saveSearchState,
  collapseFacet,
  selectCategoryType,
  selectMeasurement,
  selectSource,
  selectLayer,
  showMeasurements,
  toggleFeatureTab,
  toggleMeasurementsTab,
  toggleRecentLayersTab,
  toggleSearchMode,
  toggleCategoryMode,
  toggleMobileFacets,
  clearRecentLayers,
  clearSingleRecentLayer,
  onProjectionSwitch,
  resetProductPickerState,
} from './actions';

import initSearch from './search-config';
import {
  getRecentLayers,
  clearRecentLayers as clearRecentFromLocalStorage,
  clearSingleRecentLayer as clearSingleRecentLayerFromLocalStorage,
} from './util';

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

jest.mock('./search-config');
jest.mock('./util', () => ({
  getRecentLayers: jest.fn(),
  clearRecentLayers: jest.fn(),
  clearSingleRecentLayer: jest.fn(),
}));

describe('actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initState', () => {
    it('dispatches INIT_STATE with searchConfig and projection', () => {
      const mockState = { proj: { id: 'geographic' } };
      const mockSearchConfig = { index: {} };
      initSearch.mockReturnValue(mockSearchConfig);

      const dispatch = jest.fn();
      const getState = jest.fn().mockReturnValue(mockState);

      initState()(dispatch, getState);

      expect(getState).toHaveBeenCalled();
      expect(initSearch).toHaveBeenCalledWith(mockState);
      expect(dispatch).toHaveBeenCalledWith({
        type: INIT_STATE,
        searchConfig: mockSearchConfig,
        projection: 'geographic',
      });
    });
  });

  describe('saveSearchState', () => {
    it('returns SAVE_SEARCH_STATE action with filters, searchTerm, and searchConfig', () => {
      const filters = { category: 'Atmosphere' };
      const searchTerm = 'aerosol';
      const searchConfig = { index: {} };

      expect(saveSearchState(filters, searchTerm, searchConfig)).toEqual({
        type: SAVE_SEARCH_STATE,
        filters,
        searchTerm,
        searchConfig,
      });
    });
  });

  describe('collapseFacet', () => {
    it('returns COLLAPSE_FACET action with field', () => {
      expect(collapseFacet('category')).toEqual({
        type: COLLAPSE_FACET,
        field: 'category',
      });
    });
  });

  describe('selectCategoryType', () => {
    it('returns SELECT_CATEGORY_TYPE action with value', () => {
      expect(selectCategoryType('science')).toEqual({
        type: SELECT_CATEGORY_TYPE,
        value: 'science',
      });
    });
  });

  describe('selectMeasurement', () => {
    it('returns SELECT_MEASUREMENT action with value', () => {
      expect(selectMeasurement('aerosol')).toEqual({
        type: SELECT_MEASUREMENT,
        value: 'aerosol',
      });
    });
  });

  describe('selectSource', () => {
    it('returns SELECT_SOURCE action with value', () => {
      expect(selectSource('MODIS')).toEqual({
        type: SELECT_SOURCE,
        value: 'MODIS',
      });
    });
  });

  describe('selectLayer', () => {
    it('returns SELECT_LAYER action with value', () => {
      expect(selectLayer('MODIS_Terra_CorrectedReflectance_TrueColor')).toEqual({
        type: SELECT_LAYER,
        value: 'MODIS_Terra_CorrectedReflectance_TrueColor',
      });
    });
  });

  describe('showMeasurements', () => {
    it('returns SHOW_MEASUREMENTS action with value', () => {
      expect(showMeasurements(true)).toEqual({
        type: SHOW_MEASUREMENTS,
        value: true,
      });
    });
  });

  describe('toggleFeatureTab', () => {
    it('dispatches TOGGLE_FEATURED_TAB with config from state', () => {
      const mockConfig = { projections: { geographic: {} } };
      const dispatch = jest.fn();
      const getState = jest.fn().mockReturnValue({ config: mockConfig });

      toggleFeatureTab()(dispatch, getState);

      expect(getState).toHaveBeenCalled();
      expect(dispatch).toHaveBeenCalledWith({
        type: TOGGLE_FEATURED_TAB,
        config: mockConfig,
      });
    });
  });

  describe('toggleMeasurementsTab', () => {
    it('returns TOGGLE_MEASUREMENTS_TAB action', () => {
      expect(toggleMeasurementsTab()).toEqual({
        type: TOGGLE_MEASUREMENTS_TAB,
      });
    });
  });

  describe('toggleRecentLayersTab', () => {
    it('dispatches TOGGLE_RECENT_LAYERS_TAB with recentLayers', () => {
      const layerConfig = { MODIS_Terra: {} };
      const mockRecentLayers = [{ id: 'MODIS_Terra' }];
      getRecentLayers.mockReturnValue(mockRecentLayers);

      const dispatch = jest.fn();
      const getState = jest.fn().mockReturnValue({
        layers: { layerConfig },
        proj: { id: 'geographic' },
      });

      toggleRecentLayersTab()(dispatch, getState);

      expect(getRecentLayers).toHaveBeenCalledWith(layerConfig, 'geographic');
      expect(dispatch).toHaveBeenCalledWith({
        type: TOGGLE_RECENT_LAYERS_TAB,
        recentLayers: mockRecentLayers,
      });
    });
  });

  describe('toggleSearchMode', () => {
    it('returns TOGGLE_SEARCH_MODE action', () => {
      expect(toggleSearchMode()).toEqual({
        type: TOGGLE_SEARCH_MODE,
      });
    });
  });

  describe('toggleCategoryMode', () => {
    it('returns TOGGLE_CATEGORY_MODE action', () => {
      expect(toggleCategoryMode()).toEqual({
        type: TOGGLE_CATEGORY_MODE,
      });
    });
  });

  describe('toggleMobileFacets', () => {
    it('returns TOGGLE_MOBILE_FACETS action', () => {
      expect(toggleMobileFacets()).toEqual({
        type: TOGGLE_MOBILE_FACETS,
      });
    });
  });

  describe('clearRecentLayers', () => {
    it('calls clearRecentFromLocalStorage and returns CLEAR_RECENT_LAYERS action', () => {
      const result = clearRecentLayers();

      expect(clearRecentFromLocalStorage).toHaveBeenCalled();
      expect(result).toEqual({
        type: CLEAR_RECENT_LAYERS,
      });
    });
  });

  describe('clearSingleRecentLayer', () => {
    it('calls clearSingleRecentLayerFromLocalStorage and dispatches CLEAR_SINGLE_RECENT_LAYER', () => {
      const layer = { id: 'MODIS_Terra' };
      const layerConfig = { MODIS_Terra: {} };
      const mockRecentLayers = [{ id: 'MODIS_Terra_2' }];
      const projections = { geographic: {}, arctic: {} };

      getRecentLayers.mockReturnValue(mockRecentLayers);

      const dispatch = jest.fn();
      const getState = jest.fn().mockReturnValue({
        layers: { layerConfig },
        proj: { id: 'geographic' },
        config: { projections },
      });

      clearSingleRecentLayer(layer)(dispatch, getState);

      expect(clearSingleRecentLayerFromLocalStorage).toHaveBeenCalledWith(
        layer,
        Object.keys(projections),
      );
      expect(getRecentLayers).toHaveBeenCalledWith(layerConfig, 'geographic');
      expect(dispatch).toHaveBeenCalledWith({
        type: CLEAR_SINGLE_RECENT_LAYER,
        recentLayers: mockRecentLayers,
      });
    });
  });

  describe('onProjectionSwitch', () => {
    it('returns PROJ_SWITCH action with projection', () => {
      expect(onProjectionSwitch('arctic')).toEqual({
        type: PROJ_SWITCH,
        projection: 'arctic',
      });
    });
  });

  describe('resetProductPickerState', () => {
    it('returns RESET_STATE action', () => {
      expect(resetProductPickerState()).toEqual({
        type: RESET_STATE,
      });
    });
  });
});

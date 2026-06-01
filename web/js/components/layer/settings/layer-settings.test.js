import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';

jest.mock('./opacity', () => function MockOpacity() { return <div data-testid="opacity" />; });
jest.mock('./palette', () => function MockPalette() { return <div data-testid="palette" />; });
jest.mock('./palette-threshold', () => function MockPaletteThreshold() { return <div data-testid="palette-threshold" />; });
jest.mock('./classification-toggle', () => function MockClassificationToggle() { return <div data-testid="classification-toggle" />; });
jest.mock('./granule-date-list', () => function MockGranuleDateList() { return <div data-testid="granule-date-list" />; });
jest.mock('./granule-count-slider', () => function MockGranuleCountSlider() { return <div data-testid="granule-count-slider" />; });
jest.mock('./imagery-search', () => function MockImagerySearch() { return <div data-testid="imagery-search" />; });
jest.mock('./associated-layers-toggle', () => function MockAssociatedLayers() { return <div data-testid="associated-layers" />; });
jest.mock('./band-selection/band-selection-parent-info-menu', () => function MockBandSelection() { return <div data-testid="band-selection" />; });
jest.mock('../../../util/local-storage', () => ({
  keys: { ALLOW_GRANULE_REORDER: 'ALLOW_GRANULE_REORDER' },
  getItem: jest.fn(() => null),
}));
jest.mock('../../../modules/palettes/util', () => ({ palettesTranslate: jest.fn() }));
jest.mock('../../../modules/palettes/selectors', () => ({
  getDefaultLegend: jest.fn(),
  getCustomPalette: jest.fn(),
  getPaletteLegends: jest.fn(() => null),
  getPalette: jest.fn(() => ({ legend: { colors: [] }, squash: false, noclip: false })),
  getPaletteLegend: jest.fn(),
  isPaletteAllowed: jest.fn(() => true),
}));
jest.mock('../../../modules/layers/selectors', () => ({
  getGranuleLayer: jest.fn(() => null),
  getGranulePlatform: jest.fn(() => 'Terra'),
  getActiveLayersMap: jest.fn(() => ({})),
}));
jest.mock('../../../modules/vector-styles/selectors', () => ({ getVectorStyle: jest.fn() }));
jest.mock('../../../modules/palettes/actions', () => ({
  setThresholdRangeSquashAndNoClip: jest.fn(() => ({ type: 'SET_THRESHOLD' })),
  setCustomPalette: jest.fn(() => ({ type: 'SET_CUSTOM_PALETTE' })),
  clearCustomPalette: jest.fn(() => ({ type: 'CLEAR_CUSTOM_PALETTE' })),
  setToggledClassification: jest.fn(() => ({ type: 'SET_TOGGLED' })),
  refreshDisabledClassification: jest.fn(() => ({ type: 'REFRESH_DISABLED' })),
}));
jest.mock('../../../modules/vector-styles/actions', () => ({
  setFilterRange: jest.fn(() => ({ type: 'SET_FILTER_RANGE' })),
  setStyle: jest.fn(() => ({ type: 'SET_STYLE' })),
  clearStyle: jest.fn(() => ({ type: 'CLEAR_STYLE' })),
}));
jest.mock('../../../modules/layers/actions', () => ({
  updateGranuleLayerOptions: jest.fn(() => ({ type: 'UPDATE_GRANULE' })),
  resetGranuleLayerDates: jest.fn(() => ({ type: 'RESET_GRANULE' })),
  setOpacity: jest.fn(() => ({ type: 'SET_OPACITY' })),
}));

import LayerSettings from './layer-settings';

const mockStore = configureStore([]);

const baseState = {
  config: {
    features: { customPalettes: true },
    paletteOrder: [],
    layers: {},
    vectorStyles: {},
  },
  palettes: { custom: {} },
  compare: { activeString: 'active' },
  screenSize: { screenHeight: 800 },
  settings: { globalTemperatureUnit: '' },
  layers: { active: { granulePlatform: 'Terra' } },
};

const store = mockStore(baseState);

const standardLayer = {
  id: 'MODIS_Terra_CorrRefl_TrueColor',
  opacity: 1,
  type: 'wms',
  palette: { id: 'blue-1', recommended: [] },
};

const sharedProps = {
  setOpacity: jest.fn(),
  customPalettesIsActive: true,
  palettedAllowed: true,
  getPaletteLegends: jest.fn(() => null),
  getPalette: jest.fn(() => ({ legend: { colors: [] }, squash: false, noclip: false })),
  getPaletteLegend: jest.fn(),
  getDefaultLegend: jest.fn(),
  getCustomPalette: jest.fn(),
  palettesTranslate: jest.fn(),
  paletteOrder: [],
  groupName: 'active',
  screenHeight: 800,
  granuleOptions: {},
  globalTemperatureUnit: '',
  toggleClassification: jest.fn(),
  toggleAllClassifications: jest.fn(),
  setThresholdRange: jest.fn(),
  setCustomPalette: jest.fn(),
  clearCustomPalette: jest.fn(),
  setStyle: jest.fn(),
  clearStyle: jest.fn(),
  updateGranuleLayerOptions: jest.fn(),
  resetGranuleLayerDates: jest.fn(),
};

const renderSettings = (layer = standardLayer, propOverrides = {}) => render(
  <Provider store={store}>
    <LayerSettings
      layer={layer}
      zot={propOverrides.zot}
      granuleOptions={propOverrides.granuleOptions || {}}
      setOpacity={sharedProps.setOpacity}
      customPalettesIsActive={sharedProps.customPalettesIsActive}
      palettedAllowed={sharedProps.palettedAllowed}
      getPaletteLegends={sharedProps.getPaletteLegends}
      getPalette={sharedProps.getPalette}
      getPaletteLegend={sharedProps.getPaletteLegend}
      getDefaultLegend={sharedProps.getDefaultLegend}
      getCustomPalette={sharedProps.getCustomPalette}
      palettesTranslate={sharedProps.palettesTranslate}
      paletteOrder={sharedProps.paletteOrder}
      groupName={sharedProps.groupName}
      screenHeight={sharedProps.screenHeight}
      globalTemperatureUnit={sharedProps.globalTemperatureUnit}
      toggleClassification={sharedProps.toggleClassification}
      toggleAllClassifications={sharedProps.toggleAllClassifications}
      setThresholdRange={sharedProps.setThresholdRange}
      setCustomPalette={sharedProps.setCustomPalette}
      clearCustomPalette={sharedProps.clearCustomPalette}
      setStyle={sharedProps.setStyle}
      clearStyle={sharedProps.clearStyle}
      updateGranuleLayerOptions={sharedProps.updateGranuleLayerOptions}
      resetGranuleLayerDates={sharedProps.resetGranuleLayerDates}
    />
  </Provider>,
);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('LayerSettings', () => {
  describe('returns nothing when layer has no id', () => {
    it('renders nothing when layer.id is null', () => {
      const { container } = renderSettings({ id: null, opacity: 1, type: 'wms' });
      expect(container.firstChild).toBeNull();
    });
  });

  describe('always rendered', () => {
    it('renders the Opacity component', () => {
      renderSettings();
      expect(screen.getByTestId('opacity')).toBeInTheDocument();
    });
  });

  describe('BandSelection (titiler layers)', () => {
    it('renders BandSelection for HLS_Customizable_Sentinel', () => {
      renderSettings({ ...standardLayer, id: 'HLS_Customizable_Sentinel' });
      expect(screen.getByTestId('band-selection')).toBeInTheDocument();
    });

    it('renders BandSelection for HLS_Customizable_Landsat', () => {
      renderSettings({ ...standardLayer, id: 'HLS_Customizable_Landsat' });
      expect(screen.getByTestId('band-selection')).toBeInTheDocument();
    });

    it('does not render BandSelection for non-titiler layers', () => {
      renderSettings(standardLayer);
      expect(screen.queryByTestId('band-selection')).not.toBeInTheDocument();
    });
  });

  describe('AssociatedLayers', () => {
    it('renders AssociatedLayers when layer has associatedLayers', () => {
      renderSettings({ ...standardLayer, associatedLayers: ['layer-1'] });
      expect(screen.getByTestId('associated-layers')).toBeInTheDocument();
    });

    it('renders AssociatedLayers when layer has orbitTracks', () => {
      renderSettings({ ...standardLayer, orbitTracks: ['track-1'] });
      expect(screen.getByTestId('associated-layers')).toBeInTheDocument();
    });

    it('does not render AssociatedLayers when no associatedLayers or orbitTracks', () => {
      renderSettings(standardLayer);
      expect(screen.queryByTestId('associated-layers')).not.toBeInTheDocument();
    });
  });

  describe('ImagerySearch (granule metadata)', () => {
    it('renders ImagerySearch when enableCMRDataFinder is true and no zot', () => {
      renderSettings({ ...standardLayer, enableCMRDataFinder: true });
      expect(screen.getByTestId('imagery-search')).toBeInTheDocument();
    });

    it('does not render ImagerySearch when enableCMRDataFinder is false', () => {
      renderSettings({ ...standardLayer, enableCMRDataFinder: false });
      expect(screen.queryByTestId('imagery-search')).not.toBeInTheDocument();
    });

    it('does not render ImagerySearch when zot.underZoomValue > 0', () => {
      renderSettings({
        ...standardLayer,
        enableCMRDataFinder: true,
      }, { zot: { underZoomValue: 1 } });
      expect(screen.queryByTestId('imagery-search')).not.toBeInTheDocument();
    });

    it('renders ImagerySearch when zot.underZoomValue is 0', () => {
      renderSettings({
        ...standardLayer,
        enableCMRDataFinder: true,
      },
      { zot: { underZoomValue: 0 }});
      expect(screen.getByTestId('imagery-search')).toBeInTheDocument();
    });
  });

  describe('granule settings', () => {
    it('renders GranuleCountSlider when granuleOptions has dates', () => {
      const { getGranuleLayer } = require('../../../modules/layers/selectors');
      getGranuleLayer.mockReturnValue({ dates: ['2023-01-01'], count: 5 });
      renderSettings(standardLayer);
      expect(screen.getByTestId('granule-count-slider')).toBeInTheDocument();
    });

    it('does not render GranuleCountSlider when getGranuleLayer returns null', () => {
      const { getGranuleLayer } = require('../../../modules/layers/selectors');
      getGranuleLayer.mockReturnValue(null);
      renderSettings();
      expect(screen.queryByTestId('granule-count-slider')).not.toBeInTheDocument();
    });

    it('does not render GranuleCountSlider when granule dates are null', () => {
      const { getGranuleLayer } = require('../../../modules/layers/selectors');
      getGranuleLayer.mockReturnValue({ dates: null, count: 5 });
      renderSettings(standardLayer);
      expect(screen.queryByTestId('granule-count-slider')).not.toBeInTheDocument();
    });
  });
});

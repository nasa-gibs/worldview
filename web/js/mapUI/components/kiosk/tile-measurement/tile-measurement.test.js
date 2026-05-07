import { render, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import TileMeasurement from './tile-measurement';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../../../modules/date/actions', () => ({
  selectDate: jest.fn((date) => ({ type: 'SELECT_DATE', date })),
}));

jest.mock('../../../../modules/ui/actions', () => ({
  setEICMeasurementComplete: jest.fn(() => ({ type: 'SET_EIC_MEASUREMENT_COMPLETE' })),
  setEICMeasurementAborted: jest.fn(() => ({ type: 'SET_EIC_MEASUREMENT_ABORTED' })),
  toggleStaticMap: jest.fn((isActive) => ({ type: 'TOGGLE_STATIC_MAP', isActive })),
}));

jest.mock('../../../../modules/layers/actions', () => ({
  toggleGroupVisibility: jest.fn((ids, visible) => ({ type: 'TOGGLE_GROUP_VISIBILITY', ids, visible })),
}));

jest.mock('../../../../modules/layers/selectors', () => ({
  getActiveLayers: jest.fn(() => []),
}));

jest.mock('./utils/date-util', () => ({
  getDates: jest.fn(() => ['2024-06-15', '2024-06-14', '2024-06-13']),
}));

jest.mock('./utils/image-api-request', () => jest.fn());
jest.mock('./utils/calculate-pixels', () => jest.fn());

jest.mock('./utils/layer-data-eic', () => ({
  layersToMeasure: ['MODIS_Terra_CorrectedReflectance_TrueColor'],
  layerPixelData: {
    MODIS_Terra_CorrectedReflectance_TrueColor: { threshold: 0.70 },
  },
  bestDates: {
    MODIS_Terra_CorrectedReflectance_TrueColor: { date: '2023-10-29' },
  },
}));

jest.mock('./utils/verify-map-tiles', () => jest.fn());

jest.mock('ol/proj', () => ({
  transformExtent: jest.fn((extent) => extent),
}));

import { getActiveLayers } from '../../../../modules/layers/selectors';
import { getDates } from './utils/date-util';
import fetchWMSImage from './utils/image-api-request';
import calculatePixels from './utils/calculate-pixels';
import countTilesForSpecifiedLayers from './utils/verify-map-tiles';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockStore = configureMockStore();

const mockView = {
  calculateExtent: jest.fn(() => [-180, -90, 180, 90]),
  getSize: jest.fn(() => [800, 600]),
};

const mockSelected = {
  getView: jest.fn(() => mockView),
  getSize: jest.fn(() => [800, 600]),
};

const mockUi = { selected: mockSelected };

const mockActiveLayers = [
  { id: 'MODIS_Terra_CorrectedReflectance_TrueColor', period: 'daily' },
];

function buildStore(overrides = {}) {
  return mockStore({
    ui: {
      eic: 'si',
      eicLegacy: false,
      scenario: '',
      ...overrides.ui,
    },
    date: {
      appNow: new Date('2024-06-15T00:00:00Z'),
      ...overrides.date,
    },
    compare: { activeString: 'activeA' },
    layers: { active: [] },
    ...overrides,
  });
}

function buildDefaultTileResult(overrides = {}) {
  return {
    totalExpectedTileCount: 4,
    totalLoadedTileCount: 4,
    totalTilesLoadedWithBadImage: 0,
    totalErrorTiles: 0,
    totalEmptyTiles: 0,
    totalOtherTileStates: [],
    ...overrides,
  };
}

function renderComponent(store, ui = mockUi) {
  const s = store ?? buildStore();
  const utils = render(
    <Provider store={s}>
      <TileMeasurement ui={ui} />
    </Provider>,
  );
  return { ...utils, store: s };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('TileMeasurement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    getActiveLayers.mockReturnValue(mockActiveLayers);
    getDates.mockReturnValue(['2024-06-15', '2024-06-14', '2024-06-13']);
    fetchWMSImage.mockResolvedValue('blob:mock-url');
    calculatePixels.mockResolvedValue(0.3);
    countTilesForSpecifiedLayers.mockReturnValue(buildDefaultTileResult());
  });

  afterEach(() => {
    jest.useRealTimers();
    console.log.mockRestore();
    console.error.mockRestore();
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('renders null (no DOM output)', () => {
      const { container } = renderComponent();
      expect(container.firstChild).toBeNull();
    });
  });

  // ── useEffect guard conditions ─────────────────────────────────────────────

  describe('useEffect guard conditions', () => {
    it('does NOT call calculateMeasurements when eic is falsy', async () => {
      const store = buildStore({ ui: { eic: '', eicLegacy: false, scenario: '' } });
      renderComponent(store);
      await act(async () => { jest.runAllTimers(); });
      expect(fetchWMSImage).not.toHaveBeenCalled();
    });

    it('does NOT call calculateMeasurements when ui.selected is null', async () => {
      const store = buildStore({ ui: { eic: 'si', eicLegacy: false, scenario: '' } });
      renderComponent(store, { selected: null });
      await act(async () => { jest.runAllTimers(); });
      expect(fetchWMSImage).not.toHaveBeenCalled();
    });

    it('does NOT call calculateMeasurements when activeLayers is falsy', async () => {
      getActiveLayers.mockReturnValue(null);
      const store = buildStore({ ui: { eic: 'si', eicLegacy: false, scenario: '' } });
      renderComponent(store);
      await act(async () => { jest.runAllTimers(); });
      expect(fetchWMSImage).not.toHaveBeenCalled();
    });

    it('does NOT call calculateMeasurements when both eicLegacy is false AND scenario is set', async () => {
      const store = buildStore({ ui: { eic: 'si', eicLegacy: false, scenario: 'some-scenario' } });
      renderComponent(store);
      await act(async () => { jest.runAllTimers(); });
      expect(fetchWMSImage).not.toHaveBeenCalled();
    });

    it('calls calculateMeasurements when eicLegacy is true (regardless of scenario)', async () => {
      const store = buildStore({ ui: { eic: 'si', eicLegacy: true, scenario: 'some-scenario' } });
      renderComponent(store);
      await act(async () => { jest.runAllTimers(); });
      expect(fetchWMSImage).toHaveBeenCalled();
    });

    it('calls calculateMeasurements when scenario is empty string', async () => {
      const store = buildStore({ ui: { eic: 'si', eicLegacy: false, scenario: '' } });
      renderComponent(store);
      await act(async () => { jest.runAllTimers(); });
      expect(fetchWMSImage).toHaveBeenCalled();
    });

    it('only triggers calculateMeasurements once (measurementsStarted guard)', async () => {
      const store = buildStore({ ui: { eic: 'si', eicLegacy: false, scenario: '' } });
      renderComponent(store);
      await act(async () => { jest.runAllTimers(); });
      await act(async () => { jest.runAllTimers(); });
      expect(fetchWMSImage).toHaveBeenCalledTimes(1);
    });
  });

  // ── findLayersToMeasure ────────────────────────────────────────────────────

  describe('findLayersToMeasure', () => {
    it('logs layer count when matching layers are found', async () => {
      const store = buildStore({ ui: { eic: 'si', eicLegacy: false, scenario: '' } });
      renderComponent(store);
      await act(async () => { jest.runAllTimers(); });
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('EIC layer(s) found to measure'),
      );
    });

    it('aborts and calls verifyTilesAndHandleErrors when no matching layers found', async () => {
      getActiveLayers.mockReturnValue([{ id: 'NON_MATCHING_LAYER', period: 'daily' }]);
      const store = buildStore({ ui: { eic: 'si', eicLegacy: false, scenario: '' } });
      renderComponent(store);
      await act(async () => { jest.runAllTimers(); });
      expect(console.error).toHaveBeenCalledWith(
        'No layers found to be measured... Aborting...',
      );
      expect(countTilesForSpecifiedLayers).toHaveBeenCalled();
    });

    it('filters layers by layersToMeasure', async () => {
      getActiveLayers.mockReturnValue([
        { id: 'MODIS_Terra_CorrectedReflectance_TrueColor', period: 'daily' },
        { id: 'NON_EIC_LAYER', period: 'daily' },
      ]);
      const store = buildStore({ ui: { eic: 'si', eicLegacy: false, scenario: '' } });
      renderComponent(store);
      await act(async () => { jest.runAllTimers(); });
      expect(fetchWMSImage).toHaveBeenCalledWith(
        'MODIS_Terra_CorrectedReflectance_TrueColor',
        expect.any(String),
        expect.anything(),
      );
      expect(fetchWMSImage).not.toHaveBeenCalledWith(
        'NON_EIC_LAYER',
        expect.any(String),
        expect.anything(),
      );
    });

    it('uses "subdaily" period when any layer is subdaily', async () => {
      getActiveLayers.mockReturnValue([
        { id: 'MODIS_Terra_CorrectedReflectance_TrueColor', period: 'subdaily' },
      ]);
      const store = buildStore({ ui: { eic: 'si', eicLegacy: false, scenario: '' } });
      renderComponent(store);
      await act(async () => { jest.runAllTimers(); });
      expect(getDates).toHaveBeenCalledWith(expect.anything(), 'subdaily');
    });

    it('uses "daily" period when no layers are subdaily', async () => {
      const store = buildStore({ ui: { eic: 'si', eicLegacy: false, scenario: '' } });
      renderComponent(store);
      await act(async () => { jest.runAllTimers(); });
      expect(getDates).toHaveBeenCalledWith(expect.anything(), 'daily');
    });
  });

  // ── findDateRange ──────────────────────────────────────────────────────────

  describe('findDateRange', () => {
    it('aborts when getDates returns falsy', async () => {
      getDates.mockReturnValue(null);
      const store = buildStore({ ui: { eic: 'si', eicLegacy: false, scenario: '' } });
      renderComponent(store);
      await act(async () => { jest.runAllTimers(); });
      expect(console.error).toHaveBeenCalledWith('No date range found... Aborting..');
      expect(countTilesForSpecifiedLayers).toHaveBeenCalled();
    });

    it('calls getDates with realTime from the store', async () => {
      const appNow = new Date('2024-06-15T00:00:00Z');
      const store = buildStore({
        ui: { eic: 'si', eicLegacy: false, scenario: '' },
        date: { appNow },
      });
      renderComponent(store);
      await act(async () => { jest.runAllTimers(); });
      expect(getDates).toHaveBeenCalledWith(appNow, expect.any(String));
    });
  });

  // ── findFullImageryDate ────────────────────────────────────────────────────

  describe('findFullImageryDate', () => {
    it('calls fetchWMSImage for each date until threshold is satisfied', async () => {
      const store = buildStore({ ui: { eic: 'si', eicLegacy: false, scenario: '' } });
      renderComponent(store);
      await act(async () => { jest.runAllTimers(); });
      expect(fetchWMSImage).toHaveBeenCalledWith(
        'MODIS_Terra_CorrectedReflectance_TrueColor',
        '2024-06-15',
        expect.anything(),
      );
    });

    it('dispatches SELECT_DATE with the full imagery date found', async () => {
      calculatePixels.mockResolvedValue(0.3);
      const store = buildStore({ ui: { eic: 'si', eicLegacy: false, scenario: '' } });
      renderComponent(store);
      await act(async () => { jest.runAllTimers(); });
      expect(store.getActions()).toContainEqual(
        expect.objectContaining({ type: 'SELECT_DATE' }),
      );
    });

    it('logs when a layer is BELOW the threshold', async () => {
      calculatePixels.mockResolvedValue(0.3);
      const store = buildStore({ ui: { eic: 'si', eicLegacy: false, scenario: '' } });
      renderComponent(store);
      await act(async () => { jest.runAllTimers(); });
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('BELOW the threshold'),
      );
    });

    it('logs when a layer is BREAKING the threshold', async () => {
      calculatePixels.mockResolvedValue(0.9);
      getDates.mockReturnValue(['2024-06-15']);
      const store = buildStore({ ui: { eic: 'si', eicLegacy: false, scenario: '' } });
      renderComponent(store);
      await act(async () => { jest.runAllTimers(); });
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('BREAKING the threshold'),
      );
    });

    it('logs when all layers meet threshold for a date', async () => {
      calculatePixels.mockResolvedValue(0.3);
      const store = buildStore({ ui: { eic: 'si', eicLegacy: false, scenario: '' } });
      renderComponent(store);
      await act(async () => { jest.runAllTimers(); });
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('All layers meet thresholds'),
      );
    });

    it('returns the best date when fetchWMSImage throws', async () => {
      fetchWMSImage.mockRejectedValue(new Error('WMS error'));
      const store = buildStore({ ui: { eic: 'si', eicLegacy: false, scenario: '' } });
      renderComponent(store);
      await act(async () => { jest.runAllTimers(); });
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('No WMS image tile available'),
        expect.any(Error),
      );
    });

    it('falls back to best date when no date satisfies threshold', async () => {
      calculatePixels.mockResolvedValue(0.9);
      getDates.mockReturnValue(['2024-06-15']);
      const store = buildStore({ ui: { eic: 'si', eicLegacy: false, scenario: '' } });
      renderComponent(store);
      await act(async () => { jest.runAllTimers(); });
      const selectAction = store.getActions().find((a) => a.type === 'SELECT_DATE');
      expect(selectAction).toBeDefined();
    });

    it('logs error when no best date exists for any layer', async () => {
      calculatePixels.mockResolvedValue(0.9);
      getDates.mockReturnValue(['2024-06-15']);
      getActiveLayers.mockReturnValue([
        { id: 'VIIRS_SNPP_NDVI_8Day', period: 'daily' },
      ]);
      jest.mock('./utils/layer-data-eic', () => ({
        layersToMeasure: ['VIIRS_SNPP_NDVI_8Day'],
        layerPixelData: { VIIRS_SNPP_NDVI_8Day: { threshold: 0.70 } },
        bestDates: {},
      }));
      const store = buildStore({ ui: { eic: 'si', eicLegacy: false, scenario: '' } });
      renderComponent(store);
      await act(async () => { jest.runAllTimers(); });
      expect(console.error).toHaveBeenCalled();
    });
  });

  // ── updateDate ─────────────────────────────────────────────────────────────

  describe('updateDate', () => {
    it('dispatches SELECT_DATE with a daily date parsed as local noon', async () => {
      calculatePixels.mockResolvedValue(0.3);
      getDates.mockReturnValue(['2024-06-15']);
      const store = buildStore({ ui: { eic: 'si', eicLegacy: false, scenario: '' } });
      renderComponent(store);
      await act(async () => { jest.runAllTimers(); });
      const action = store.getActions().find((a) => a.type === 'SELECT_DATE');
      expect(action.date).toEqual(new Date(2024, 5, 15, 12, 0, 0));
    });

    it('dispatches SELECT_DATE with a subdaily ISO date as UTC', async () => {
      getActiveLayers.mockReturnValue([
        { id: 'MODIS_Terra_CorrectedReflectance_TrueColor', period: 'subdaily' },
      ]);
      getDates.mockReturnValue(['2024-06-15T14:30:00.000Z']);
      calculatePixels.mockResolvedValue(0.3);
      const store = buildStore({ ui: { eic: 'si', eicLegacy: false, scenario: '' } });
      renderComponent(store);
      await act(async () => { jest.runAllTimers(); });
      const action = store.getActions().find((a) => a.type === 'SELECT_DATE');
      expect(action.date).toEqual(new Date(Date.UTC(2024, 5, 15, 14, 30, 0)));
    });
  });

  // ── calculateMeasurements: bestDate branch ─────────────────────────────────

  describe('calculateMeasurements: bestDate branch', () => {
    it('uses best date and calls verifyTiles when fullImageryDate equals bestDate', async () => {
      calculatePixels.mockResolvedValue(0.9);
      getDates.mockReturnValue(['2023-10-29']);
      const store = buildStore({ ui: { eic: 'si', eicLegacy: false, scenario: '' } });
      renderComponent(store);
      await act(async () => { jest.runAllTimers(); });
      expect(store.getActions()).toContainEqual(
        expect.objectContaining({ type: 'SELECT_DATE' }),
      );
      expect(countTilesForSpecifiedLayers).toHaveBeenCalled();
    });

    it('uses best date when fullImageryDate is null/undefined', async () => {
      fetchWMSImage.mockRejectedValue(new Error('fail'));
      getDates.mockReturnValue(['2024-06-15']);
      const store = buildStore({ ui: { eic: 'si', eicLegacy: false, scenario: '' } });
      renderComponent(store);
      await act(async () => { jest.runAllTimers(); });
      expect(countTilesForSpecifiedLayers).toHaveBeenCalled();
    });
  });

  // ── verifyTilesAndHandleErrors ─────────────────────────────────────────────

  describe('verifyTilesAndHandleErrors', () => {
    it('calls countTilesForSpecifiedLayers', async () => {
      const store = buildStore({ ui: { eic: 'si', eicLegacy: false, scenario: '' } });
      renderComponent(store);
      await act(async () => { jest.runAllTimers(); });
      expect(countTilesForSpecifiedLayers).toHaveBeenCalled();
    });

    it('dispatches SET_EIC_MEASUREMENT_COMPLETE when eic is "da" and not aborted', async () => {
      countTilesForSpecifiedLayers.mockReturnValue(buildDefaultTileResult());
      const store = buildStore({ ui: { eic: 'da', eicLegacy: true, scenario: '' } });
      renderComponent(store);
      await act(async () => { jest.runAllTimers(); });
      expect(store.getActions()).toContainEqual(
        expect.objectContaining({ type: 'SET_EIC_MEASUREMENT_COMPLETE' }),
      );
    });

    it('dispatches SET_EIC_MEASUREMENT_COMPLETE when eic is "sa" and not aborted', async () => {
      countTilesForSpecifiedLayers.mockReturnValue(buildDefaultTileResult());
      const store = buildStore({ ui: { eic: 'sa', eicLegacy: true, scenario: '' } });
      renderComponent(store);
      await act(async () => { jest.runAllTimers(); });
      expect(store.getActions()).toContainEqual(
        expect.objectContaining({ type: 'SET_EIC_MEASUREMENT_COMPLETE' }),
      );
    });

    it('dispatches SET_EIC_MEASUREMENT_COMPLETE when tiles are loaded and not aborted', async () => {
      countTilesForSpecifiedLayers.mockReturnValue(buildDefaultTileResult(
        { totalLoadedTileCount: 4 },
      ));
      const store = buildStore({ ui: { eic: 'si', eicLegacy: false, scenario: '' } });
      renderComponent(store);
      await act(async () => { jest.runAllTimers(); });
      expect(store.getActions()).toContainEqual(
        expect.objectContaining({ type: 'SET_EIC_MEASUREMENT_COMPLETE' }),
      );
    });

    it('dispatches SET_EIC_MEASUREMENT_ABORTED when tiles loaded but abort is true', async () => {
      countTilesForSpecifiedLayers.mockReturnValue(buildDefaultTileResult(
        { totalLoadedTileCount: 0 },
      ));
      const store = buildStore({ ui: { eic: 'si', eicLegacy: false, scenario: '' } });
      renderComponent(store);
      await act(async () => {
        await Promise.resolve();
        jest.runAllTicks();
      });

      await act(async () => {
        for (let i = 0; i < 11; i += 1) {
          jest.advanceTimersByTime(1000);
          await Promise.resolve();
        }
      });
      expect(store.getActions()).toContainEqual(
        expect.objectContaining({ type: 'SET_EIC_MEASUREMENT_ABORTED' }),
      );
    });

    it('dispatches TOGGLE_STATIC_MAP(true) when no tiles found and aborted', async () => {
      countTilesForSpecifiedLayers.mockReturnValue(buildDefaultTileResult(
        { totalLoadedTileCount: 0 },
      ));
      const store = buildStore({ ui: { eic: 'si', eicLegacy: false, scenario: '' } });
      renderComponent(store);
      await act(async () => {
        await Promise.resolve();
        jest.runAllTicks();
      });

      await act(async () => {
        for (let i = 0; i < 11; i += 1) {
          jest.advanceTimersByTime(1000);
          await Promise.resolve();
        }
      });
      expect(store.getActions()).toContainEqual(
        expect.objectContaining({ type: 'TOGGLE_STATIC_MAP', isActive: true }),
      );
    });

    it('dispatches TOGGLE_GROUP_VISIBILITY with active layer ids and false when aborted with no tiles', async () => {
      countTilesForSpecifiedLayers.mockReturnValue(buildDefaultTileResult(
        { totalLoadedTileCount: 0 },
      ));
      const store = buildStore({ ui: { eic: 'si', eicLegacy: false, scenario: '' } });
      renderComponent(store);
      await act(async () => {
        await Promise.resolve();
        jest.runAllTicks();
      });

      await act(async () => {
        for (let i = 0; i < 11; i += 1) {
          jest.advanceTimersByTime(1000);
          await Promise.resolve();
        }
      });
      expect(store.getActions()).toContainEqual(
        expect.objectContaining({
          type: 'TOGGLE_GROUP_VISIBILITY',
          ids: ['MODIS_Terra_CorrectedReflectance_TrueColor'],
          visible: false,
        }),
      );
    });

    it('retries up to 10 times when loadedTilesCount is 0', async () => {
      countTilesForSpecifiedLayers.mockReturnValue(buildDefaultTileResult(
        { totalLoadedTileCount: 0 },
      ));
      const store = buildStore({ ui: { eic: 'si', eicLegacy: false, scenario: '' } });
      renderComponent(store);
      await act(async () => {
        await Promise.resolve();
        jest.runAllTicks();
      });

      await act(async () => {
        for (let i = 0; i < 11; i += 1) {
          jest.advanceTimersByTime(1000);
          await Promise.resolve();
        }
      });
      expect(countTilesForSpecifiedLayers).toHaveBeenCalledTimes(10);
    });

    it('breaks out of retry loop when loadedTilesCount > 0', async () => {
      countTilesForSpecifiedLayers
        .mockReturnValueOnce(buildDefaultTileResult({ totalLoadedTileCount: 0 }))
        .mockReturnValueOnce(buildDefaultTileResult({ totalLoadedTileCount: 4 }));
      const store = buildStore({ ui: { eic: 'si', eicLegacy: false, scenario: '' } });
      renderComponent(store);
      await act(async () => {
        await Promise.resolve();
        jest.runAllTicks();
      });

      await act(async () => {
        for (let i = 0; i < 11; i += 1) {
          jest.advanceTimersByTime(1000);
          await Promise.resolve();
        }
      });
      expect(countTilesForSpecifiedLayers).toHaveBeenCalledTimes(2);
    });
  });

  // ── error handling ─────────────────────────────────────────────────────────

  describe('error handling', () => {
    it('logs "Error calculating measurements:" when calculateMeasurements throws', async () => {
      getDates.mockImplementation(() => { throw new Error('unexpected'); });
      const store = buildStore({ ui: { eic: 'si', eicLegacy: false, scenario: '' } });
      renderComponent(store);
      await act(async () => { jest.runAllTimers(); });
      expect(console.error).toHaveBeenCalledWith(
        'Error calculating measurements:',
        expect.any(Error),
      );
    });
  });
});

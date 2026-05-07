import {
  chartingReducer,
  initialChartingState,
} from './reducers';
import {
  TOGGLE_ON_OFF,
  TOGGLE_AOI_ON_OFF,
  UPDATE_AOI_COORDINATES,
  TOGGLE_AOI_SELECTED_ON_OFF,
  TOGGLE_REQUEST_IN_PROGRESS,
  TOGGLE_MODAL_OPEN,
  UPDATE_CHARTING_DATE_SELECTION,
  UPDATE_START_DATE,
  UPDATE_END_DATE,
  UPDATE_ACTIVE_CHART,
} from './constants';

describe('initialChartingState', () => {
  it('has the correct default shape', () => {
    expect(initialChartingState).toEqual({
      active: false,
      activeLayer: undefined,
      aoiActive: true,
      aoiSelected: false,
      aoiCoordinates: [],
      chartRequestInProgress: false,
      timeSpanSelection: 'range',
      timeSpanStartDate: undefined,
      timeSpanEndDate: undefined,
      fromButton: false,
      isChartOpen: false,
    });
  });
});

describe('chartingReducer', () => {
  it('returns the default state when called with no arguments', () => {
    const state = chartingReducer(undefined, { type: '@@INIT' });
    expect(state).toEqual(initialChartingState);
  });

  it('returns the same state for an unknown action', () => {
    const state = chartingReducer(initialChartingState, { type: 'UNKNOWN' });
    expect(state).toBe(initialChartingState);
  });

  describe('TOGGLE_ON_OFF', () => {
    it('sets active to true and fromButton to true when currently inactive', () => {
      const state = chartingReducer(initialChartingState, { type: TOGGLE_ON_OFF });
      expect(state.active).toBe(true);
      expect(state.fromButton).toBe(true);
    });

    it('resets to initial-like state when currently active', () => {
      const activeState = { ...initialChartingState, active: true };
      const state = chartingReducer(activeState, { type: TOGGLE_ON_OFF });
      expect(state.active).toBe(false);
      expect(state.activeLayer).toBeUndefined();
      expect(state.aoiActive).toBe(true);
      expect(state.aoiCoordinates).toBeNull();
      expect(state.aoiSelected).toBe(false);
      expect(state.chartRequestInProgress).toBe(false);
      expect(state.timeSpanEndDate).toBeUndefined();
      expect(state.timeSpanSelection).toBe('range');
      expect(state.timeSpanStartDate).toBeUndefined();
      expect(state.fromButton).toBe(false);
      expect(state.isChartOpen).toBe(false);
    });
  });

  describe('TOGGLE_AOI_ON_OFF', () => {
    it('toggles aoiActive from true to false', () => {
      const state = chartingReducer(initialChartingState, { type: TOGGLE_AOI_ON_OFF });
      expect(state.aoiActive).toBe(false);
    });

    it('toggles aoiActive from false to true', () => {
      const inactiveAoi = { ...initialChartingState, aoiActive: false };
      const state = chartingReducer(inactiveAoi, { type: TOGGLE_AOI_ON_OFF });
      expect(state.aoiActive).toBe(true);
    });
  });

  describe('TOGGLE_REQUEST_IN_PROGRESS', () => {
    it('sets chartRequestInProgress to true', () => {
      const state = chartingReducer(initialChartingState, { type: TOGGLE_REQUEST_IN_PROGRESS, status: true });
      expect(state.chartRequestInProgress).toBe(true);
    });

    it('sets chartRequestInProgress to false', () => {
      const inProgress = { ...initialChartingState, chartRequestInProgress: true };
      const state = chartingReducer(inProgress, { type: TOGGLE_REQUEST_IN_PROGRESS, status: false });
      expect(state.chartRequestInProgress).toBe(false);
    });
  });

  describe('TOGGLE_MODAL_OPEN', () => {
    it('sets isChartOpen to true', () => {
      const state = chartingReducer(initialChartingState, { type: TOGGLE_MODAL_OPEN, status: true });
      expect(state.isChartOpen).toBe(true);
    });

    it('sets isChartOpen to false', () => {
      const openState = { ...initialChartingState, isChartOpen: true };
      const state = chartingReducer(openState, { type: TOGGLE_MODAL_OPEN, status: false });
      expect(state.isChartOpen).toBe(false);
    });
  });

  describe('UPDATE_AOI_COORDINATES', () => {
    it('updates aoiCoordinates with the provided extent', () => {
      const extent = [10, 20, 30, 40];
      const state = chartingReducer(initialChartingState, { type: UPDATE_AOI_COORDINATES, extent });
      expect(state.aoiCoordinates).toEqual(extent);
    });
  });

  describe('TOGGLE_AOI_SELECTED_ON_OFF', () => {
    it('sets aoiSelected to the explicit action value when action.action is not null', () => {
      const state = chartingReducer(initialChartingState, { type: TOGGLE_AOI_SELECTED_ON_OFF, action: true });
      expect(state.aoiSelected).toBe(true);
    });

    it('sets aoiSelected to false via explicit action value', () => {
      const selectedState = { ...initialChartingState, aoiSelected: true };
      const state = chartingReducer(selectedState, { type: TOGGLE_AOI_SELECTED_ON_OFF, action: false });
      expect(state.aoiSelected).toBe(false);
    });

    it('toggles aoiSelected when action.action is null', () => {
      const state = chartingReducer(initialChartingState, { type: TOGGLE_AOI_SELECTED_ON_OFF, action: null });
      expect(state.aoiSelected).toBe(true);
    });

    it('toggles aoiSelected from true to false when action.action is null', () => {
      const selectedState = { ...initialChartingState, aoiSelected: true };
      const state = chartingReducer(selectedState, { type: TOGGLE_AOI_SELECTED_ON_OFF, action: null });
      expect(state.aoiSelected).toBe(false);
    });

    it('toggles aoiSelected when action.action is undefined', () => {
      const state = chartingReducer(initialChartingState, { type: TOGGLE_AOI_SELECTED_ON_OFF });
      expect(state.aoiSelected).toBe(true);
    });
  });

  describe('UPDATE_CHARTING_DATE_SELECTION', () => {
    it('updates timeSpanSelection with the buttonClicked value', () => {
      const state = chartingReducer(initialChartingState, { type: UPDATE_CHARTING_DATE_SELECTION, buttonClicked: 'single' });
      expect(state.timeSpanSelection).toBe('single');
    });
  });

  describe('UPDATE_START_DATE', () => {
    it('updates timeSpanStartDate with the provided date', () => {
      const date = '2024-01-01';
      const state = chartingReducer(initialChartingState, { type: UPDATE_START_DATE, date });
      expect(state.timeSpanStartDate).toBe(date);
    });
  });

  describe('UPDATE_END_DATE', () => {
    it('updates timeSpanEndDate with the provided date', () => {
      const date = '2024-12-31';
      const state = chartingReducer(initialChartingState, { type: UPDATE_END_DATE, date });
      expect(state.timeSpanEndDate).toBe(date);
    });
  });

  describe('UPDATE_ACTIVE_CHART', () => {
    it('updates activeLayer with the provided layerId', () => {
      const state = chartingReducer(initialChartingState, { type: UPDATE_ACTIVE_CHART, layerId: 'layer-123' });
      expect(state.activeLayer).toBe('layer-123');
    });
  });
});

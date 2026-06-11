import uiReducers, { uiState } from './reducers';
import {
  TOGGLE_DISTRACTION_FREE_MODE,
  TOGGLE_KIOSK_MODE,
  SET_ERROR_TILES,
  DISPLAY_STATIC_MAP,
  CLEAR_ERROR_TILES,
  READY_FOR_KIOSK_ANIMATION,
  CHECK_ANIMATION_AVAILABILITY,
  SET_EIC_MEASUREMENT_COMPLETE,
  SET_EIC_MEASUREMENT_ABORTED,
  SET_TRAVELING_HYPERWALL,
  SET_EIC_LEGACY,
} from './constants';

describe('uiReducers', () => {
  it('returns the initial state when no action is provided', () => {
    expect(uiReducers(undefined, {})).toEqual(uiState);
  });

  it('returns the existing state for an unknown action type', () => {
    const currentState = { ...uiState, eic: 'sa' };
    expect(uiReducers(currentState, { type: 'UNKNOWN_ACTION' })).toEqual(currentState);
  });

  it('toggles isDistractionFreeModeActive from false to true on TOGGLE_DISTRACTION_FREE_MODE', () => {
    const state = { ...uiState, isDistractionFreeModeActive: false };
    const result = uiReducers(state, { type: TOGGLE_DISTRACTION_FREE_MODE });
    expect(result.isDistractionFreeModeActive).toBe(true);
  });

  it('toggles isDistractionFreeModeActive from true to false on TOGGLE_DISTRACTION_FREE_MODE', () => {
    const state = { ...uiState, isDistractionFreeModeActive: true };
    const result = uiReducers(state, { type: TOGGLE_DISTRACTION_FREE_MODE });
    expect(result.isDistractionFreeModeActive).toBe(false);
  });

  it('sets isKioskModeActive to true on TOGGLE_KIOSK_MODE', () => {
    const result = uiReducers(uiState, { type: TOGGLE_KIOSK_MODE, isActive: true });
    expect(result.isKioskModeActive).toBe(true);
  });

  it('sets isKioskModeActive to false on TOGGLE_KIOSK_MODE', () => {
    const state = { ...uiState, isKioskModeActive: true };
    const result = uiReducers(state, { type: TOGGLE_KIOSK_MODE, isActive: false });
    expect(result.isKioskModeActive).toBe(false);
  });

  it('sets errorTiles on SET_ERROR_TILES', () => {
    const errorTiles = { tile1: true, tile2: false };
    const result = uiReducers(uiState, { type: SET_ERROR_TILES, errorTiles });
    expect(result.errorTiles).toEqual(errorTiles);
  });

  it('replaces errorTiles on SET_ERROR_TILES with new values', () => {
    const state = { ...uiState, errorTiles: { tile1: true } };
    const errorTiles = { tile2: true };
    const result = uiReducers(state, { type: SET_ERROR_TILES, errorTiles });
    expect(result.errorTiles).toEqual({ tile2: true });
  });

  it('clears errorTiles on CLEAR_ERROR_TILES', () => {
    const state = { ...uiState, errorTiles: { tile1: true } };
    const result = uiReducers(state, { type: CLEAR_ERROR_TILES, errorTiles: {} });
    expect(result.errorTiles).toEqual({});
  });

  it('sets displayStaticMap to true on DISPLAY_STATIC_MAP', () => {
    const result = uiReducers(uiState, { type: DISPLAY_STATIC_MAP, isActive: true });
    expect(result.displayStaticMap).toBe(true);
  });

  it('sets displayStaticMap to false on DISPLAY_STATIC_MAP', () => {
    const state = { ...uiState, displayStaticMap: true };
    const result = uiReducers(state, { type: DISPLAY_STATIC_MAP, isActive: false });
    expect(result.displayStaticMap).toBe(false);
  });

  it('sets readyForKioskAnimation to true on READY_FOR_KIOSK_ANIMATION', () => {
    const result = uiReducers(uiState, { type: READY_FOR_KIOSK_ANIMATION, toggleAnimation: true });
    expect(result.readyForKioskAnimation).toBe(true);
  });

  it('sets readyForKioskAnimation to false on READY_FOR_KIOSK_ANIMATION', () => {
    const state = { ...uiState, readyForKioskAnimation: true };
    const result = uiReducers(state, { type: READY_FOR_KIOSK_ANIMATION, toggleAnimation: false });
    expect(result.readyForKioskAnimation).toBe(false);
  });

  it('sets animationAvailabilityChecked to true on CHECK_ANIMATION_AVAILABILITY', () => {
    const result = uiReducers(uiState, { type: CHECK_ANIMATION_AVAILABILITY, toggleCheck: true });
    expect(result.animationAvailabilityChecked).toBe(true);
  });

  it('sets animationAvailabilityChecked to false on CHECK_ANIMATION_AVAILABILITY', () => {
    const state = { ...uiState, animationAvailabilityChecked: true };
    const result = uiReducers(state, { type: CHECK_ANIMATION_AVAILABILITY, toggleCheck: false });
    expect(result.animationAvailabilityChecked).toBe(false);
  });

  it('sets eicMeasurementComplete to true on SET_EIC_MEASUREMENT_COMPLETE', () => {
    const result = uiReducers(uiState, { type: SET_EIC_MEASUREMENT_COMPLETE });
    expect(result.eicMeasurementComplete).toBe(true);
  });

  it('does not modify other state properties on SET_EIC_MEASUREMENT_COMPLETE', () => {
    const result = uiReducers(uiState, { type: SET_EIC_MEASUREMENT_COMPLETE });
    expect(result.eicMeasurementAborted).toBe(false);
    expect(result.isKioskModeActive).toBe(false);
  });

  it('sets eicMeasurementAborted to true on SET_EIC_MEASUREMENT_ABORTED', () => {
    const result = uiReducers(uiState, { type: SET_EIC_MEASUREMENT_ABORTED });
    expect(result.eicMeasurementAborted).toBe(true);
  });

  it('does not modify other state properties on SET_EIC_MEASUREMENT_ABORTED', () => {
    const result = uiReducers(uiState, { type: SET_EIC_MEASUREMENT_ABORTED });
    expect(result.eicMeasurementComplete).toBe(false);
    expect(result.isKioskModeActive).toBe(false);
  });

  it('sets travelMode on SET_TRAVELING_HYPERWALL', () => {
    const result = uiReducers(uiState, { type: SET_TRAVELING_HYPERWALL, travelMode: 'hyperwall' });
    expect(result.travelMode).toBe('hyperwall');
  });

  it('sets travelMode to empty string on SET_TRAVELING_HYPERWALL', () => {
    const state = { ...uiState, travelMode: 'hyperwall' };
    const result = uiReducers(state, { type: SET_TRAVELING_HYPERWALL, travelMode: '' });
    expect(result.travelMode).toBe('');
  });

  it('sets eicLegacy to true on SET_EIC_LEGACY', () => {
    const result = uiReducers(uiState, { type: SET_EIC_LEGACY, isLegacy: true });
    expect(result.eicLegacy).toBe(true);
  });

  it('sets eicLegacy to false on SET_EIC_LEGACY', () => {
    const state = { ...uiState, eicLegacy: true };
    const result = uiReducers(state, { type: SET_EIC_LEGACY, isLegacy: false });
    expect(result.eicLegacy).toBe(false);
  });

  it('does not mutate the original state', () => {
    const state = { ...uiState };
    const frozen = Object.freeze(state);
    expect(() => uiReducers(frozen, { type: TOGGLE_DISTRACTION_FREE_MODE })).not.toThrow();
  });

  it('preserves unrelated state properties when handling an action', () => {
    const state = { ...uiState, eic: 'sa', scenario: 'test-scenario' };
    const result = uiReducers(state, { type: SET_EIC_LEGACY, isLegacy: true });
    expect(result.eic).toBe('sa');
    expect(result.scenario).toBe('test-scenario');
  });
});

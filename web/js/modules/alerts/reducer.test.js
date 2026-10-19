import { alertReducer, defaultAlertState } from './reducer';
import {
  DISABLE_VECTOR_ZOOM_ALERT,
  ACTIVATE_VECTOR_ZOOM_ALERT,
  DISABLE_VECTOR_EXCEEDED_ALERT,
  ACTIVATE_VECTOR_EXCEEDED_ALERT,
  ACTIVATE_DDV_ZOOM_ALERT,
  ACTIVATE_DDV_LOCATION_ALERT,
  DEACTIVATE_DDV_ZOOM_ALERT,
  DEACTIVATE_DDV_LOCATION_ALERT,
} from './constants';
import { REMOVE_LAYER, REMOVE_GROUP } from '../layers/constants';
import { UPDATE_MAP_EXTENT } from '../map/constants';

jest.mock('../layers/util', () => ({
  hasVectorLayers: jest.fn(),
}));
import { hasVectorLayers } from '../layers/util';

describe('alertReducer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Should return the initial state [alert-initial-state]', () => {
    expect(alertReducer(undefined, {})).toEqual(defaultAlertState);
  });

  test('DISABLE_VECTOR_ZOOM_ALERT should disable vector zoom alert state [alert-disable-vector-zoom]', () => {
    expect(alertReducer(
      { ...defaultAlertState, isVectorZoomAlertPresent: true },
      { type: DISABLE_VECTOR_ZOOM_ALERT },
    )).toEqual(defaultAlertState);
  });

  test('ACTIVATE_VECTOR_ZOOM_ALERT should enable vector zoom alert state [alert-activate-vector-zoom]', () => {
    const vectorZoomEnabledState = { ...defaultAlertState, isVectorZoomAlertPresent: true };
    expect(alertReducer(
      undefined,
      { type: ACTIVATE_VECTOR_ZOOM_ALERT },
    )).toEqual(vectorZoomEnabledState);
  });

  test('DISABLE_VECTOR_EXCEEDED_ALERT should disable vector exceeded results alert state [alert-disable-vector-exceed]', () => {
    expect(alertReducer(
      { ...defaultAlertState, isVectorExceededAlertPresent: true },
      { type: DISABLE_VECTOR_EXCEEDED_ALERT },
    )).toEqual(defaultAlertState);
  });

  test('ACTIVATE_VECTOR_EXCEEDED_ALERT should enable vector exceeded results alert state [alert-activate-vector-exceed]', () => {
    const vectorExceededEnabledState = { ...defaultAlertState, isVectorExceededAlertPresent: true };
    expect(alertReducer(
      undefined,
      { type: ACTIVATE_VECTOR_EXCEEDED_ALERT },
    )).toEqual(vectorExceededEnabledState);
  });

  test('ACTIVATE_VECTOR_EXCEEDED_ALERT should also disable vector zoom alert [alert-activate-vector-exceed-clears-zoom]', () => {
    const result = alertReducer(
      { ...defaultAlertState, isVectorZoomAlertPresent: true },
      { type: ACTIVATE_VECTOR_EXCEEDED_ALERT },
    );
    expect(result.isVectorExceededAlertPresent).toBe(true);
    expect(result.isVectorZoomAlertPresent).toBe(false);
  });

  test('UPDATE_MAP_EXTENT should disable vector exceeded alert [alert-update-map-extent]', () => {
    expect(alertReducer(
      { ...defaultAlertState, isVectorExceededAlertPresent: true },
      { type: UPDATE_MAP_EXTENT },
    )).toEqual(defaultAlertState);
  });

  test('REMOVE_LAYER should return state unchanged when no vector alerts are present [alert-remove-layer-no-alerts]', () => {
    const state = { ...defaultAlertState };
    const result = alertReducer(state, { type: REMOVE_LAYER, layers: [] });
    expect(result).toBe(state);
  });

  test('REMOVE_LAYER should clear vector alerts when no vector layers remain [alert-remove-layer-clears-alerts]', () => {
    hasVectorLayers.mockReturnValue(false);
    const state = { ...defaultAlertState, isVectorZoomAlertPresent: true };
    const result = alertReducer(state, { type: REMOVE_LAYER, layers: [] });
    expect(result.isVectorZoomAlertPresent).toBe(false);
    expect(result.isVectorExceededAlertPresent).toBe(false);
  });

  test('REMOVE_LAYER should keep alerts when vector layers still exist [alert-remove-layer-keeps-alerts]', () => {
    hasVectorLayers.mockReturnValue(true);
    const state = { ...defaultAlertState, isVectorZoomAlertPresent: true };
    const result = alertReducer(state, { type: REMOVE_LAYER, layers: [{}] });
    expect(result).toBe(state);
  });

  test('REMOVE_GROUP should return state unchanged when no vector alerts are present [alert-remove-group-no-alerts]', () => {
    const state = { ...defaultAlertState };
    const result = alertReducer(state, { type: REMOVE_GROUP, layers: [] });
    expect(result).toBe(state);
  });

  test('REMOVE_GROUP should clear vector alerts when no vector layers remain [alert-remove-group-clears-alerts]', () => {
    hasVectorLayers.mockReturnValue(false);
    const state = { ...defaultAlertState, isVectorExceededAlertPresent: true };
    const result = alertReducer(state, { type: REMOVE_GROUP, layers: [] });
    expect(result.isVectorZoomAlertPresent).toBe(false);
    expect(result.isVectorExceededAlertPresent).toBe(false);
  });

  test('ACTIVATE_DDV_ZOOM_ALERT should set isDDVZoomAlertPresent and append title [alert-activate-ddv-zoom]', () => {
    const result = alertReducer(undefined, { type: ACTIVATE_DDV_ZOOM_ALERT, title: 'Layer A' });
    expect(result.isDDVZoomAlertPresent).toBe(true);
    expect(result.ddvZoomAlerts).toEqual(['Layer A']);
  });

  test('ACTIVATE_DDV_LOCATION_ALERT should set isDDVLocationAlertPresent and append title [alert-activate-ddv-location]', () => {
    const result = alertReducer(undefined, { type: ACTIVATE_DDV_LOCATION_ALERT, title: 'Layer B' });
    expect(result.isDDVLocationAlertPresent).toBe(true);
    expect(result.ddvLocationAlerts).toEqual(['Layer B']);
  });

  test('DEACTIVATE_DDV_ZOOM_ALERT should remove title and set isDDVZoomAlertPresent false when one alert remains [alert-deactivate-ddv-zoom-last]', () => {
    const state = { ...defaultAlertState, isDDVZoomAlertPresent: true, ddvZoomAlerts: ['Layer A'] };
    const result = alertReducer(state, { type: DEACTIVATE_DDV_ZOOM_ALERT, title: 'Layer A' });
    expect(result.isDDVZoomAlertPresent).toBe(false);
    expect(result.ddvZoomAlerts).toEqual([]);
  });

  test('DEACTIVATE_DDV_ZOOM_ALERT should keep isDDVZoomAlertPresent true when multiple alerts remain [alert-deactivate-ddv-zoom-multiple]', () => {
    const state = { ...defaultAlertState, isDDVZoomAlertPresent: true, ddvZoomAlerts: ['Layer A', 'Layer B'] };
    const result = alertReducer(state, { type: DEACTIVATE_DDV_ZOOM_ALERT, title: 'Layer A' });
    expect(result.isDDVZoomAlertPresent).toBe(true);
    expect(result.ddvZoomAlerts).toEqual(['Layer B']);
  });

  test('DEACTIVATE_DDV_LOCATION_ALERT should remove title and set isDDVLocationAlertPresent false when one alert remains [alert-deactivate-ddv-location-last]', () => {
    const state = { ...defaultAlertState, isDDVLocationAlertPresent: true, ddvLocationAlerts: ['Layer C'] };
    const result = alertReducer(state, { type: DEACTIVATE_DDV_LOCATION_ALERT, title: 'Layer C' });
    expect(result.isDDVLocationAlertPresent).toBe(false);
    expect(result.ddvLocationAlerts).toEqual([]);
  });

  test('DEACTIVATE_DDV_LOCATION_ALERT should keep isDDVLocationAlertPresent true when multiple alerts remain [alert-deactivate-ddv-location-multiple]', () => {
    const state = { ...defaultAlertState, isDDVLocationAlertPresent: true, ddvLocationAlerts: ['Layer C', 'Layer D'] };
    const result = alertReducer(state, { type: DEACTIVATE_DDV_LOCATION_ALERT, title: 'Layer C' });
    expect(result.isDDVLocationAlertPresent).toBe(true);
    expect(result.ddvLocationAlerts).toEqual(['Layer D']);
  });
});

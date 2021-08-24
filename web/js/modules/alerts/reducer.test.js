import { alertReducer, defaultAlertState } from './reducer';
import { ACTIVATE_VECTOR_ZOOM_ALERT, DISABLE_VECTOR_ZOOM_ALERT } from './constants';

describe('alertReducer', () => {
  test('should return the initial state', () => {
    expect(alertReducer(undefined, {})).toEqual(
      defaultAlertState,
    );
  });
  test('DISABLE_VECTOR_ZOOM_ALERT should disable vector alert state', () => {
    expect(alertReducer(
      { ...defaultAlertState, isVectorZoomAlertPresent: true },
      { type: DISABLE_VECTOR_ZOOM_ALERT },
    )).toEqual(
      defaultAlertState,
    );
  });
  test('ACTIVATE_VECTOR_ZOOM_ALERT should enable vector alert state', () => {
    const vectorEnabledState = { ...defaultAlertState, isVectorZoomAlertPresent: true };
    expect(alertReducer(undefined,
      { type: ACTIVATE_VECTOR_ZOOM_ALERT })).toEqual(vectorEnabledState);
  });
});

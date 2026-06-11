import { alertReducer, defaultAlertState } from './reducer';
import {
  DISABLE_VECTOR_ZOOM_ALERT,
  ACTIVATE_VECTOR_ZOOM_ALERT,
  DISABLE_VECTOR_EXCEEDED_ALERT,
  ACTIVATE_VECTOR_EXCEEDED_ALERT,
} from './constants';

describe('alertReducer', () => {
  test('Should return the initial state [alert-initial-state]', () => {
    expect(alertReducer(undefined, {})).toEqual(
      defaultAlertState,
    );
  });
  test('DISABLE_VECTOR_ZOOM_ALERT should disable vector zoom alert state [alert-disable-vector-zoom]', () => {
    expect(alertReducer(
      { ...defaultAlertState, isVectorZoomAlertPresent: true },
      { type: DISABLE_VECTOR_ZOOM_ALERT },
    )).toEqual(
      defaultAlertState,
    );
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
    )).toEqual(
      defaultAlertState,
    );
  });
  test('ACTIVATE_VECTOR_EXCEEDED_ALERT should enable vector exceeded results alert state [alert-activate-vector-exceed]', () => {
    const vectorExceededEnabledState = { ...defaultAlertState, isVectorExceededAlertPresent: true };
    expect(alertReducer(
      undefined,
      { type: ACTIVATE_VECTOR_EXCEEDED_ALERT },
    )).toEqual(vectorExceededEnabledState);
  });
});

import { alertReducer, defaultAlertState } from './reducer';
import { ACTIVATE_VECTOR_ALERT, DISABLE_VECTOR_ALERT, TOGGLE_VECTOR_ALERT } from './constants';

describe('alertReducer', () => {
  test('should return the initial state', () => {
    expect(alertReducer(undefined, {})).toEqual(
      defaultAlertState,
    );
  });
  test('DISABLE_VECTOR_ALERT should disable vector alert state', () => {
    expect(alertReducer(
      { ...defaultAlertState, isVectorAlertActive: true },
      { type: DISABLE_VECTOR_ALERT },
    )).toEqual(
      defaultAlertState,
    );
  });
  test('ACTIVATE_VECTOR_ALERT should enable vector alert state', () => {
    const vectorEnabledState = { ...defaultAlertState, isVectorAlertActive: true };
    expect(alertReducer(undefined,
      { type: ACTIVATE_VECTOR_ALERT })).toEqual(vectorEnabledState);
  });
  test('TOGGLE_VECTOR_ALERT should toggle vector alert state', () => {
    const vectorEnabledState = { ...defaultAlertState, isVectorAlertActive: true };
    expect(alertReducer(undefined,
      { type: TOGGLE_VECTOR_ALERT })).toEqual(vectorEnabledState);
    expect(alertReducer(
      { ...defaultAlertState, isVectorAlertActive: true },
      { type: TOGGLE_VECTOR_ALERT },
    )).toEqual(
      defaultAlertState,
    );
  });
});

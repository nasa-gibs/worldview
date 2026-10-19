import {
  CHANGE_UNITS,
  UPDATE_MEASUREMENTS,
  TOGGLE_MEASURE_ACTIVE,
} from './constants';

import {
  changeUnits,
  toggleMeasureActive,
  updateMeasurements,
} from './actions';

describe('Measure modules actions', () => {
  test('changeUnits returns action with type CHANGE_UNITS and value [measure-actions-change-units]', () => {
    expect(changeUnits('miles')).toEqual({ type: CHANGE_UNITS, value: 'miles' });
  });

  test('toggleMeasureActive returns action with type TOGGLE_MEASURE_ACTIVE and value [measure-actions-toggle-measure-active]', () => {
    expect(toggleMeasureActive(true)).toEqual({ type: TOGGLE_MEASURE_ACTIVE, value: true });
  });

  test('updateMeasurements returns action with type UPDATE_MEASUREMENTS and value [measure-actions-update-measurements]', () => {
    const measurements = { EPSG4326: { distance: 100 } };
    expect(updateMeasurements(measurements))
      .toEqual({ type: UPDATE_MEASUREMENTS, value: measurements });
  });
});

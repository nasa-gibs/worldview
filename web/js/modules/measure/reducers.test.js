import {
  CHANGE_UNITS,
  UPDATE_MEASUREMENTS,
  TOGGLE_MEASURE_ACTIVE,
} from './constants';
import { CRS } from '../map/constants';

import measureReducer from './reducers';

const defaultState = {
  isActive: false,
  unitOfMeasure: 'km',
  allMeasurements: {
    ...Object.values(CRS)
      .reduce((prev, key) => ({
        ...prev,
        [key]: {},
      }), {}),
  },
};

describe('Measure module reducers', () => {
  test('returns default state [measure-reducers-default-state]', () => {
    expect(measureReducer(undefined, {})).toEqual(defaultState);
  });

  test('returns state with updated unit of measure [measure-reducers-change-units]', () => {
    const action = { type: CHANGE_UNITS, value: 'miles' };
    expect(measureReducer(defaultState, action)).toEqual({
      ...defaultState,
      unitOfMeasure: 'miles',
    });
  });

  test('returns state with updated isActive [measure-reducers-toggle-measure-active]', () => {
    const action = { type: TOGGLE_MEASURE_ACTIVE, value: true };
    expect(measureReducer(defaultState, action)).toEqual({
      ...defaultState,
      isActive: true,
    });
  });

  test('returns state with updated measurements [measure-reducers-update-measurements]', () => {
    const measurements = { EPSG4326: { distance: 100 } };
    const action = { type: UPDATE_MEASUREMENTS, value: measurements };
    expect(measureReducer(defaultState, action)).toEqual({
      ...defaultState,
      allMeasurements: measurements,
    });
  });
});

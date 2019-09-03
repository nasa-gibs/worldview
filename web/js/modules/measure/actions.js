import { CHANGE_UNITS, USE_GREAT_CIRCLE } from './constants';

export function changeUnits(units) {
  return {
    type: CHANGE_UNITS,
    value: units
  };
}
export function useGreatCircle(value) {
  return {
    type: USE_GREAT_CIRCLE,
    value
  };
}

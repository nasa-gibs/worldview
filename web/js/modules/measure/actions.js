import { CHANGE_UNITS } from './constants';

export function changeUnits(unit) {
  return {
    type: CHANGE_UNITS,
    value: unit
  };
}

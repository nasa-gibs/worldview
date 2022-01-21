import { timeScaleFromNumberKey } from './constants';

export function getDates (state) {
  const { date } = state;
  const { selected, selectedB } = date;
  return { selected, selectedB };
}

export function getSelectedDate (state, compareDateString) {
  const { date, compare } = state;
  if (compareDateString) {
    return date[compareDateString];
  }
  return date[compare.isCompareA ? 'selected' : 'selectedB'];
}

export function getDeltaIntervalUnit (state) {
  const {
    customSelected, customDelta, delta, customInterval, interval,
  } = state.date;
  const useDelta = customSelected ? customDelta : delta;
  const useInterval = customSelected ? customInterval : interval;
  const changeUnit = timeScaleFromNumberKey[useInterval];

  return {
    delta: useDelta,
    interval: useInterval,
    unit: changeUnit,
  };
}

import {
  TOGGLE_INFINITE_WRAP, TOGGLE_VISIBLE_DATELINES, TOGGLE_OVERVIEW_MAP, TOGGLE_DAY_NIGHT_MODE,
} from './constants';

export function toggleInfiniteWrap() {
  return {
    type: TOGGLE_INFINITE_WRAP,
  };
}

export function toggleOverviewMap() {
  return {
    type: TOGGLE_OVERVIEW_MAP,
  };
}

export function toggleDatelines() {
  return {
    type: TOGGLE_VISIBLE_DATELINES,
  };
}
export function toggleDayNightMode() {
  return {
    type: TOGGLE_DAY_NIGHT_MODE,
  };
}

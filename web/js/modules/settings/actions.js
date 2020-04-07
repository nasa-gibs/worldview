import { TOGGLE_INFINITE_WRAP, TOGGLE_OVERVIEW_MAP } from './constants';

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

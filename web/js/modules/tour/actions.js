import { START, UPDATE_SELECTED, END_TOUR } from './constants';

export function startTour() {
  return {
    type: START,
  };
}
export function selectStory(id) {
  return {
    type: UPDATE_SELECTED,
    id,
  };
}
export function endTour() {
  return { type: END_TOUR };
}

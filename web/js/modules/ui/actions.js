import { TOGGLE_DISTRACTION_FREE_MODE } from './constants';

export function toggleDistractionFreeMode() {
  return (dispatch) => {
    dispatch({
      type: TOGGLE_DISTRACTION_FREE_MODE
    });
  };
}

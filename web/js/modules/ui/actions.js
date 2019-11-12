import { TOGGLE_DISTRACTION_FREE_MODE } from './constants';

export function toggleDistractionFreeMode() {
  return (dispatch, getState) => {
    const newisDistractionFreeModeActive = getState().ui.isDistractionFreeModeActive;
    dispatch({
      type: TOGGLE_DISTRACTION_FREE_MODE,
      isDistractionFreeModeActive: !newisDistractionFreeModeActive
    });
  };
}

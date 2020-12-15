import googleTagManager from 'googleTagManager';

import { TOGGLE_DISTRACTION_FREE_MODE } from './constants';
import { CLOSE as CLOSE_MODAL } from '../modal/constants';


// eslint-disable-next-line import/prefer-default-export
export function toggleDistractionFreeMode() {
  return (dispatch, getState) => {
    const { modal, ui } = getState();
    const { isDistractionFreeModeActive } = ui;
    const modalIsOpen = modal.isOpen;
    if (!isDistractionFreeModeActive) {
      googleTagManager.pushEvent({
        event: 'init_distraction_free_mode',
      });
    }
    dispatch({
      type: TOGGLE_DISTRACTION_FREE_MODE,
      isDistractionFreeModeActive: !isDistractionFreeModeActive,
    });
    if (!isDistractionFreeModeActive && modalIsOpen) {
      dispatch({ type: CLOSE_MODAL });
    }
  };
}

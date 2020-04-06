import { KEY_PRESS_ACTION as ANIMATION_KEY_PRESS_ACTION } from '../animation/constants';
import { TOUR_KEY_PRESS_CLOSE } from '../tour/constants';
import { TOGGLE_DISTRACTION_FREE_MODE } from '../ui/constants';
import { CLOSE as CLOSE_MODAL } from '../modal/constants';

/**
 * Function to dispatch actions
 * based on keyCode and active
 * State
 *
 * @param {Number} keyCode
 * @param {Boolean} is shiftKey down
 */
export default function keyPress(keyCode, shiftKey, ctrlOrCmdKey) {
  return (dispatch, getState) => {
    const {
      modal, animation, tour, ui,
    } = getState();
    const modalIsOpen = modal.isOpen;
    const { isDistractionFreeModeActive } = ui;
    if (animation.isActive && !modalIsOpen) {
      // can get more specific modal.key !== "LAYER_PICKER_COMPONENT"
      dispatch({
        type: ANIMATION_KEY_PRESS_ACTION,
        keyCode,
      });
    }
    if (tour.active && keyCode === 27) {
      dispatch({
        type: TOUR_KEY_PRESS_CLOSE,
      });
    }
    if (!ctrlOrCmdKey && shiftKey && keyCode === 68) {
      dispatch({ type: TOGGLE_DISTRACTION_FREE_MODE });
      if (!isDistractionFreeModeActive && modalIsOpen) {
        dispatch({ type: CLOSE_MODAL });
      }
    }
    if (isDistractionFreeModeActive && keyCode === 27) {
      dispatch({ type: TOGGLE_DISTRACTION_FREE_MODE });
    }
  };
}

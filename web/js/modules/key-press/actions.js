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
 * @param {Boolean} is ctrlOrCmdKey down
 * @param {Boolean} is key pressed within an INPUT element
 */
export default function keyPress(keyCode, shiftKey, ctrlOrCmdKey, isInput) {
  return (dispatch, getState) => {
    const {
      modal, animation, tour, ui,
    } = getState();
    const {
      id,
      isOpen,
    } = modal;
    const { isDistractionFreeModeActive } = ui;
    const isProductPickerOpen = isOpen && id === 'LAYER_PICKER_COMPONENT';
    if (tour.active && keyCode === 27) {
      dispatch({
        type: TOUR_KEY_PRESS_CLOSE,
      });
    } else if (!isProductPickerOpen) {
      const isLocationSearchInputFocused = document.activeElement.id === 'location-search-autocomplete';
      if (animation.isActive && !isLocationSearchInputFocused) {
        dispatch({
          type: ANIMATION_KEY_PRESS_ACTION,
          keyCode,
        });
      }
      if (!isInput && !ctrlOrCmdKey && shiftKey && keyCode === 68) {
        dispatch({ type: TOGGLE_DISTRACTION_FREE_MODE });
        if (!isDistractionFreeModeActive && isOpen) {
          dispatch({ type: CLOSE_MODAL });
        }
      } else if (keyCode === 27) {
        if (!isInput && isDistractionFreeModeActive) {
          dispatch({ type: TOGGLE_DISTRACTION_FREE_MODE });
        } else {
          dispatch({ type: CLOSE_MODAL });
        }
      }
    }
  };
}

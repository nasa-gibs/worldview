import { KEY_PRESS_ACTION as ANIMATION_KEY_PRESS_ACTION } from '../animation/constants';
import { TOUR_KEY_PRESS_CLOSE } from '../tour/constants';
import { TOGGLE_DISTRACTION_FREE_MODE } from '../ui/constants';
import { triggerTodayButton } from '../date/actions';
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
    if (tour.active && keyCode === 27) { // ESC
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
      if (!isInput && !ctrlOrCmdKey && shiftKey) {
        if (keyCode === 68) { // SHIFT D
          dispatch({ type: TOGGLE_DISTRACTION_FREE_MODE });
          if (!isDistractionFreeModeActive && isOpen) {
            dispatch({ type: CLOSE_MODAL });
          }
        } else if (keyCode === 84) { // SHIFT T
          dispatch(triggerTodayButton());
        }
      } else if (keyCode === 27) { // ESC
        if (!isInput && isDistractionFreeModeActive) {
          dispatch({ type: TOGGLE_DISTRACTION_FREE_MODE });
        } else {
          dispatch({ type: CLOSE_MODAL });
        }
      }
    }
  };
}

import { KEY_PRESS_ACTION as ANIMATION_KEY_PRESS_ACTION } from '../animation/constants';

/**
 * Function to dispatch actions
 * based on keyCode and active
 * State
 *
 * @param {Number} keyCode
 */
export function keyPress(keyCode) {
  return (dispatch, getState) => {
    const { modal, animation } = getState();
    if (animation.isActive && !modal.isOpen) {
      // can get more specific modal.key !== "LAYER_PICKER_COMPONENT"
      dispatch({
        type: ANIMATION_KEY_PRESS_ACTION,
        keyCode
      });
    }
  };
}

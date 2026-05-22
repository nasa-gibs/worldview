// import { KEY_PRESS_ACTION as ANIMATION_KEY_PRESS_ACTION } from '../animation/constants';
import { TOUR_KEY_PRESS_CLOSE } from '../tour/constants';
import { TOGGLE_DISTRACTION_FREE_MODE } from '../ui/constants';
import { triggerTodayButton } from '../date/actions';
import { CLOSE as CLOSE_MODAL } from '../modal/constants';
import keyPress from './actions';

jest.mock('../date/actions', () => ({
  triggerTodayButton: jest.fn(() => ({ type: 'TRIGGER_TODAY_BUTTON' })),
}));

describe('keyPress action', () => {
  it('dispatches the correct action for ESC key when tour is active', () => {
    const dispatch = jest.fn();
    const getState = () => ({
      modal: { id: 'TEST_MODAL', isOpen: true },
      animation: { isActive: false },
      tour: { active: true },
      ui: { isDistractionFreeModeActive: false },
    });

    keyPress(27, false, false, false)(dispatch, getState);

    expect(dispatch).toHaveBeenCalledWith({ type: TOUR_KEY_PRESS_CLOSE });
  });

  it('dispatches the correct action for SHIFT + D when not in input and distraction free mode is toggled', () => {
    const dispatch = jest.fn();
    const getState = () => ({
      modal: { id: 'TEST_MODAL', isOpen: true },
      animation: { isActive: false },
      tour: { active: false },
      ui: { isDistractionFreeModeActive: false },
    });

    keyPress(68, true, false, false)(dispatch, getState);

    expect(dispatch).toHaveBeenCalledWith({ type: TOGGLE_DISTRACTION_FREE_MODE });
    expect(dispatch).toHaveBeenCalledWith({ type: CLOSE_MODAL });
  });

  it('dispatches the correct action for SHIFT + T when not in input', () => {
    const dispatch = jest.fn();
    const getState = () => ({
      modal: { id: 'TEST_MODAL', isOpen: true },
      animation: { isActive: false },
      tour: { active: false },
      ui: { isDistractionFreeModeActive: false },
    });

    keyPress(84, true, false, false)(dispatch, getState);

    expect(dispatch).toHaveBeenCalledWith(triggerTodayButton());
  });

  it('dispatches the correct action for ESC key when in distraction free mode', () => {
    const dispatch = jest.fn();
    const getState = () => ({
      modal: { id: 'TEST_MODAL', isOpen: true },
      animation: { isActive: false },
      tour: { active: false },
      ui: { isDistractionFreeModeActive: true },
    });

    keyPress(27, false, false, false)(dispatch, getState);

    expect(dispatch).toHaveBeenCalledWith({ type: TOGGLE_DISTRACTION_FREE_MODE });
  });

  it('dispatches the correct action for ESC key when not in distraction free mode', () => {
    const dispatch = jest.fn();
    const getState = () => ({
      modal: { id: 'TEST_MODAL', isOpen: true },
      animation: { isActive: false },
      tour: { active: false },
      ui: { isDistractionFreeModeActive: false },
    });

    keyPress(27, false, false, false)(dispatch, getState);

    expect(dispatch).toHaveBeenCalledWith({ type: CLOSE_MODAL });
  });
});

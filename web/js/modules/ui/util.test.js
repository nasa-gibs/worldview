import {
  TOGGLE_KIOSK_MODE,
  DISPLAY_STATIC_MAP,
  READY_FOR_KIOSK_ANIMATION,
} from './constants';
import uiReducers, { uiState } from './reducers';

describe('uiReducers', () => {
  it('Handles toggle kiosk mode action [ui-reducer-enter-kiosk-mode]', () => {
    const isActive = true;
    const action = {
      type: TOGGLE_KIOSK_MODE,
      isActive,
    };

    const expectedState = {
      ...uiState,
      isKioskModeActive: isActive,
    };

    expect(uiReducers(uiState, action)).toEqual(expectedState);
  });

  it('Handles display static map action [ui-reducer-display-static-map]', () => {
    const isActive = true;
    const action = {
      type: DISPLAY_STATIC_MAP,
      isActive,
    };

    const expectedState = {
      ...uiState,
      displayStaticMap: isActive,
    };

    expect(uiReducers(uiState, action)).toEqual(expectedState);
  });

  it('Handles ready for kiosk animation action [ui-reducer-ready-for-animation]', () => {
    const toggleAnimation = true;
    const action = {
      type: READY_FOR_KIOSK_ANIMATION,
      toggleAnimation,
    };

    const expectedState = {
      ...uiState,
      readyForKioskAnimation: toggleAnimation,
    };

    expect(uiReducers(uiState, action)).toEqual(expectedState);
  });
});

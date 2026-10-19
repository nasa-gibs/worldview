import configureStore from 'redux-mock-store';
import {thunk} from 'redux-thunk';

import toggleDistractionFreeMode, {
  toggleKioskMode,
  toggleStaticMap,
  toggleReadyForKioskAnimation,
  toggleCheckedAnimationAvailability,
  setEICMeasurementComplete,
  setEICMeasurementAborted,
  setTravelMode,
  setEICLegacy,
} from './actions';

import {
  TOGGLE_DISTRACTION_FREE_MODE,
  TOGGLE_KIOSK_MODE,
  DISPLAY_STATIC_MAP,
  READY_FOR_KIOSK_ANIMATION,
  CHECK_ANIMATION_AVAILABILITY,
  SET_EIC_MEASUREMENT_COMPLETE,
  SET_EIC_MEASUREMENT_ABORTED,
  SET_TRAVELING_HYPERWALL,
  SET_EIC_LEGACY,
} from './constants';

import { CLOSE as CLOSE_MODAL } from '../modal/constants';

jest.mock('googleTagManager', () => ({
  pushEvent: jest.fn(),
}));

import googleTagManager from 'googleTagManager';

const middleware = [thunk];
const mockStore = configureStore(middleware);

describe('toggleDistractionFreeMode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('dispatches TOGGLE_DISTRACTION_FREE_MODE with true when distraction free mode is inactive and modal is closed', () => {
    const store = mockStore({
      ui: { isDistractionFreeModeActive: false },
      modal: { isOpen: false },
    });

    store.dispatch(toggleDistractionFreeMode());

    const actions = store.getActions();
    expect(actions).toHaveLength(1);
    expect(actions[0]).toEqual({
      type: TOGGLE_DISTRACTION_FREE_MODE,
      isDistractionFreeModeActive: true,
    });
  });

  it('calls googleTagManager.pushEvent when distraction free mode is inactive', () => {
    const store = mockStore({
      ui: { isDistractionFreeModeActive: false },
      modal: { isOpen: false },
    });

    store.dispatch(toggleDistractionFreeMode());

    expect(googleTagManager.pushEvent).toHaveBeenCalledWith({
      event: 'init_distraction_free_mode',
    });
  });

  it('does not call googleTagManager.pushEvent when distraction free mode is already active', () => {
    const store = mockStore({
      ui: { isDistractionFreeModeActive: true },
      modal: { isOpen: false },
    });

    store.dispatch(toggleDistractionFreeMode());

    expect(googleTagManager.pushEvent).not.toHaveBeenCalled();
  });

  it('dispatches TOGGLE_DISTRACTION_FREE_MODE with false when distraction free mode is active', () => {
    const store = mockStore({
      ui: { isDistractionFreeModeActive: true },
      modal: { isOpen: false },
    });

    store.dispatch(toggleDistractionFreeMode());

    const actions = store.getActions();
    expect(actions).toHaveLength(1);
    expect(actions[0]).toEqual({
      type: TOGGLE_DISTRACTION_FREE_MODE,
      isDistractionFreeModeActive: false,
    });
  });

  it('dispatches CLOSE_MODAL when distraction free mode is inactive and modal is open', () => {
    const store = mockStore({
      ui: { isDistractionFreeModeActive: false },
      modal: { isOpen: true },
    });

    store.dispatch(toggleDistractionFreeMode());

    const actions = store.getActions();
    expect(actions).toHaveLength(2);
    expect(actions[0]).toEqual({
      type: TOGGLE_DISTRACTION_FREE_MODE,
      isDistractionFreeModeActive: true,
    });
    expect(actions[1]).toEqual({ type: CLOSE_MODAL });
  });

  it('does not dispatch CLOSE_MODAL when distraction free mode is active and modal is open', () => {
    const store = mockStore({
      ui: { isDistractionFreeModeActive: true },
      modal: { isOpen: true },
    });

    store.dispatch(toggleDistractionFreeMode());

    const actions = store.getActions();
    expect(actions).toHaveLength(1);
    expect(actions[0].type).toBe(TOGGLE_DISTRACTION_FREE_MODE);
  });

  it('does not dispatch CLOSE_MODAL when distraction free mode is inactive and modal is closed', () => {
    const store = mockStore({
      ui: { isDistractionFreeModeActive: false },
      modal: { isOpen: false },
    });

    store.dispatch(toggleDistractionFreeMode());

    const actions = store.getActions();
    expect(actions).toHaveLength(1);
    expect(actions[0].type).toBe(TOGGLE_DISTRACTION_FREE_MODE);
  });
});

describe('toggleKioskMode', () => {
  it('returns the correct action when isActive is true', () => {
    expect(toggleKioskMode(true)).toEqual({
      type: TOGGLE_KIOSK_MODE,
      isActive: true,
    });
  });

  it('returns the correct action when isActive is false', () => {
    expect(toggleKioskMode(false)).toEqual({
      type: TOGGLE_KIOSK_MODE,
      isActive: false,
    });
  });
});

describe('toggleStaticMap', () => {
  it('returns the correct action when isActive is true', () => {
    expect(toggleStaticMap(true)).toEqual({
      type: DISPLAY_STATIC_MAP,
      isActive: true,
    });
  });

  it('returns the correct action when isActive is false', () => {
    expect(toggleStaticMap(false)).toEqual({
      type: DISPLAY_STATIC_MAP,
      isActive: false,
    });
  });
});

describe('toggleReadyForKioskAnimation', () => {
  it('returns the correct action when toggleAnimation is true', () => {
    expect(toggleReadyForKioskAnimation(true)).toEqual({
      type: READY_FOR_KIOSK_ANIMATION,
      toggleAnimation: true,
    });
  });

  it('returns the correct action when toggleAnimation is false', () => {
    expect(toggleReadyForKioskAnimation(false)).toEqual({
      type: READY_FOR_KIOSK_ANIMATION,
      toggleAnimation: false,
    });
  });
});

describe('toggleCheckedAnimationAvailability', () => {
  it('returns the correct action when toggleCheck is true', () => {
    expect(toggleCheckedAnimationAvailability(true)).toEqual({
      type: CHECK_ANIMATION_AVAILABILITY,
      toggleCheck: true,
    });
  });

  it('returns the correct action when toggleCheck is false', () => {
    expect(toggleCheckedAnimationAvailability(false)).toEqual({
      type: CHECK_ANIMATION_AVAILABILITY,
      toggleCheck: false,
    });
  });
});

describe('setEICMeasurementComplete', () => {
  it('returns the correct action', () => {
    expect(setEICMeasurementComplete()).toEqual({
      type: SET_EIC_MEASUREMENT_COMPLETE,
    });
  });
});

describe('setEICMeasurementAborted', () => {
  it('returns the correct action', () => {
    expect(setEICMeasurementAborted()).toEqual({
      type: SET_EIC_MEASUREMENT_ABORTED,
    });
  });
});

describe('setTravelMode', () => {
  it('returns the correct action with a travelMode value', () => {
    expect(setTravelMode('hyperwall')).toEqual({
      type: SET_TRAVELING_HYPERWALL,
      travelMode: 'hyperwall',
    });
  });

  it('returns the correct action with a falsy travelMode value', () => {
    expect(setTravelMode(false)).toEqual({
      type: SET_TRAVELING_HYPERWALL,
      travelMode: false,
    });
  });
});

describe('setEICLegacy', () => {
  it('returns the correct action when isLegacy is true', () => {
    expect(setEICLegacy(true)).toEqual({
      type: SET_EIC_LEGACY,
      isLegacy: true,
    });
  });

  it('returns the correct action when isLegacy is false', () => {
    expect(setEICLegacy(false)).toEqual({
      type: SET_EIC_LEGACY,
      isLegacy: false,
    });
  });
});

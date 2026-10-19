import configureMockStore from 'redux-mock-store';
import { thunk } from 'redux-thunk';
import * as constants from './constants';
import util from '../../util/util';
import {
  onClose,
  play,
  stop,
  toggleLooping,
  toggleComponentGifActive,
  toggleAnimationCollapse,
  toggleAnimationAutoplay,
  changeStartDate,
  changeEndDate,
  changeStartAndEndDate,
  changeFrameRate,
  changeCropBounds,
  onActivate,
  playKioskAnimation,
} from './actions';
import fixtures from '../../fixtures';

const middlewares = [thunk];
const state = fixtures.getState();

test(
  `changeFrameRate action returns ${constants.UPDATE_FRAME_RATE} action type and number value [animation-action-speed]`,
  () => {
    const response = changeFrameRate(2);
    expect(response.type).toEqual(constants.UPDATE_FRAME_RATE);
    expect(response.value).toEqual(2);
  },
);

test(
  `onActivate action returns ${constants.OPEN_ANIMATION} action type and current dateValue [animation-action-activate]`,
  () => {
    const mockStore = configureMockStore(middlewares);
    const store = mockStore(state);
    store.dispatch(onActivate());
    const response1 = store.getActions()[0];
    const response2 = store.getActions()[1];
    expect(response1.type).toEqual(constants.UPDATE_START_AND_END_DATE);
    expect(response1.endDate).toEqual(state.date.selected);
    expect(response1.startDate).toEqual(
      util.dateAdd(state.date.selected, 'day', -10),
    );
    expect(response2.type).toEqual(constants.OPEN_ANIMATION);
  },
);

test(
  `changeBoundary action returns ${constants.UPDATE_CROP_BOUNDS} action type and current bounds value [animation-action-boundary]`,
  () => {
    const mockStore = configureMockStore(middlewares);
    const store = mockStore(state);
    const mockBounds = {
      x: 1, y: 1, x2: 2, y2: 2,
    };
    store.dispatch(changeCropBounds(mockBounds));
    const response = store.getActions()[0];
    expect(response.type).toEqual(constants.UPDATE_CROP_BOUNDS);
    expect(response.value).toEqual(mockBounds);
  },
);

describe('Open, play, stop, close and toggle actions', () => {
  test(
    `onClose action returns ${constants.EXIT_ANIMATION} action type [animation-action-exit]`,
    () => {
      const expectedAction = { type: constants.EXIT_ANIMATION };
      expect(onClose().type).toEqual(expectedAction.type);
    },
  );

  test(
    `play action returns ${constants.PLAY_ANIMATION} action type [animation-action-play]`,
    () => {
      const expectedAction = { type: constants.PLAY_ANIMATION };
      expect(play().type).toEqual(expectedAction.type);
    },
  );

  test(
    `stop action returns ${constants.STOP_ANIMATION} action type [animation-action-stop]`,
    () => {
      const expectedAction = { type: constants.STOP_ANIMATION };
      expect(stop().type).toEqual(expectedAction.type);
    },
  );

  test(
    `toggleLooping action returns ${constants.TOGGLE_LOOPING} action type [animation-action-loop]`,
    () => {
      const expectedAction = { type: constants.TOGGLE_LOOPING };
      expect(toggleLooping().type).toEqual(expectedAction.type);
    },
  );

  test(
    `toggleComponentGifActive action returns ${constants.TOGGLE_GIF} action type [animation-action-gif]`,
    () => {
      const expectedAction = { type: constants.TOGGLE_GIF };
      expect(toggleComponentGifActive().type).toEqual(expectedAction.type);
    },
  );

  test(
    `toggleAnimationCollapse action returns ${constants.COLLAPSE_ANIMATION} action type [animation-action-collapse]`,
    () => {
      expect(toggleAnimationCollapse().type).toEqual(constants.COLLAPSE_ANIMATION);
    },
  );

  test(
    `toggleAnimationAutoplay action returns ${constants.TOGGLE_AUTOPLAY} action type [animation-action-autoplay]`,
    () => {
      expect(toggleAnimationAutoplay().type).toEqual(constants.TOGGLE_AUTOPLAY);
    },
  );
});

describe('Animation Datechange actions', () => {
  const now = util.now();
  const then = util.dateAdd(now, 'day', -7);

  test(
    `changeStartDate action returns ${constants.UPDATE_START_DATE} action type and current date as value [animation-action-start-date]`,
    () => {
      const expectedAction = { type: constants.UPDATE_START_DATE, value: now };
      const response = changeStartDate(now);
      expect(response.type).toEqual(expectedAction.type);
      expect(response.value).toEqual(now);
    },
  );

  test(
    `changeEndDate action returns ${constants.UPDATE_END_DATE} action type and current date as value [animation-action-end-date]`,
    () => {
      const response = changeEndDate(now);
      expect(response.type).toEqual(constants.UPDATE_END_DATE);
      expect(response.value).toEqual(now);
    },
  );

  test(
    `changeStartAndEndDate action returns ${constants.UPDATE_START_AND_END_DATE} action type and current date as value [animation-action-start-and-end-date]`,
    () => {
      const response = changeStartAndEndDate(then, now);
      expect(response.type).toEqual(constants.UPDATE_START_AND_END_DATE);
      expect(response.startDate).toEqual(then);
      expect(response.endDate).toEqual(now);
    },
  );
});

describe('playKioskAnimation action', () => {
  const now = util.now();
  const then = util.dateAdd(now, 'day', -7);

  test(
    `playKioskAnimation action returns ${constants.PLAY_KIOSK_ANIMATIONS} action type with startDate and endDate [animation-action-kiosk]`,
    () => {
      const response = playKioskAnimation(then, now);
      expect(response.type).toEqual(constants.PLAY_KIOSK_ANIMATIONS);
      expect(response.startDate).toEqual(then);
      expect(response.endDate).toEqual(now);
    },
  );
});

describe('onActivate with existing startDate and endDate', () => {
  test(
    'onActivate skips UPDATE_START_AND_END_DATE when startDate and endDate already exist [animation-action-activate-existing-dates]',
    () => {
      const mockStore = configureMockStore(middlewares);
      const stateWithDates = {
        ...state,
        animation: {
          ...state.animation,
          startDate: util.dateAdd(state.date.selected, 'day', -5),
          endDate: state.date.selected,
        },
      };
      const store = mockStore(stateWithDates);
      store.dispatch(onActivate());
      const actions = store.getActions();
      expect(actions.length).toEqual(1);
      expect(actions[0].type).toEqual(constants.OPEN_ANIMATION);
    },
  );
});

describe('onActivate with customSelected interval', () => {
  test(
    'onActivate uses customInterval and customDelta when customSelected is true [animation-action-activate-custom]',
    () => {
      const mockStore = configureMockStore(middlewares);
      const customState = {
        ...state,
        animation: {
          ...state.animation,
          startDate: null,
          endDate: null,
        },
        date: {
          ...state.date,
          customSelected: true,
          customDelta: 1,
          customInterval: 3,
          autoSelected: false,
        },
      };
      const store = mockStore(customState);
      store.dispatch(onActivate());
      const actions = store.getActions();
      expect(actions[0].type).toEqual(constants.UPDATE_START_AND_END_DATE);
      expect(actions[1].type).toEqual(constants.OPEN_ANIMATION);
    },
  );
});

describe('onActivate with autoSelected', () => {
  test(
    'onActivate uses autoSelected imagery delta frames [animation-action-activate-auto]',
    () => {
      const mockStore = configureMockStore(middlewares);
      const autoState = {
        ...state,
        animation: {
          ...state.animation,
          startDate: null,
          endDate: null,
        },
        date: {
          ...state.date,
          autoSelected: true,
          customSelected: false,
        },
      };
      const store = mockStore(autoState);
      store.dispatch(onActivate());
      const actions = store.getActions();
      expect(actions[0].type).toEqual(constants.UPDATE_START_AND_END_DATE);
      expect(actions[1].type).toEqual(constants.OPEN_ANIMATION);
    },
  );
});

describe('onActivate appNow past tenFramesAfter branch', () => {
  test(
    'onActivate uses activeDate as startDate when appNow is past tenFramesAfter [animation-action-activate-past]',
    () => {
      const mockStore = configureMockStore(middlewares);
      const pastState = {
        ...state,
        animation: {
          ...state.animation,
          startDate: null,
          endDate: null,
        },
        date: {
          ...state.date,
          autoSelected: false,
          customSelected: false,
          appNow: new Date('2099-01-01'),
        },
      };
      const store = mockStore(pastState);
      store.dispatch(onActivate());
      const actions = store.getActions();
      expect(actions[0].type).toEqual(constants.UPDATE_START_AND_END_DATE);
      expect(actions[1].type).toEqual(constants.OPEN_ANIMATION);
    },
  );
});

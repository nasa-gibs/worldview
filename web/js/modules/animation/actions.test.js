import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import * as constants from './constants';
import util from '../../util/util';
import {
  onClose,
  play,
  stop,
  toggleLooping,
  toggleComponentGifActive,
  changeStartDate,
  changeEndDate,
  changeStartAndEndDate,
  changeFrameRate,
  changeCropBounds,
  onActivate,
} from './actions';
import fixtures from '../../fixtures';

const middlewares = [thunk];
const state = fixtures.getState();

describe('Open, play, stop, close and toggle actions', () => {
  test(
    `onClose action returns ${constants.EXIT_ANIMATION} action type [animation-action-exit]`,
    () => {
      const expectedAction = {
        type: constants.EXIT_ANIMATION,
      };
      expect(onClose().type).toEqual(expectedAction.type);
    },
  );
  test(
    `play action returns ${constants.PLAY_ANIMATION} action type [animation-action-play]`,
    () => {
      const expectedAction = {
        type: constants.PLAY_ANIMATION,
      };
      expect(play().type).toEqual(expectedAction.type);
    },
  );
  test(
    `stop action returns ${constants.STOP_ANIMATION} action type [animation-action-stop]`,
    () => {
      const expectedAction = {
        type: constants.STOP_ANIMATION,
      };
      expect(stop().type).toEqual(expectedAction.type);
    },
  );
  test(
    `toggleLooping action returns ${constants.TOGGLE_LOOPING} action type [animation-action-loop]`,
    () => {
      const expectedAction = {
        type: constants.TOGGLE_LOOPING,
      };
      expect(toggleLooping().type).toEqual(expectedAction.type);
    },
  );
  test(
    `toggleComponentGifActive action returns ${
      constants.TOGGLE_GIF
    } action type [animation-action-gif]`,
    () => {
      const expectedAction = {
        type: constants.TOGGLE_GIF,
      };
      expect(toggleComponentGifActive().type).toEqual(expectedAction.type);
    },
  );
});
describe('Animation Datechange actions', () => {
  const now = util.now();
  const then = util.dateAdd(now, 'day', -7);
  test(
    `changeStartDate action returns ${
      constants.UPDATE_START_DATE
    } action type and current date as value [animation-action-start-date]`,
    () => {
      const expectedAction = {
        type: constants.UPDATE_START_DATE,
        value: now,
      };
      const response = changeStartDate(now);
      expect(response.type).toEqual(expectedAction.type);
      expect(response.value).toEqual(now);
    },
  );
  test(
    `changeEndDate action returns ${
      constants.UPDATE_END_DATE
    } action type and current date as value [animation-action-end-date]`,
    () => {
      const response = changeEndDate(now);
      expect(response.type).toEqual(constants.UPDATE_END_DATE);
      expect(response.value).toEqual(now);
    },
  );
  test(
    `changeStartAndEndDate action returns ${
      constants.UPDATE_START_AND_END_DATE
    } action type and current date as value [animation-action-start-and-end-date]`,
    () => {
      const response = changeStartAndEndDate(then, now);
      expect(response.type).toEqual(constants.UPDATE_START_AND_END_DATE);
      expect(response.startDate).toEqual(then);
      expect(response.endDate).toEqual(now);
    },
  );
});

test(
  `changeFrameRate action returns ${
    constants.UPDATE_FRAME_RATE
  } action type and number value [animation-action-speed]`,
  () => {
    const response = changeFrameRate(2);
    expect(response.type).toEqual(constants.UPDATE_FRAME_RATE);
    expect(response.value).toEqual(2);
  },
);
test(
  `onActivate action returns ${
    constants.OPEN_ANIMATION
  } action type and current dateValue [animation-action-activate]`,
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

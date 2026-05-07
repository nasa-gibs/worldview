import {
  dateReducer,
  dateReducerState,
  getInitialState,
} from './reducers';
import {
  CHANGE_TIME_SCALE,
  CHANGE_CUSTOM_INTERVAL,
  CHANGE_AUTO_INTERVAL,
  CHANGE_INTERVAL,
  SELECT_DATE,
  UPDATE_APP_NOW,
  TOGGLE_CUSTOM_MODAL,
  INIT_SECOND_DATE,
  ARROW_DOWN,
  ARROW_UP,
  SET_PRELOAD,
  CLEAR_PRELOAD,
  customModalType,
} from './constants';
import util from '../../util/util';

const mockDate = util.now();
const selectedZoom = 2;

describe('dateReducer', () => {
  test('should return the initial state [date-reducer-initial-state]', () => {
    expect(dateReducer(undefined, {})).toEqual(dateReducerState);
  });

  test(
    `${CHANGE_TIME_SCALE} action type and ${selectedZoom} as selectedZoom should return new state [date-reducer-time-scale]`,
    () => {
      expect(
        dateReducer(dateReducerState, { type: CHANGE_TIME_SCALE, value: selectedZoom }),
      ).toEqual({ ...dateReducerState, selectedZoom });
    },
  );

  test(
    `${CHANGE_CUSTOM_INTERVAL} action type and 4 as customInterval and 10 as customDelta should return new state [date-reducer-custom-interval]`,
    () => {
      expect(
        dateReducer(dateReducerState, { type: CHANGE_CUSTOM_INTERVAL, interval: 4, delta: 10 }),
      ).toEqual({
        ...dateReducerState,
        customInterval: 4,
        customDelta: 10,
        customSelected: true,
      });
    },
  );

  test(
    'CHANGE_CUSTOM_INTERVAL with null interval and null delta sets customSelected to false [date-reducer-custom-interval-false]',
    () => {
      const result = dateReducer(dateReducerState, {
        type: CHANGE_CUSTOM_INTERVAL,
        interval: null,
        delta: null,
      });
      expect(result.customSelected).toBe(false);
      expect(result.autoSelected).toBe(false);
    },
  );

  test(
    `${CHANGE_AUTO_INTERVAL} action type and true as autoSelected should return new state [date-reducer-auto-interval]`,
    () => {
      expect(
        dateReducer(dateReducerState, {
          type: CHANGE_AUTO_INTERVAL,
          interval: 3,
          delta: 1,
          autoSelected: true,
        }),
      ).toEqual({ ...dateReducerState, autoSelected: true });
    },
  );

  test(
    'CHANGE_AUTO_INTERVAL sets customSelected to false [date-reducer-auto-interval-clears-custom]',
    () => {
      const stateWithCustom = { ...dateReducerState, customSelected: true };
      const result = dateReducer(stateWithCustom, {
        type: CHANGE_AUTO_INTERVAL,
        autoSelected: true,
      });
      expect(result.customSelected).toBe(false);
      expect(result.autoSelected).toBe(true);
    },
  );

  test(
    `${CHANGE_INTERVAL} action type and 1 as delta and 2 as interval should return new state [date-reducer-interval]`,
    () => {
      expect(
        dateReducer(dateReducerState, {
          type: CHANGE_INTERVAL,
          interval: 2,
          delta: 1,
          customSelected: false,
          autoSelected: false,
        }),
      ).toEqual({
        ...dateReducerState,
        interval: 2,
        delta: 1,
        customSelected: false,
        autoSelected: false,
      });
    },
  );

  test(
    `${SELECT_DATE} action type and ${mockDate} as value and selected as activeString should return new state [date-reducer-selected]`,
    () => {
      expect(
        dateReducer(dateReducerState, {
          type: SELECT_DATE,
          value: mockDate,
          activeString: 'selected',
        }),
      ).toEqual({ ...dateReducerState, selected: mockDate });
    },
  );

  test(
    `${SELECT_DATE} action type and ${mockDate} as value and selectedB as activeString should return new state [date-reducer-selectedB]`,
    () => {
      expect(
        dateReducer(dateReducerState, {
          type: SELECT_DATE,
          value: mockDate,
          activeString: 'selectedB',
        }),
      ).toEqual({ ...dateReducerState, selectedB: mockDate });
    },
  );

  test(
    'SELECT_DATE stores lastArrowDirection from action [date-reducer-selected-arrow-direction]',
    () => {
      const result = dateReducer(dateReducerState, {
        type: SELECT_DATE,
        value: mockDate,
        activeString: 'selected',
        lastArrowDirection: 'right',
      });
      expect(result.lastArrowDirection).toBe('right');
    },
  );

  test(
    `${UPDATE_APP_NOW} action type and ${mockDate} as value should return new state [date-reducer-update-app-now]`,
    () => {
      expect(
        dateReducer(dateReducerState, { type: UPDATE_APP_NOW, value: mockDate }),
      ).toEqual({ ...dateReducerState, appNow: mockDate });
    },
  );

  test(
    'INIT_SECOND_DATE sets selectedB to 7 days before selected [date-reducer-init-second-date]',
    () => {
      const selected = new Date('2022-01-08');
      const stateWithSelected = { ...dateReducerState, selected };
      const result = dateReducer(stateWithSelected, { type: INIT_SECOND_DATE });
      const expected = util.dateAdd(selected, 'day', -7);
      expect(result.selectedB).toEqual(expected);
    },
  );

  test(
    'ARROW_DOWN sets arrowDown and lastArrowDirection to the given value [date-reducer-arrow-down]',
    () => {
      const result = dateReducer(dateReducerState, { type: ARROW_DOWN, value: 'right' });
      expect(result.arrowDown).toBe('right');
      expect(result.lastArrowDirection).toBe('right');
    },
  );

  test(
    'ARROW_UP clears arrowDown to empty string [date-reducer-arrow-up]',
    () => {
      const stateWithArrow = { ...dateReducerState, arrowDown: 'left' };
      const result = dateReducer(stateWithArrow, { type: ARROW_UP });
      expect(result.arrowDown).toBe('');
    },
  );

  test(
    'SET_PRELOAD sets preloaded and lastPreloadDate [date-reducer-set-preload]',
    () => {
      const lastPreloadDate = new Date('2022-06-01');
      const result = dateReducer(dateReducerState, {
        type: SET_PRELOAD,
        preloaded: true,
        lastPreloadDate,
      });
      expect(result.preloaded).toBe(true);
      expect(result.lastPreloadDate).toEqual(lastPreloadDate);
    },
  );

  test(
    'CLEAR_PRELOAD sets preloaded and lastPreloadDate to null [date-reducer-clear-preload]',
    () => {
      const loadedState = { ...dateReducerState, preloaded: true, lastPreloadDate: new Date() };
      const result = dateReducer(loadedState, { type: CLEAR_PRELOAD });
      expect(result.preloaded).toBeNull();
      expect(result.lastPreloadDate).toBeNull();
    },
  );

  test(
    'TOGGLE_CUSTOM_MODAL with TIMELINE toggleBy sets timelineCustomModalOpen and closes animation [date-reducer-toggle-modal-timeline]',
    () => {
      const result = dateReducer(dateReducerState, {
        type: TOGGLE_CUSTOM_MODAL,
        value: true,
        toggleBy: customModalType.TIMELINE,
      });
      expect(result.timelineCustomModalOpen).toBe(true);
      expect(result.animationCustomModalOpen).toBe(false);
    },
  );

  test(
    'TOGGLE_CUSTOM_MODAL with ANIMATION toggleBy sets animationCustomModalOpen and closes timeline [date-reducer-toggle-modal-animation]',
    () => {
      const result = dateReducer(dateReducerState, {
        type: TOGGLE_CUSTOM_MODAL,
        value: true,
        toggleBy: customModalType.ANIMATION,
      });
      expect(result.animationCustomModalOpen).toBe(true);
      expect(result.timelineCustomModalOpen).toBe(false);
    },
  );

  test(
    'TOGGLE_CUSTOM_MODAL with unknown toggleBy sets both modals with action value [date-reducer-toggle-modal-other]',
    () => {
      const result = dateReducer(dateReducerState, {
        type: TOGGLE_CUSTOM_MODAL,
        value: true,
        toggleBy: 'other',
      });
      expect(result.timelineCustomModalOpen).toBe(true);
      expect(result.animationCustomModalOpen).toBe(true);
    },
  );

  test(
    'default case returns unchanged state [date-reducer-default]',
    () => {
      const result = dateReducer(dateReducerState, { type: 'UNKNOWN_ACTION' });
      expect(result).toEqual(dateReducerState);
    },
  );
});

describe('getInitialState', () => {
  test('returns state with selected, selectedB, and appNow from config [date-reducer-get-initial-state]', () => {
    const initialDate = new Date('2022-01-01');
    const pageLoadTime = new Date('2022-01-01T12:00:00Z');
    const config = { initialDate, pageLoadTime };
    const result = getInitialState(config);
    expect(result.selected).toEqual(initialDate);
    expect(result.selectedB).toEqual(util.dateAdd(initialDate, 'day', -7));
    expect(result.appNow).toEqual(pageLoadTime);
  });

  test('getInitialState spreads all dateReducerState properties [date-reducer-get-initial-state-spread]', () => {
    const initialDate = new Date('2022-03-15');
    const pageLoadTime = new Date('2022-03-15T08:00:00Z');
    const config = { initialDate, pageLoadTime };
    const result = getInitialState(config);
    expect(result.selectedZoom).toBe(dateReducerState.selectedZoom);
    expect(result.interval).toBe(dateReducerState.interval);
    expect(result.delta).toBe(dateReducerState.delta);
    expect(result.customSelected).toBe(dateReducerState.customSelected);
    expect(result.autoSelected).toBe(dateReducerState.autoSelected);
  });
});

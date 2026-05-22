import configureMockStore from 'redux-mock-store';
import { thunk } from 'redux-thunk';
import {
  changeTimeScale,
  updateAppNow,
  selectDate,
  changeCustomInterval,
  changeAutoInterval,
  selectInterval,
  toggleCustomModal,
  setArrowDown,
  setArrowUp,
  setPreload,
  clearPreload,
  initSecondDate,
  triggerTodayButton,
} from './actions';
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
} from './constants';
import fixtures from '../../fixtures';
import { addLayer, getLayers } from '../layers/selectors';

const config = fixtures.config();
function getState(layers) {
  return {
    config,
    proj: {
      id: 'geographic',
      selected: config.projections.geographic,
    },
    layers: {
      active: {
        layers,
      },
    },
    compare: {
      activeString: 'active',
    },
  };
}
function addMockLayer(layerId, layerArray) {
  return addLayer(
    layerId,
    layerArray,
    config.layers,
    {},
    getLayers(getState(layerArray), { group: 'all' }).overlays.length,
  );
}

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

const mockDate = new Date('2022-01-01');
const customInterval = 3;
const delta = 5;
const interval = 3;

describe('Date timescale changes', () => {
  test(
    `changeTimeScale action returns ${CHANGE_TIME_SCALE} as type and ${interval} as value [date-action-time-scale]`,
    () => {
      const expectedAction = {
        type: CHANGE_TIME_SCALE,
        value: interval,
      };
      expect(changeTimeScale(interval)).toEqual(expectedAction);
    },
  );

  test(
    `updateAppNow action returns ${UPDATE_APP_NOW} as type and ${mockDate} as value [date-action-update-app-now]`,
    () => {
      const expectedAction = {
        type: UPDATE_APP_NOW,
        value: mockDate,
      };
      expect(updateAppNow(mockDate)).toEqual(expectedAction);
    },
  );

  test(
    `selectDate action returns ${SELECT_DATE} as type, 'selected' as activeString, and ${mockDate} as value [date-action-select-date]`,
    () => {
      const expectedFirst = { type: CLEAR_PRELOAD };
      const expectedSecond = {
        type: SELECT_DATE,
        activeString: 'selected',
        value: mockDate,
        lastArrowDirection: 'left',
        outOfStep: true,
      };
      let layers = addLayer('terra-cr', [], config.layers, {}, 0);
      layers = addMockLayer('aqua-cr', layers);
      const store = mockStore({
        date: {
          preloaded: true,
          selected: mockDate,
          delta: 1,
          interval: 1,
          unit: 'year',
        },
        compare: {
          isCompareA: true,
          activeString: 'active',
        },
        layers: {
          active: { layers },
        },
        proj: { id: 'geographic' },
      });
      store.dispatch(selectDate(mockDate));
      expect(store.getActions()[0]).toEqual(expectedFirst);
      expect(store.getActions()[1]).toEqual(expectedSecond);
    },
  );

  test(
    `selectDate action returns ${SELECT_DATE} as type and selectedB as activeString and ${mockDate} as value [date-action-select-date-b]`,
    () => {
      const prevDate = new Date('2021-01-01');
      const expectedFirst = { type: CLEAR_PRELOAD };
      const expectedSecond = {
        type: SELECT_DATE,
        activeString: 'selectedB',
        value: mockDate,
        lastArrowDirection: 'right',
        outOfStep: false,
      };
      let layers = addLayer('terra-cr', [], config.layers, {}, 0);
      layers = addMockLayer('aqua-cr', layers);
      const store = mockStore({
        date: {
          preloaded: true,
          selectedB: prevDate,
          delta: 1,
          interval: 1,
          unit: 'year',
        },
        compare: {
          isCompareA: false,
          activeString: 'activeB',
        },
        layers: {
          activeB: { layers },
        },
        proj: { id: 'geographic' },
      });
      store.dispatch(selectDate(mockDate));
      expect(store.getActions()[0]).toEqual(expectedFirst);
      expect(store.getActions()[1]).toEqual(expectedSecond);
    },
  );

  test(
    'selectDate does not dispatch CLEAR_PRELOAD when preloaded is false [date-action-select-date-no-preload]',
    () => {
      let layers = addLayer('terra-cr', [], config.layers, {}, 0);
      layers = addMockLayer('aqua-cr', layers);
      const prevDate = new Date('2021-01-01');
      const store = mockStore({
        date: {
          preloaded: false,
          selected: prevDate,
          lastArrowDirection: 'right',
          delta: 1,
          interval: 1,
          unit: 'year',
        },
        compare: {
          isCompareA: true,
          activeString: 'active',
        },
        layers: {
          active: { layers },
        },
        proj: { id: 'geographic' },
      });
      store.dispatch(selectDate(mockDate));
      const actions = store.getActions();
      expect(actions.length).toBe(1);
      expect(actions[0].type).toEqual(SELECT_DATE);
    },
  );

  test(
    `changeCustomInterval action returns ${CHANGE_CUSTOM_INTERVAL} as type and ${customInterval} as value and ${delta} as delta [date-action-custom-interval]`,
    () => {
      const store = mockStore({
        date: {},
        compare: { isCompareA: false, activeString: 'activeB' },
        proj: { id: 'geographic' },
      });
      const expectedFirst = { type: CLEAR_PRELOAD };
      const expectedSecond = {
        type: CHANGE_CUSTOM_INTERVAL,
        interval: customInterval,
        delta,
      };
      store.dispatch(changeCustomInterval(delta, customInterval));
      expect(store.getActions()[0]).toEqual(expectedFirst);
      expect(store.getActions()[1]).toEqual(expectedSecond);
    },
  );

  test(
    `changeAutoInterval action returns ${CHANGE_AUTO_INTERVAL} as type and true as autoSelected [date-action-auto-interval]`,
    () => {
      const store = mockStore({
        date: {},
        compare: { isCompareA: false, activeString: 'activeB' },
        proj: { id: 'geographic' },
      });
      const expectedFirst = { type: CLEAR_PRELOAD };
      const expectedSecond = {
        type: CHANGE_AUTO_INTERVAL,
        autoSelected: true,
      };
      store.dispatch(changeAutoInterval(true));
      expect(store.getActions()[0]).toEqual(expectedFirst);
      expect(store.getActions()[1]).toEqual(expectedSecond);
    },
  );

  test(
    `selectInterval action returns ${CHANGE_INTERVAL} as type and ${interval} as value and ${delta} as delta and true as customSelected [date-action-interval]`,
    () => {
      const store = mockStore({
        date: {},
        compare: { isCompareA: false, activeString: 'activeB' },
        proj: { id: 'geographic' },
      });
      const expectedFirst = { type: CLEAR_PRELOAD };
      const expectedSecond = {
        type: CHANGE_INTERVAL,
        interval,
        delta,
        customSelected: true,
      };
      store.dispatch(selectInterval(delta, interval, true));
      expect(store.getActions()[0]).toEqual(expectedFirst);
      expect(store.getActions()[1]).toEqual(expectedSecond);
    },
  );

  test(
    'selectInterval passes autoSelected when provided [date-action-interval-auto]',
    () => {
      const store = mockStore({
        date: {},
        compare: { isCompareA: false, activeString: 'activeB' },
        proj: { id: 'geographic' },
      });
      store.dispatch(selectInterval(delta, interval, false, true));
      const second = store.getActions()[1];
      expect(second.autoSelected).toBe(true);
      expect(second.customSelected).toBe(false);
    },
  );
});

test('initSecondDate returns INIT_SECOND_DATE action [date-action-init-second-date]', () => {
  expect(initSecondDate()).toEqual({ type: INIT_SECOND_DATE });
});

test('clearPreload returns CLEAR_PRELOAD action [date-action-clear-preload]', () => {
  expect(clearPreload()).toEqual({ type: CLEAR_PRELOAD });
});

test('setArrowUp returns ARROW_UP action [date-action-arrow-up]', () => {
  expect(setArrowUp()).toEqual({ type: ARROW_UP });
});

test('setPreload returns SET_PRELOAD action with preloaded and lastPreloadDate [date-action-set-preload]', () => {
  const lastPreloadDate = new Date('2022-06-01');
  expect(setPreload(true, lastPreloadDate)).toEqual({
    type: SET_PRELOAD,
    preloaded: true,
    lastPreloadDate,
  });
});

test('toggleCustomModal returns TOGGLE_CUSTOM_MODAL with open and toggleBy [date-action-toggle-modal]', () => {
  expect(toggleCustomModal(true, 'button')).toEqual({
    type: TOGGLE_CUSTOM_MODAL,
    value: true,
    toggleBy: 'button',
  });
});

test('toggleCustomModal returns TOGGLE_CUSTOM_MODAL with false [date-action-toggle-modal-false]', () => {
  expect(toggleCustomModal(false, 'outside')).toEqual({
    type: TOGGLE_CUSTOM_MODAL,
    value: false,
    toggleBy: 'outside',
  });
});

test('setArrowDown dispatches CLEAR_PRELOAD and ARROW_DOWN when direction changes [date-action-arrow-down-change]', () => {
  const store = mockStore({
    date: { lastArrowDirection: 'left' },
  });
  store.dispatch(setArrowDown('right'));
  const actions = store.getActions();
  expect(actions[0]).toEqual({ type: CLEAR_PRELOAD });
  expect(actions[1]).toEqual({ type: ARROW_DOWN, value: 'right' });
});

test('setArrowDown dispatches only ARROW_DOWN when direction is unchanged [date-action-arrow-down-same]', () => {
  const store = mockStore({
    date: { lastArrowDirection: 'right' },
  });
  store.dispatch(setArrowDown('right'));
  const actions = store.getActions();
  expect(actions.length).toBe(1);
  expect(actions[0]).toEqual({ type: ARROW_DOWN, value: 'right' });
});

test('setArrowDown dispatches only ARROW_DOWN when direction is null [date-action-arrow-down-null]', () => {
  const store = mockStore({
    date: { lastArrowDirection: 'right' },
  });
  store.dispatch(setArrowDown(null));
  const actions = store.getActions();
  expect(actions.length).toBe(1);
  expect(actions[0]).toEqual({ type: ARROW_DOWN, value: null });
});

test('triggerTodayButton dispatches SELECT_DATE when selectedDate differs from appNow [date-action-today-button]', () => {
  const appNow = new Date('2022-06-01');
  const selected = new Date('2022-01-01');
  const store = mockStore({
    date: {
      selected,
      appNow,
    },
    compare: {
      isCompareA: true,
    },
    proj: { id: 'geographic' },
    config,
    layers: { active: { layers: [] } },
  });
  store.dispatch(triggerTodayButton());
  const actions = store.getActions();
  expect(actions.length).toBe(1);
  expect(actions[0]).toEqual({
    type: SELECT_DATE,
    activeString: 'selected',
    value: appNow,
  });
});

test('triggerTodayButton does not dispatch when selectedDate equals appNow [date-action-today-button-no-op]', () => {
  const appNow = new Date('2022-06-01');
  const store = mockStore({
    date: {
      selected: appNow,
      appNow,
    },
    compare: {
      isCompareA: true,
    },
    proj: { id: 'geographic' },
    config,
    layers: { active: { layers: [] } },
  });
  store.dispatch(triggerTodayButton());
  expect(store.getActions().length).toBe(0);
});

test('triggerTodayButton uses selectedB when isCompareA is false [date-action-today-button-b]', () => {
  const appNow = new Date('2022-06-01');
  const selectedB = new Date('2022-01-01');
  const store = mockStore({
    date: {
      selectedB,
      appNow,
    },
    compare: {
      isCompareA: false,
    },
    proj: { id: 'geographic' },
    config,
    layers: { activeB: { layers: [] } },
  });
  store.dispatch(triggerTodayButton());
  const actions = store.getActions();
  expect(actions.length).toBe(1);
  expect(actions[0]).toEqual({
    type: SELECT_DATE,
    activeString: 'selectedB',
    value: appNow,
  });
});

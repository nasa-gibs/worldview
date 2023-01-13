import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  changeTimeScale,
  updateAppNow,
  selectDate,
  changeCustomInterval,
  selectInterval,
} from './actions';
import {
  CHANGE_TIME_SCALE,
  CHANGE_CUSTOM_INTERVAL,
  CHANGE_INTERVAL,
  SELECT_DATE,
  UPDATE_APP_NOW,
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
    {},
    layerArray,
    config.layers,
    getLayers(getState(layerArray), { group: 'all' }).overlays
      .length,
  );
}

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

// test variables
const mockDate = new Date('2022-01-01');
const customInterval = 3;
const delta = 5;
const interval = 3;

describe('Date timescale changes', () => {
  test(
    `changeTimeScale action returns ${CHANGE_TIME_SCALE} as type and ${interval} as value`,
    () => {
      const expectedAction = {
        type: CHANGE_TIME_SCALE,
        value: interval,
      };
      expect(changeTimeScale(interval)).toEqual(expectedAction);
    },
  );

  test(
    `updateAppNow action returns ${UPDATE_APP_NOW} as type and ${mockDate} as value`,
    () => {
      const expectedAction = {
        type: UPDATE_APP_NOW,
        value: mockDate,
      };
      expect(updateAppNow(mockDate)).toEqual(expectedAction);
    },
  );

  test(
    `selectDate action returns ${SELECT_DATE} as type, 'selected' as activeString, and ${mockDate} as value`,
    () => {
      const expectedFirst = {
        type: CLEAR_PRELOAD,
      };
      const expectedSecond = {
        type: SELECT_DATE,
        activeString: 'selected',
        value: mockDate,
        lastArrowDirection: 'left',
        outOfStep: true,
      };
      let layers = addLayer('terra-cr', {}, [], config.layers, 0);
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
          active: {
            layers,
          },
        },
        proj: {
          id: 'geographic',
        },
      });
      store.dispatch(selectDate(mockDate));
      expect(store.getActions()[0]).toEqual(expectedFirst);
      expect(store.getActions()[1]).toEqual(expectedSecond);
    },
  );

  test(
    `selectDate action returns ${SELECT_DATE} as type and selectedB as activeString and ${mockDate} as value`,
    () => {
      const prevDate = new Date('2021-01-01');
      const expectedFirst = {
        type: CLEAR_PRELOAD,
      };
      const expectedSecond = {
        type: SELECT_DATE,
        activeString: 'selectedB',
        value: mockDate,
        lastArrowDirection: 'right',
        outOfStep: false,
      };
      let layers = addLayer('terra-cr', {}, [], config.layers, 0);
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
          activeB: {
            layers,
          },
        },
        proj: {
          id: 'geographic',
        },
      });
      store.dispatch(selectDate(mockDate));
      expect(store.getActions()[0]).toEqual(expectedFirst);
      expect(store.getActions()[1]).toEqual(expectedSecond);
    },
  );

  test(
    `changeCustomInterval action returns ${CHANGE_CUSTOM_INTERVAL} as type and ${customInterval} as value and ${delta} as delta`,
    () => {
      const store = mockStore({
        date: {},
        compare: {
          isCompareA: false,
          activeString: 'activeB',
        },
        proj: {
          id: 'geographic',
        },
      });
      const expectedFirst = {
        type: CLEAR_PRELOAD,
      };
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
    `selectInterval action returns ${CHANGE_INTERVAL} as type and ${interval} as value and ${delta} as delta and true as customSelected`,
    () => {
      const store = mockStore({
        date: {},
        compare: {
          isCompareA: false,
          activeString: 'activeB',
        },
        proj: {
          id: 'geographic',
        },
      });
      const expectedFirst = {
        type: CLEAR_PRELOAD,
      };
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
});

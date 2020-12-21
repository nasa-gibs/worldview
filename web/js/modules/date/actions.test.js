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
const mockDate = new Date();
const customInterval = 3;
const delta = 5;
const interval = 3;

describe('Date timescale changes', () => {
  test(`changeTimeScale action returns ${CHANGE_TIME_SCALE}as type and ${
    interval} as value`, () => {
    const expectedAction = {
      type: CHANGE_TIME_SCALE,
      value: interval,
    };
    expect(changeTimeScale(interval)).toEqual(expectedAction);
  });

  test(`updateAppNow action returns ${UPDATE_APP_NOW}as type and ${
    mockDate} as value`, () => {
    const expectedAction = {
      type: UPDATE_APP_NOW,
      value: mockDate,
    };
    expect(updateAppNow(mockDate)).toEqual(expectedAction);
  });

  test(`selectDate action returns ${SELECT_DATE}as type and selected `
       + `as activeString and ${mockDate} as value`, () => {
    const expectedAction = {
      type: SELECT_DATE,
      activeString: 'selected',
      value: mockDate,
    };
    let layers = addLayer('terra-cr', {}, [], config.layers, 0);
    layers = addMockLayer('aqua-cr', layers);
    const store = mockStore({
      date: {},
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
    expect(store.getActions()[0]).toEqual(expectedAction);
  });

  test(`selectDate action returns ${SELECT_DATE}as type and selectedB `
       + `as activeString and ${mockDate} as value`, () => {
    const expectedAction = {
      type: SELECT_DATE,
      activeString: 'selectedB',
      value: mockDate,
    };
    let layers = addLayer('terra-cr', {}, [], config.layers, 0);
    layers = addMockLayer('aqua-cr', layers);
    const store = mockStore({
      date: {},
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
    expect(store.getActions()[0]).toEqual(expectedAction);
  });

  test(`changeCustomInterval action returns ${CHANGE_CUSTOM_INTERVAL} as type and ${
    customInterval} as value and ${delta} as delta`, () => {
    const expectedAction = {
      type: CHANGE_CUSTOM_INTERVAL,
      value: customInterval,
      delta,
    };
    expect(changeCustomInterval(delta, customInterval)).toEqual(expectedAction);
  });

  test(`selectInterval action returns ${CHANGE_INTERVAL} as type and ${
    interval} as value and ${delta} as delta and true as customSelected`, () => {
    const expectedAction = {
      type: CHANGE_INTERVAL,
      value: interval,
      delta,
      customSelected: true,
    };
    expect(selectInterval(delta, interval, true)).toEqual(expectedAction);
  });
});

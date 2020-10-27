import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  toggleShowGeosearch,
  toggleReverseGeocodeActive,
} from './actions';
import {
  TOGGLE_REVERSE_GEOCODE_ACTIVE,
  TOGGLE_SHOW_GEOSEARCH,
} from './constants';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

// test variables
const isExpanded = true;

describe('Geosearch actions', () => {
  test(`toggleShowGeosearch action returns ${TOGGLE_SHOW_GEOSEARCH} as type and ${
    !isExpanded} as value`, () => {
    const expectedAction = {
      type: TOGGLE_SHOW_GEOSEARCH,
      value: false,
    };
    const store = mockStore({
      geosearch: {
        isExpanded: true,
      },
    });
    store.dispatch(toggleShowGeosearch());
    expect(store.getActions()[0]).toEqual(expectedAction);
  });
  test(`toggleReverseGeocodeActive action returns ${TOGGLE_REVERSE_GEOCODE_ACTIVE} as type and ${
    true} as value`, () => {
    const expectedAction = {
      type: TOGGLE_REVERSE_GEOCODE_ACTIVE,
      value: true,
    };
    expect(toggleReverseGeocodeActive(true)).toEqual(expectedAction);
  });
});

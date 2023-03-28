import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  clearSuggestions,
  toggleShowLocationSearch,
  toggleReverseGeocodeActive,
  setSuggestion,
} from './actions';
import {
  TOGGLE_REVERSE_GEOCODE,
  TOGGLE_SHOW_LOCATION_SEARCH,
  CLEAR_SUGGESTIONS,
  SET_SUGGESTION,
} from './constants';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

// test variables
const isExpanded = true;
const suggestion = [{
  isCollection: false,
  magicKey: 'test1234=',
  text: 'New York, NY, USA',
}];

describe('Location Search actions', () => {
  test(`toggleShowLocationSearch action returns ${TOGGLE_SHOW_LOCATION_SEARCH} as type and ${
    !isExpanded} as value [locationsearch-actions-toggle]`, () => {
    const expectedAction = {
      type: TOGGLE_SHOW_LOCATION_SEARCH,
      value: false,
    };
    const store = mockStore({
      locationSearch: {
        isExpanded: true,
      },
    });
    store.dispatch(toggleShowLocationSearch());
    expect(store.getActions()[0]).toEqual(expectedAction);
  });
  test(`toggleReverseGeocodeActive action returns ${TOGGLE_REVERSE_GEOCODE} as type and ${
    true} as value [locationsearch-actions-reverse-geocode]`, () => {
    const expectedAction = {
      type: TOGGLE_REVERSE_GEOCODE,
      value: true,
    };
    expect(toggleReverseGeocodeActive(true)).toEqual(expectedAction);
  });
  test(`setSuggestion action returns ${SET_SUGGESTION} as type and ${suggestion} as value [locationsearch-actions-set-suggestion]`, () => {
    const expectedAction = {
      type: SET_SUGGESTION,
      value: suggestion,
    };
    const store = mockStore({
      locationSearch: {
        suggestions: [],
      },
    });
    store.dispatch(setSuggestion(suggestion));
    expect(store.getActions()[0]).toEqual(expectedAction);
  });
  test(`clearSuggestions action returns ${CLEAR_SUGGESTIONS} as type and ${[]} as value [locationsearch-actions-clear-suggestions]`, () => {
    const expectedAction = {
      type: CLEAR_SUGGESTIONS,
      value: [],
    };
    const store = mockStore({
      locationSearch: {
        suggestions: [{}, {}],
      },
    });
    store.dispatch(clearSuggestions());
    expect(store.getActions()[0]).toEqual(expectedAction);
  });
});

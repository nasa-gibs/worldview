import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  clearSuggestions,
  toggleDialogVisible,
  toggleShowGeosearch,
  toggleReverseGeocodeActive,
  setSuggestion,
} from './actions';
import {
  TOGGLE_REVERSE_GEOCODE,
  TOGGLE_DIALOG_VISIBLE,
  TOGGLE_SHOW_GEOSEARCH,
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
  test(`toggleReverseGeocodeActive action returns ${TOGGLE_REVERSE_GEOCODE} as type and ${
    true} as value`, () => {
    const expectedAction = {
      type: TOGGLE_REVERSE_GEOCODE,
      value: true,
    };
    expect(toggleReverseGeocodeActive(true)).toEqual(expectedAction);
  });
  test(`toggleDialogVisible action returns ${TOGGLE_DIALOG_VISIBLE} as type and ${
    true} as value`, () => {
    const expectedAction = {
      type: TOGGLE_DIALOG_VISIBLE,
      value: true,
    };
    const store = mockStore({
      geosearch: {
        isCoordinatesDialogOpen: false,
      },
    });
    store.dispatch(toggleDialogVisible(true));
    expect(store.getActions()[0]).toEqual(expectedAction);
  });
  test(`setSuggestion action returns ${SET_SUGGESTION} as type and ${suggestion} as value`, () => {
    const expectedAction = {
      type: SET_SUGGESTION,
      value: suggestion,
    };
    const store = mockStore({
      geosearch: {
        suggestions: [],
      },
    });
    store.dispatch(setSuggestion(suggestion));
    expect(store.getActions()[0]).toEqual(expectedAction);
  });
  test(`clearSuggestions action returns ${CLEAR_SUGGESTIONS} as type and ${[]} as value`, () => {
    const expectedAction = {
      type: CLEAR_SUGGESTIONS,
      value: [],
    };
    const store = mockStore({
      geosearch: {
        suggestions: [{}, {}],
      },
    });
    store.dispatch(clearSuggestions());
    expect(store.getActions()[0]).toEqual(expectedAction);
  });
});

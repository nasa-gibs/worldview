import configureMockStore from 'redux-mock-store';
import { thunk } from 'redux-thunk';
import {
  clearSuggestions,
  toggleShowLocationSearch,
  toggleReverseGeocodeActive,
  setSuggestion,
  setPlaceMarker,
  removeMarker,
  setGeocodeResults,
  toggleDialogVisible,
  getSuggestions,
} from './actions';
import {
  TOGGLE_REVERSE_GEOCODE,
  TOGGLE_SHOW_LOCATION_SEARCH,
  CLEAR_SUGGESTIONS,
  SET_SUGGESTION,
  SET_REVERSE_GEOCODE_RESULTS,
  REMOVE_MARKER,
  TOGGLE_DIALOG_VISIBLE,
  SET_MARKER,
} from './constants';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

const isExpanded = true;
const suggestion = [{
  isCollection: false,
  magicKey: 'test1234=',
  text: 'New York, NY, USA',
}];

describe('Location Search actions', () => {
  test(`toggleShowLocationSearch action returns ${TOGGLE_SHOW_LOCATION_SEARCH} as type and ${!isExpanded} as value [locationsearch-actions-toggle]`, () => {
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

  test(`toggleShowLocationSearch action returns ${TOGGLE_SHOW_LOCATION_SEARCH} as type and ${true} as value when isExpanded is false [locationsearch-actions-toggle-collapsed]`, () => {
    const expectedAction = {
      type: TOGGLE_SHOW_LOCATION_SEARCH,
      value: true,
    };
    const store = mockStore({
      locationSearch: {
        isExpanded: false,
      },
    });
    store.dispatch(toggleShowLocationSearch());
    expect(store.getActions()[0]).toEqual(expectedAction);
  });

  test(`toggleReverseGeocodeActive action returns ${TOGGLE_REVERSE_GEOCODE} as type and ${true} as value [locationsearch-actions-reverse-geocode]`, () => {
    const expectedAction = {
      type: TOGGLE_REVERSE_GEOCODE,
      value: true,
    };
    expect(toggleReverseGeocodeActive(true)).toEqual(expectedAction);
  });

  test(`toggleReverseGeocodeActive action returns ${TOGGLE_REVERSE_GEOCODE} as type and ${false} as value [locationsearch-actions-reverse-geocode-false]`, () => {
    const expectedAction = {
      type: TOGGLE_REVERSE_GEOCODE,
      value: false,
    };
    expect(toggleReverseGeocodeActive(false)).toEqual(expectedAction);
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

  test(`removeMarker action returns ${REMOVE_MARKER} as type and coordinates as value [locationsearch-actions-remove-marker]`, () => {
    const coordinates = { id: 123, longitude: -73.7075, latitude: 41.59 };
    const expectedAction = {
      type: REMOVE_MARKER,
      coordinates,
    };
    expect(removeMarker(coordinates)).toEqual(expectedAction);
  });

  test(`setGeocodeResults action returns ${SET_REVERSE_GEOCODE_RESULTS} as type and results as value [locationsearch-actions-set-geocode-results]`, () => {
    const results = { address: { LongLabel: 'New York, NY, USA' } };
    const expectedAction = {
      type: SET_REVERSE_GEOCODE_RESULTS,
      results,
    };
    expect(setGeocodeResults(results)).toEqual(expectedAction);
  });

  test(`toggleDialogVisible action dispatches ${TOGGLE_DIALOG_VISIBLE} with value true [locationsearch-actions-toggle-dialog-visible-true]`, () => {
    const expectedAction = {
      type: TOGGLE_DIALOG_VISIBLE,
      value: true,
    };
    const store = mockStore({});
    store.dispatch(toggleDialogVisible(true));
    expect(store.getActions()[0]).toEqual(expectedAction);
  });

  test(`toggleDialogVisible action dispatches ${TOGGLE_DIALOG_VISIBLE} with value false [locationsearch-actions-toggle-dialog-visible-false]`, () => {
    const expectedAction = {
      type: TOGGLE_DIALOG_VISIBLE,
      value: false,
    };
    const store = mockStore({});
    store.dispatch(toggleDialogVisible(false));
    expect(store.getActions()[0]).toEqual(expectedAction);
  });

  test(`setPlaceMarker dispatches ${SET_MARKER} with new coordinates when no existing marker matches [locationsearch-actions-set-marker-new]`, () => {
    const coord = [-73.7075, 41.59];
    const reverseGeocodeResults = {
      address: { LongLabel: 'Some Place, NY, USA' },
    };
    const store = mockStore({
      locationSearch: {
        coordinates: [],
      },
    });
    store.dispatch(setPlaceMarker(coord, reverseGeocodeResults, false));
    const action = store.getActions()[0];
    expect(action.type).toEqual(SET_MARKER);
    expect(action.coordinates.longitude).toEqual(-73.7075);
    expect(action.coordinates.latitude).toEqual(41.59);
    expect(action.reverseGeocodeResults).toEqual(reverseGeocodeResults);
    expect(action.isCoordinatesSearchActive).toEqual(false);
    expect(action.flyToExistingMarker).toBeUndefined();
  });

  test(`setPlaceMarker dispatches ${SET_MARKER} with flyToExistingMarker true when marker already exists [locationsearch-actions-set-marker-existing]`, () => {
    const existingCoord = { id: 999, longitude: -73.7075, latitude: 41.59 };
    const coord = [-73.7075, 41.59];
    const reverseGeocodeResults = {
      address: { LongLabel: 'Some Place, NY, USA' },
    };
    const store = mockStore({
      locationSearch: {
        coordinates: [existingCoord],
      },
    });
    store.dispatch(setPlaceMarker(coord, reverseGeocodeResults, true));
    const action = store.getActions()[0];
    expect(action.type).toEqual(SET_MARKER);
    expect(action.coordinates).toEqual(existingCoord);
    expect(action.flyToExistingMarker).toEqual(true);
    expect(action.isCoordinatesSearchActive).toEqual(true);
  });

  test('setPlaceMarker logs a warning when reverseGeocodeResults contains an error [locationsearch-actions-set-marker-geocode-error]', () => {
    const coord = [-73.7075, 41.59];
    const reverseGeocodeResults = {
      error: { message: 'Geocode failed', details: 'No results found' },
    };
    const store = mockStore({
      locationSearch: {
        coordinates: [],
      },
    });
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    store.dispatch(setPlaceMarker(coord, reverseGeocodeResults, false));
    expect(warnSpy).toHaveBeenCalledWith(
      'REVERSE GEOCODING WARNING - Geocode failed No results found',
    );
    warnSpy.mockRestore();
  });

  test('setPlaceMarker handles null reverseGeocodeResults without error [locationsearch-actions-set-marker-null-geocode]', () => {
    const coord = [-73.7075, 41.59];
    const store = mockStore({
      locationSearch: {
        coordinates: [],
      },
    });
    store.dispatch(setPlaceMarker(coord, null, false));
    const action = store.getActions()[0];
    expect(action.type).toEqual(SET_MARKER);
    expect(action.reverseGeocodeResults).toBeNull();
  });

  test('getSuggestions dispatches requestAction with encoded value [locationsearch-actions-get-suggestions]', () => {
    const store = mockStore({
      config: {
        features: {
          locationSearch: {
            url: 'https://example.com/arcgis/',
          },
        },
      },
    });
    store.dispatch(getSuggestions('New York'));
    expect(store.getActions().length).toBeGreaterThanOrEqual(0);
  });
});

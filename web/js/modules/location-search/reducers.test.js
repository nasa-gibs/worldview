import {
  locationSearchReducer,
  locationSearchState,
} from './reducers';
import {
  CLEAR_SUGGESTIONS,
  REMOVE_MARKER,
  REQUEST_SUGGEST_PLACE_FAILURE,
  REQUEST_SUGGEST_PLACE_SUCCESS,
  SET_MARKER,
  SET_REVERSE_GEOCODE_RESULTS,
  SET_SUGGESTION,
  TOGGLE_REVERSE_GEOCODE,
  TOGGLE_SHOW_LOCATION_SEARCH,
} from './constants';

const reverseGeocodeResults = {
  address: {},
  location: {},
};
const suggestion = [{
  isCollection: false,
  magicKey: 'test1234=',
  text: 'New York, NY, USA',
}];
const coordinatesObject = { id: 1234, latitude: 72, longitude: 40 };
const coordinatesObject2 = { id: 5678, latitude: 34, longitude: -118 };

describe('locationSearch', () => {
  test('locationSearch should return the initial state [locationstate-reducer-initial-state]', () => {
    expect(locationSearchReducer(undefined, {})).toEqual(
      locationSearchState,
    );
  });

  test(
    `${TOGGLE_SHOW_LOCATION_SEARCH} shows Location Search isExpanded and ` +
      'should return new state [locationsearch-reducer-toggle]',
    () => {
      expect(
        locationSearchReducer(locationSearchState, {
          type: TOGGLE_SHOW_LOCATION_SEARCH,
          value: true,
        }),
      ).toEqual({
        ...locationSearchState,
        isExpanded: true,
      });
    },
  );

  test(
    `${TOGGLE_SHOW_LOCATION_SEARCH} sets isExpanded to false and ` +
      'should return new state [locationsearch-reducer-toggle-false]',
    () => {
      expect(
        locationSearchReducer(locationSearchState, {
          type: TOGGLE_SHOW_LOCATION_SEARCH,
          value: false,
        }),
      ).toEqual({
        ...locationSearchState,
        isExpanded: false,
      });
    },
  );

  test(
    `${TOGGLE_REVERSE_GEOCODE} toggles isCoordinateSearchActive to true and ` +
      'should return new state [locationsearch-reducer-reverse-geocode]',
    () => {
      expect(
        locationSearchReducer(locationSearchState, {
          type: TOGGLE_REVERSE_GEOCODE,
          value: true,
        }),
      ).toEqual({
        ...locationSearchState,
        isCoordinateSearchActive: true,
      });
    },
  );

  test(
    `${TOGGLE_REVERSE_GEOCODE} toggles isCoordinateSearchActive to false and ` +
      'should return new state [locationsearch-reducer-reverse-geocode-false]',
    () => {
      expect(
        locationSearchReducer(locationSearchState, {
          type: TOGGLE_REVERSE_GEOCODE,
          value: false,
        }),
      ).toEqual({
        ...locationSearchState,
        isCoordinateSearchActive: false,
      });
    },
  );

  test(
    `${SET_REVERSE_GEOCODE_RESULTS} updates reverseGeocodeResults and ` +
      'should return new state [locationsearch-reducer-set-reverse-geocode-results]',
    () => {
      expect(
        locationSearchReducer(locationSearchState, {
          type: SET_REVERSE_GEOCODE_RESULTS,
          value: reverseGeocodeResults,
        }),
      ).toEqual({
        ...locationSearchState,
        reverseGeocodeResults,
      });
    },
  );

  test(
    `${SET_REVERSE_GEOCODE_RESULTS} sets reverseGeocodeResults to null and ` +
      'should return new state [locationsearch-reducer-set-reverse-geocode-results-null]',
    () => {
      expect(
        locationSearchReducer(locationSearchState, {
          type: SET_REVERSE_GEOCODE_RESULTS,
          value: null,
        }),
      ).toEqual({
        ...locationSearchState,
        reverseGeocodeResults: null,
      });
    },
  );

  test(
    `${SET_MARKER} updates coordinates, reverseGeocodeResults ` +
      'and sets isCoordinateSearchActive to false and should return new state [locationsearch-reducer-set-marker]',
    () => {
      expect(
        locationSearchReducer(locationSearchState, {
          type: SET_MARKER,
          coordinates: coordinatesObject,
          reverseGeocodeResults,
        }),
      ).toEqual({
        ...locationSearchState,
        isCoordinateSearchActive: false,
        coordinates: [coordinatesObject],
        reverseGeocodeResults,
      });
    },
  );

  test(
    `${SET_MARKER} appends to existing coordinates array and ` +
      'should return new state [locationsearch-reducer-set-marker-append]',
    () => {
      const stateWithExistingCoord = {
        ...locationSearchState,
        coordinates: [coordinatesObject],
      };
      expect(
        locationSearchReducer(stateWithExistingCoord, {
          type: SET_MARKER,
          coordinates: coordinatesObject2,
          reverseGeocodeResults,
        }),
      ).toEqual({
        ...stateWithExistingCoord,
        isCoordinateSearchActive: false,
        coordinates: [coordinatesObject, coordinatesObject2],
        reverseGeocodeResults,
      });
    },
  );

  test(
    `${REMOVE_MARKER} removes matching coordinate by id and ` +
      'should return new state [locationsearch-reducer-remove-marker]',
    () => {
      const stateWithCoords = {
        ...locationSearchState,
        coordinates: [coordinatesObject, coordinatesObject2],
      };
      expect(
        locationSearchReducer(stateWithCoords, {
          type: REMOVE_MARKER,
          coordinates: { id: coordinatesObject.id },
        }),
      ).toEqual({
        ...stateWithCoords,
        coordinates: [coordinatesObject2],
      });
    },
  );

  test(
    `${REMOVE_MARKER} returns unchanged coordinates when id does not match and ` +
      'should return new state [locationsearch-reducer-remove-marker-no-match]',
    () => {
      const stateWithCoords = {
        ...locationSearchState,
        coordinates: [coordinatesObject],
      };
      expect(
        locationSearchReducer(stateWithCoords, {
          type: REMOVE_MARKER,
          coordinates: { id: 9999 },
        }),
      ).toEqual({
        ...stateWithCoords,
        coordinates: [coordinatesObject],
      });
    },
  );

  test(
    `${SET_SUGGESTION} updates suggestions with value and ` +
      'should return new state [locationsearch-reducer-set-suggestion]',
    () => {
      expect(
        locationSearchReducer(locationSearchState, {
          type: SET_SUGGESTION,
          value: suggestion,
        }),
      ).toEqual({
        ...locationSearchState,
        suggestedPlace: suggestion,
      });
    },
  );

  test(
    `${REQUEST_SUGGEST_PLACE_SUCCESS} updates suggestions from parsed response and ` +
      'should return new state [locationsearch-reducer-request-suggest-place-success]',
    () => {
      const suggestions = [
        { text: 'New York, NY, USA', magicKey: 'abc123', isCollection: false },
        { text: 'New Orleans, LA, USA', magicKey: 'def456', isCollection: false },
      ];
      const response = JSON.stringify({ suggestions });
      expect(
        locationSearchReducer(locationSearchState, {
          type: REQUEST_SUGGEST_PLACE_SUCCESS,
          response,
        }),
      ).toEqual({
        ...locationSearchState,
        suggestions,
      });
    },
  );

  test(
    `${REQUEST_SUGGEST_PLACE_FAILURE} resets suggestions to empty array and ` +
      'should return new state [locationsearch-reducer-request-suggest-place-failure]',
    () => {
      const stateWithSuggestions = {
        ...locationSearchState,
        suggestions: [{ text: 'Some Place', magicKey: 'xyz', isCollection: false }],
      };
      expect(
        locationSearchReducer(stateWithSuggestions, {
          type: REQUEST_SUGGEST_PLACE_FAILURE,
        }),
      ).toEqual({
        ...stateWithSuggestions,
        suggestions: [],
      });
    },
  );

  test(
    `${CLEAR_SUGGESTIONS} updates suggestions and suggestedPlace with clear value and ` +
      'should return new state [locationsearch-reducer-clear-suggestion]',
    () => {
      expect(
        locationSearchReducer(locationSearchState, {
          type: CLEAR_SUGGESTIONS,
          value: [],
        }),
      ).toEqual({
        ...locationSearchState,
        suggestions: [],
        suggestedPlace: [],
      });
    },
  );

  test(
    'unknown action type should return current state [locationsearch-reducer-default]',
    () => {
      const currentState = {
        ...locationSearchState,
        suggestions: suggestion,
        coordinates: [coordinatesObject],
      };
      expect(
        locationSearchReducer(currentState, { type: 'UNKNOWN_ACTION' }),
      ).toEqual(currentState);
    },
  );
});

import {
  locationSearchReducer,
  locationSearchState,
} from './reducers';
import {
  CLEAR_SUGGESTIONS,
  SET_MARKER,
  SET_SUGGESTION,
  TOGGLE_REVERSE_GEOCODE,
  TOGGLE_SHOW_LOCATION_SEARCH,
} from './constants';

// test variables
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

describe('locationSearch', () => {
  test('locationSearch should return the initial state [locationstate-reducer-initial-state]', () => {
    expect(locationSearchReducer(undefined, {})).toEqual(
      locationSearchState,
    );
  });
  test(
    `${TOGGLE_SHOW_LOCATION_SEARCH
    } shows Location Search isExpanded and `
      + 'should return new state [locationsearch-reducer-toggle]',
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
    `${TOGGLE_REVERSE_GEOCODE
    } toggles isCoordinateSearchActive to true and `
      + 'should return new state [locationsearch-reducer-reverse-geocode]',
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
    `${SET_MARKER
    } updates coordinates, reverseGeocodeResults `
    + 'and sets isCoordinateSearchActive to false and should return new state [locationsearch-reducer-set-marker]',
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
    `${SET_SUGGESTION
    } updates suggestions with value and `
      + 'should return new state [locationsearch-reducer-set-suggestion]',
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
    `${CLEAR_SUGGESTIONS
    } updates suggestions and suggestedPlace with clear value and `
      + 'should return new state [locationsearch-reducer-clear-suggestion]',
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
});

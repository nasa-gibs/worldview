import {
  locationSearchReducer,
  locationSearchState,
} from './reducers';
import {
  CLEAR_MARKER,
  CLEAR_SUGGESTIONS,
  SET_MARKER,
  SET_SUGGESTION,
  TOGGLE_DIALOG_VISIBLE,
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
const coordinates = [72, 40];

describe('locationSearch', () => {
  test('locationSearch should return the initial state', () => {
    expect(locationSearchReducer(undefined, {})).toEqual(
      locationSearchState,
    );
  });
  test(
    `${TOGGLE_SHOW_LOCATION_SEARCH
    } shows Location Search isExpanded and `
      + 'should return new state',
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
      + 'should return new state',
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
    `${TOGGLE_DIALOG_VISIBLE
    } sets coordinate dialog visiblity and `
      + 'should return new state',
    () => {
      expect(
        locationSearchReducer(locationSearchState, {
          type: TOGGLE_DIALOG_VISIBLE,
          value: true,
        }),
      ).toEqual({
        ...locationSearchState,
        isCoordinatesDialogOpen: true,
      });
    },
  );
  test(
    `${SET_MARKER
    } updates coordinates, reverseGeocodeResults `
    + 'and sets isCoordinateSearchActive to false and should return new state',
    () => {
      expect(
        locationSearchReducer(locationSearchState, {
          type: SET_MARKER,
          coordinates,
          reverseGeocodeResults,
          isCoordinatesDialogOpen: true,
        }),
      ).toEqual({
        ...locationSearchState,
        isCoordinateSearchActive: false,
        isMarkerPlaced: true,
        coordinates,
        reverseGeocodeResults,
        isCoordinatesDialogOpen: true,
      });
    },
  );
  test(
    `${CLEAR_MARKER
    } resets cooridnates and geocode results`
      + 'should return new state',
    () => {
      expect(
        locationSearchReducer(locationSearchState, {
          type: CLEAR_MARKER,
        }),
      ).toEqual({
        ...locationSearchState,
        coordinates: [],
        isMarkerPlaced: false,
        reverseGeocodeResults: null,
        isCoordinatesDialogOpen: false,
      });
    },
  );
  test(
    `${SET_SUGGESTION
    } updates suggestions with value and `
      + 'should return new state',
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
      + 'should return new state',
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

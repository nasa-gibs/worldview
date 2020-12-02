import {
  geosearchReducer,
  geosearchState,
} from './reducers';
import {
  CLEAR_MARKER,
  CLEAR_SUGGESTIONS,
  SET_MARKER,
  SET_SUGGESTION,
  TOGGLE_DIALOG_VISIBLE,
  TOGGLE_REVERSE_GEOCODE,
  TOGGLE_SHOW_GEOSEARCH,
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

describe('geosearchReducer', () => {
  test('geosearchReducer should return the initial state', () => {
    expect(geosearchReducer(undefined, {})).toEqual(
      geosearchState,
    );
  });
  test(
    `${TOGGLE_SHOW_GEOSEARCH
    } shows geosearch isExpanded and `
      + 'should return new state',
    () => {
      expect(
        geosearchReducer(geosearchState, {
          type: TOGGLE_SHOW_GEOSEARCH,
          value: true,
        }),
      ).toEqual({
        ...geosearchState,
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
        geosearchReducer(geosearchState, {
          type: TOGGLE_REVERSE_GEOCODE,
          value: true,
        }),
      ).toEqual({
        ...geosearchState,
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
        geosearchReducer(geosearchState, {
          type: TOGGLE_DIALOG_VISIBLE,
          value: true,
        }),
      ).toEqual({
        ...geosearchState,
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
        geosearchReducer(geosearchState, {
          type: SET_MARKER,
          coordinates,
          reverseGeocodeResults,
          isCoordinatesDialogOpen: true,
        }),
      ).toEqual({
        ...geosearchState,
        isCoordinateSearchActive: false,
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
        geosearchReducer(geosearchState, {
          type: CLEAR_MARKER,
        }),
      ).toEqual({
        ...geosearchState,
        coordinates: [],
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
        geosearchReducer(geosearchState, {
          type: SET_SUGGESTION,
          value: suggestion,
        }),
      ).toEqual({
        ...geosearchState,
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
        geosearchReducer(geosearchState, {
          type: CLEAR_SUGGESTIONS,
          value: [],
        }),
      ).toEqual({
        ...geosearchState,
        suggestions: [],
        suggestedPlace: [],
      });
    },
  );
});

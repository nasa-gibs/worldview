import {
  geosearchReducer,
  geosearchState,
} from './reducers';
import {
  CLEAR_COORDINATES,
  SELECT_COORDINATES_TO_FLY,
  TOGGLE_REVERSE_GEOCODE_ACTIVE,
  TOGGLE_SHOW_GEOSEARCH,
  UPDATE_ACTIVE_MARKER,
} from './constants';

// test variables
const reverseGeocodeResults = {
  address: {},
  location: {},
};

describe('geosearchReducer', () => {
  test(' should return the initial state', () => {
    expect(geosearchReducer(undefined, {})).toEqual(
      geosearchState,
    );
  });
  test(
    `${CLEAR_COORDINATES
    } resets cooridnates, activeMarker, and geocode results`
      + 'should return new state',
    () => {
      expect(
        geosearchReducer(geosearchState, {
          type: CLEAR_COORDINATES,
        }),
      ).toEqual({
        ...geosearchState,
        coordinates: [],
        activeMarker: null,
        reverseGeocodeResults: null,
      });
    },
  );
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
    `${TOGGLE_REVERSE_GEOCODE_ACTIVE
    } toggles isCoordinateSearchActive to true and `
      + 'should return new state',
    () => {
      expect(
        geosearchReducer(geosearchState, {
          type: TOGGLE_REVERSE_GEOCODE_ACTIVE,
          value: true,
        }),
      ).toEqual({
        ...geosearchState,
        isCoordinateSearchActive: true,
      });
    },
  );
  test(
    `${UPDATE_ACTIVE_MARKER
    } updates action value and reverseGeocodeResults objects and `
      + 'should return new state',
    () => {
      expect(
        geosearchReducer(geosearchState, {
          type: UPDATE_ACTIVE_MARKER,
          value: {},
          reverseGeocodeResults,
        }),
      ).toEqual({
        ...geosearchState,
        activeMarker: {},
        reverseGeocodeResults,
      });
    },
  );
  test(
    `${SELECT_COORDINATES_TO_FLY
    } updates activeMarker, coordinates, and reverseGeocodeResults `
    + 'and sets isCoordinateSearchActive to false and should return new state',
    () => {
      expect(
        geosearchReducer(geosearchState, {
          type: SELECT_COORDINATES_TO_FLY,
          value: false,
          coordinates: [],
          activeMarker: {},
          reverseGeocodeResults,
        }),
      ).toEqual({
        ...geosearchState,
        isCoordinateSearchActive: false,
        coordinates: [],
        activeMarker: {},
        reverseGeocodeResults,
      });
    },
  );
});

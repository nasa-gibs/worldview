/* eslint-disable react/jsx-props-no-spreading */
import { render, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import ConnectedMarkers from './markers';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../../modules/location-search/util-api', () => ({
  reverseGeocode: jest.fn(),
}));

jest.mock('../../../components/location-search/util', () => ({
  getNormalizedCoordinate: jest.fn((coord) => coord),
}));

jest.mock('../../../modules/location-search/util', () => ({
  animateCoordinates: jest.fn(),
  areCoordinatesWithinExtent: jest.fn(() => true),
  getCoordinatesMarker: jest.fn(),
}));

jest.mock('../../../modules/location-search/actions', () => ({
  setGeocodeResults: jest.fn((value) => ({ type: 'SET_GEOCODE_RESULTS', value })),
  removeMarker: jest.fn((value) => ({ type: 'REMOVE_MARKER', value })),
}));

jest.mock('../../../modules/layers/selectors', () => ({
  getActiveLayers: jest.fn(() => []),
  getMaxZoomLevelLayerCollection: jest.fn(() => 8),
}));

import { reverseGeocode } from '../../../modules/location-search/util-api';
import { getNormalizedCoordinate } from '../../../components/location-search/util';
import {
  animateCoordinates,
  areCoordinatesWithinExtent,
  getCoordinatesMarker,
} from '../../../modules/location-search/util';
import { getActiveLayers, getMaxZoomLevelLayerCollection } from '../../../modules/layers/selectors';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockStore = configureMockStore();

const mockMarker = { id: 'marker-1', setMap: jest.fn() };

const mockCoordinatesObject = { id: 'coord-1', longitude: -77.0, latitude: 38.9 };

const mockView = { getZoom: jest.fn(() => 5) };

const mockSelectedMap = {
  getView: jest.fn(() => mockView),
  removeOverlay: jest.fn(),
  addOverlay: jest.fn(),
  renderSync: jest.fn(),
  removeLayer: jest.fn(),
  proj: 'EPSG:4326',
};

function buildMockUi(markers = []) {
  return { markers, selected: mockSelectedMap };
}

// All state that drives mapStateToProps must live in the store.
// activeLayers is filtered by getActiveLayers mock — control it via that mock.
// coordinates, isKioskModeActive, selectedMap, selectedMapMarkers, isMobileDevice
// all come from the store.
function buildStore(overrides = {}) {
  return mockStore({
    locationSearch: { coordinates: [] },
    proj: { id: 'geographic' },
    screenSize: { isMobileDevice: false },
    map: {
      ui: {
        selected: mockSelectedMap,
        markers: [],
      },
    },
    ui: { isKioskModeActive: false },
    layers: { active: [] },
    compare: { activeString: 'active' },
    ...overrides,
  });
}

// Only pass props that are NOT overridden by mapStateToProps/mapDispatchToProps:
// action, config, removeMarker (prop spy, overridden), setGeocodeResults (prop spy, overridden), ui
function buildProps(overrides = {}) {
  return {
    action: { type: '' },
    config: { sources: {} },
    removeMarker: jest.fn(),
    setGeocodeResults: jest.fn(),
    ui: buildMockUi(),
    ...overrides,
  };
}

function renderComponent(props, store) {
  const s = store ?? buildStore();
  const utils = render(
    <Provider store={s}>
      <ConnectedMarkers {...props} />
    </Provider>,
  );
  return { ...utils, store: s };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Markers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getCoordinatesMarker.mockReturnValue(mockMarker);
    areCoordinatesWithinExtent.mockReturnValue(true);
    reverseGeocode.mockResolvedValue({ address: 'Washington, DC' });
    getNormalizedCoordinate.mockImplementation((coord) => coord);
    getActiveLayers.mockReturnValue([]);
    getMaxZoomLevelLayerCollection.mockReturnValue(8);
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('renders null (no DOM output)', () => {
      const { container } = renderComponent(buildProps());
      expect(container.firstChild).toBeNull();
    });
  });

  // ── useEffect: ui.selected.proj (handleActiveMapMarker) ───────────────────

  describe('useEffect: ui.selected.proj (handleActiveMapMarker)', () => {
    it('does NOT call reverseGeocode when ui.selected is null', async () => {
      const props = buildProps({ ui: { markers: [], selected: null } });
      renderComponent(props);
      await act(async () => {});
      expect(reverseGeocode).not.toHaveBeenCalled();
    });

    it('does NOT call reverseGeocode when ui.selected has no proj', async () => {
      const selectedNoProj = { ...mockSelectedMap, proj: undefined };
      const props = buildProps({ ui: { markers: [], selected: selectedNoProj } });
      renderComponent(props);
      await act(async () => {});
      expect(reverseGeocode).not.toHaveBeenCalled();
    });

    it('does NOT call reverseGeocode when coordinates is empty', async () => {
      const store = buildStore({ locationSearch: { coordinates: [] } });
      renderComponent(buildProps(), store);
      await act(async () => {});
      expect(reverseGeocode).not.toHaveBeenCalled();
    });

    it('calls reverseGeocode for each coordinate within extent', async () => {
      const coords = [
        { id: 'c1', longitude: -77, latitude: 38 },
        { id: 'c2', longitude: -80, latitude: 35 },
      ];
      const store = buildStore({ locationSearch: { coordinates: coords } });
      renderComponent(buildProps(), store);
      await act(async () => {});
      expect(reverseGeocode).toHaveBeenCalledTimes(2);
    });

    it('does NOT call reverseGeocode for coordinates outside extent', async () => {
      areCoordinatesWithinExtent.mockReturnValue(false);
      const store = buildStore({
        locationSearch: { coordinates: [{ id: 'c1', longitude: -77, latitude: 38 }] },
      });
      renderComponent(buildProps(), store);
      await act(async () => {});
      expect(reverseGeocode).not.toHaveBeenCalled();
    });

    it('calls areCoordinatesWithinExtent with the correct proj and coord', async () => {
      const coord = { id: 'c1', longitude: -77, latitude: 38 };
      const store = buildStore({ locationSearch: { coordinates: [coord] } });
      renderComponent(buildProps(), store);
      await act(async () => {});
      expect(areCoordinatesWithinExtent).toHaveBeenCalledWith(
        { id: 'geographic' },
        [-77, 38],
      );
    });

    it('calls getNormalizedCoordinate with the coordinate pair', async () => {
      const coord = { id: 'c1', longitude: -77, latitude: 38 };
      const store = buildStore({ locationSearch: { coordinates: [coord] } });
      renderComponent(buildProps(), store);
      await act(async () => {});
      expect(getNormalizedCoordinate).toHaveBeenCalledWith([-77, 38]);
    });

    it('calls removeAllCoordinatesMarkers before processing coordinates', async () => {
      const existingMarker = { setMap: jest.fn() };
      const ui = buildMockUi([existingMarker]);
      const store = buildStore({ locationSearch: { coordinates: [] } });
      renderComponent(buildProps({ ui }), store);
      await act(async () => {});
      expect(existingMarker.setMap).toHaveBeenCalledWith(null);
      expect(mockSelectedMap.removeOverlay).toHaveBeenCalledWith(existingMarker);
    });

    it('calls addOverlay on ui.selected with the marker after reverseGeocode', async () => {
      const coord = { id: 'c1', longitude: -77, latitude: 38 };
      const store = buildStore({ locationSearch: { coordinates: [coord] } });
      renderComponent(buildProps(), store);
      await act(async () => {});
      expect(mockSelectedMap.addOverlay).toHaveBeenCalledWith(mockMarker);
    });

    it('calls renderSync on ui.selected after adding the marker', async () => {
      const coord = { id: 'c1', longitude: -77, latitude: 38 };
      const store = buildStore({ locationSearch: { coordinates: [coord] } });
      renderComponent(buildProps(), store);
      await act(async () => {});
      expect(mockSelectedMap.renderSync).toHaveBeenCalled();
    });

    it('dispatches SET_GEOCODE_RESULTS with reverseGeocode results', async () => {
      const mockResults = { address: 'Washington, DC' };
      reverseGeocode.mockResolvedValue(mockResults);
      const coord = { id: 'c1', longitude: -77, latitude: 38 };
      const store = buildStore({ locationSearch: { coordinates: [coord] } });
      renderComponent(buildProps(), store);
      await act(async () => {});
      expect(store.getActions()).toContainEqual(
        expect.objectContaining({ type: 'SET_GEOCODE_RESULTS' }),
      );
    });

    it('does NOT call addOverlay when getCoordinatesMarker returns null', async () => {
      getCoordinatesMarker.mockReturnValue(null);
      const coord = { id: 'c1', longitude: -77, latitude: 38 };
      const store = buildStore({ locationSearch: { coordinates: [coord] } });
      renderComponent(buildProps(), store);
      await act(async () => {});
      expect(mockSelectedMap.addOverlay).not.toHaveBeenCalled();
    });

    it('does NOT dispatch SET_GEOCODE_RESULTS when reverseGeocode resolves with null', async () => {
      reverseGeocode.mockResolvedValue(null);
      const coord = { id: 'c1', longitude: -77, latitude: 38 };
      const store = buildStore({ locationSearch: { coordinates: [coord] } });
      renderComponent(buildProps(), store);
      await act(async () => {});
      expect(store.getActions()).not.toContainEqual(
        expect.objectContaining({ type: 'SET_GEOCODE_RESULTS' }),
      );
    });

    it('pushes marker to ui.markers', async () => {
      const coord = { id: 'c1', longitude: -77, latitude: 38 };
      const ui = buildMockUi([]);
      const store = buildStore({ locationSearch: { coordinates: [coord] } });
      renderComponent(buildProps({ ui }), store);
      await act(async () => {});
      expect(ui.markers).toContain(mockMarker);
    });

    it('calls getCoordinatesMarker with correct arguments', async () => {
      const coord = { id: 'c1', longitude: -77, latitude: 38 };
      const results = { address: 'Test' };
      reverseGeocode.mockResolvedValue(results);
      const store = buildStore({ locationSearch: { coordinates: [coord] } });
      renderComponent(buildProps(), store);
      await act(async () => {});
      expect(getCoordinatesMarker).toHaveBeenCalledWith(
        { id: 'geographic' },
        coord,
        results,
        expect.any(Function),
        false,
        true,
      );
    });
  });

  // ── useEffect: action dispatch ────────────────────────────────────────────

  describe('useEffect: action type routing', () => {
    describe('LOCATION_SEARCH/REMOVE_MARKER', () => {
      it('calls setMap(null) on the matching marker', () => {
        const markerToRemove = { id: 'coord-1', setMap: jest.fn() };
        // selectedMapMarkers comes from map.ui.markers in the store
        const store = buildStore({
          map: { ui: { selected: mockSelectedMap, markers: [markerToRemove] } },
        });
        const props = buildProps({
          action: {
            type: 'LOCATION_SEARCH/REMOVE_MARKER',
            coordinates: mockCoordinatesObject,
          },
        });
        renderComponent(props, store);
        expect(markerToRemove.setMap).toHaveBeenCalledWith(null);
      });

      it('calls selectedMap.removeOverlay with the matching marker', () => {
        const markerToRemove = { id: 'coord-1', setMap: jest.fn() };
        const store = buildStore({
          map: { ui: { selected: mockSelectedMap, markers: [markerToRemove] } },
        });
        const props = buildProps({
          action: {
            type: 'LOCATION_SEARCH/REMOVE_MARKER',
            coordinates: mockCoordinatesObject,
          },
        });
        renderComponent(props, store);
        expect(mockSelectedMap.removeOverlay).toHaveBeenCalledWith(markerToRemove);
      });

      it('does NOT call setMap on a marker with a different id', () => {
        const otherMarker = { id: 'other-id', setMap: jest.fn() };
        const store = buildStore({
          map: { ui: { selected: mockSelectedMap, markers: [otherMarker] } },
        });
        const props = buildProps({
          action: {
            type: 'LOCATION_SEARCH/REMOVE_MARKER',
            coordinates: mockCoordinatesObject,
          },
        });
        renderComponent(props, store);
        expect(otherMarker.setMap).not.toHaveBeenCalled();
      });
    });

    describe('LOCATION_SEARCH/SET_MARKER', () => {
      it('calls flyToMarker (animateCoordinates) when flyToExistingMarker is true', () => {
        const props = buildProps({
          action: {
            type: 'LOCATION_SEARCH/SET_MARKER',
            flyToExistingMarker: true,
            coordinates: mockCoordinatesObject,
          },
        });
        renderComponent(props);
        expect(animateCoordinates).toHaveBeenCalled();
      });

      it('calls animateCoordinates with correct arguments when flyToExistingMarker is true', () => {
        const props = buildProps({
          action: {
            type: 'LOCATION_SEARCH/SET_MARKER',
            flyToExistingMarker: true,
            coordinates: mockCoordinatesObject,
          },
        });
        renderComponent(props);
        expect(animateCoordinates).toHaveBeenCalledWith(
          mockSelectedMap,
          { id: 'geographic' },
          [-77, 38.9],
          8,
          false,
        );
      });

      it('calls addMarkerAndUpdateStore when flyToExistingMarker is false', () => {
        const mockResults = { address: 'DC' };
        const props = buildProps({
          action: {
            type: 'LOCATION_SEARCH/SET_MARKER',
            flyToExistingMarker: false,
            reverseGeocodeResults: mockResults,
            isCoordinatesSearchActive: true,
            coordinates: mockCoordinatesObject,
          },
        });
        renderComponent(props);
        expect(getCoordinatesMarker).toHaveBeenCalledWith(
          { id: 'geographic' },
          mockCoordinatesObject,
          mockResults,
          expect.any(Function),
          false,
          true,
        );
      });

      it('calls addOverlay and renderSync when flyToExistingMarker is false', () => {
        const mockResults = { address: 'DC' };
        const props = buildProps({
          action: {
            type: 'LOCATION_SEARCH/SET_MARKER',
            flyToExistingMarker: false,
            reverseGeocodeResults: mockResults,
            isCoordinatesSearchActive: true,
            coordinates: mockCoordinatesObject,
          },
        });
        renderComponent(props);
        expect(mockSelectedMap.addOverlay).toHaveBeenCalledWith(mockMarker);
        expect(mockSelectedMap.renderSync).toHaveBeenCalled();
      });

      it('calls flyToMarker when isCoordinatesSearchActive is true', () => {
        const mockResults = { address: 'DC' };
        const props = buildProps({
          action: {
            type: 'LOCATION_SEARCH/SET_MARKER',
            flyToExistingMarker: false,
            reverseGeocodeResults: mockResults,
            isCoordinatesSearchActive: true,
            coordinates: mockCoordinatesObject,
          },
        });
        renderComponent(props);
        expect(animateCoordinates).toHaveBeenCalled();
      });

      it('does NOT call flyToMarker when isCoordinatesSearchActive is false', () => {
        const mockResults = { address: 'DC' };
        const props = buildProps({
          action: {
            type: 'LOCATION_SEARCH/SET_MARKER',
            flyToExistingMarker: false,
            reverseGeocodeResults: mockResults,
            isCoordinatesSearchActive: false,
            coordinates: mockCoordinatesObject,
          },
        });
        renderComponent(props);
        expect(animateCoordinates).not.toHaveBeenCalled();
      });

      it('dispatches SET_GEOCODE_RESULTS when flyToExistingMarker is false', () => {
        const mockResults = { address: 'DC' };
        const store = buildStore();
        const props = buildProps({
          action: {
            type: 'LOCATION_SEARCH/SET_MARKER',
            flyToExistingMarker: false,
            reverseGeocodeResults: mockResults,
            isCoordinatesSearchActive: false,
            coordinates: mockCoordinatesObject,
          },
        });
        renderComponent(props, store);
        expect(store.getActions()).toContainEqual(
          expect.objectContaining({ type: 'SET_GEOCODE_RESULTS' }),
        );
      });

      it('returns undefined when reverseGeocodeResults is null', () => {
        const props = buildProps({
          action: {
            type: 'LOCATION_SEARCH/SET_MARKER',
            flyToExistingMarker: false,
            reverseGeocodeResults: null,
            isCoordinatesSearchActive: false,
            coordinates: mockCoordinatesObject,
          },
        });
        expect(() => renderComponent(props)).not.toThrow();
        expect(mockSelectedMap.addOverlay).not.toHaveBeenCalled();
      });
    });

    describe('LOCATION_SEARCH/TOGGLE_DIALOG_VISIBLE', () => {
      it('calls addMarkerAndUpdateStore with showDialog=false and no geocodeResults', () => {
        const props = buildProps({
          action: { type: 'LOCATION_SEARCH/TOGGLE_DIALOG_VISIBLE' },
        });
        renderComponent(props);
        expect(mockSelectedMap.addOverlay).not.toHaveBeenCalled();
      });

      it('does not throw for TOGGLE_DIALOG_VISIBLE action', () => {
        const props = buildProps({
          action: { type: 'LOCATION_SEARCH/TOGGLE_DIALOG_VISIBLE' },
        });
        expect(() => renderComponent(props)).not.toThrow();
      });
    });

    describe('unknown action type', () => {
      it('does nothing for an unknown action type', () => {
        const props = buildProps({ action: { type: 'UNKNOWN_ACTION' } });
        renderComponent(props);
        expect(mockSelectedMap.addOverlay).not.toHaveBeenCalled();
        expect(animateCoordinates).not.toHaveBeenCalled();
      });
    });
  });

  // ── removeCoordinatesMarker ────────────────────────────────────────────────

  describe('removeCoordinatesMarker', () => {
    it('calls setMap(null) on each marker matching coordinatesObject.id', () => {
      const matchingMarker = { id: 'coord-1', setMap: jest.fn() };
      const nonMatchingMarker = { id: 'coord-2', setMap: jest.fn() };
      const store = buildStore({
        map: { ui: { selected: mockSelectedMap, markers: [matchingMarker, nonMatchingMarker] } },
      });
      const props = buildProps({
        action: {
          type: 'LOCATION_SEARCH/REMOVE_MARKER',
          coordinates: { id: 'coord-1' },
        },
      });
      renderComponent(props, store);
      expect(matchingMarker.setMap).toHaveBeenCalledWith(null);
      expect(nonMatchingMarker.setMap).not.toHaveBeenCalled();
    });

    it('calls selectedMap.removeOverlay only for the matching marker', () => {
      const matchingMarker = { id: 'coord-1', setMap: jest.fn() };
      const nonMatchingMarker = { id: 'coord-2', setMap: jest.fn() };
      const store = buildStore({
        map: { ui: { selected: mockSelectedMap, markers: [matchingMarker, nonMatchingMarker] } },
      });
      const props = buildProps({
        action: {
          type: 'LOCATION_SEARCH/REMOVE_MARKER',
          coordinates: { id: 'coord-1' },
        },
      });
      renderComponent(props, store);
      expect(mockSelectedMap.removeOverlay).toHaveBeenCalledWith(matchingMarker);
      expect(mockSelectedMap.removeOverlay).not.toHaveBeenCalledWith(nonMatchingMarker);
    });
  });

  // ── flyToMarker ────────────────────────────────────────────────────────────

  describe('flyToMarker', () => {
    it('calls animateCoordinates with isKioskModeActive flag from the store', () => {
      const store = buildStore({ ui: { isKioskModeActive: true } });
      const props = buildProps({
        action: {
          type: 'LOCATION_SEARCH/SET_MARKER',
          flyToExistingMarker: true,
          coordinates: mockCoordinatesObject,
        },
      });
      renderComponent(props, store);
      expect(animateCoordinates).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        true,
      );
    });
  });

  // ── mapStateToProps ────────────────────────────────────────────────────────

  describe('mapStateToProps', () => {
    it('reads coordinates from locationSearch state', async () => {
      const coord = { id: 'c1', longitude: -77, latitude: 38 };
      const store = buildStore({ locationSearch: { coordinates: [coord] } });
      renderComponent(buildProps(), store);
      await act(async () => {});
      expect(reverseGeocode).toHaveBeenCalled();
    });

    it('reads isKioskModeActive from ui state', () => {
      const store = buildStore({ ui: { isKioskModeActive: true } });
      const props = buildProps({
        action: {
          type: 'LOCATION_SEARCH/SET_MARKER',
          flyToExistingMarker: true,
          coordinates: mockCoordinatesObject,
        },
      });
      renderComponent(props, store);
      expect(animateCoordinates).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        true,
      );
    });

    it('reads selectedMap from map.ui.selected', () => {
      const store = buildStore();
      const props = buildProps({
        action: {
          type: 'LOCATION_SEARCH/SET_MARKER',
          flyToExistingMarker: true,
          coordinates: mockCoordinatesObject,
        },
      });
      renderComponent(props, store);
      expect(mockView.getZoom).toHaveBeenCalled();
    });

    it('reads selectedMapMarkers from map.ui.markers', () => {
      const markerToRemove = { id: 'coord-1', setMap: jest.fn() };
      const store = buildStore({
        map: { ui: { selected: mockSelectedMap, markers: [markerToRemove] } },
      });
      const props = buildProps({
        action: {
          type: 'LOCATION_SEARCH/REMOVE_MARKER',
          coordinates: mockCoordinatesObject,
        },
      });
      renderComponent(props, store);
      expect(markerToRemove.setMap).toHaveBeenCalledWith(null);
    });
  });

  // ── mapDispatchToProps ─────────────────────────────────────────────────────

  describe('mapDispatchToProps', () => {
    it('dispatches SET_GEOCODE_RESULTS when setGeocodeResults is called', () => {
      const mockResults = { address: 'DC' };
      const store = buildStore();
      const props = buildProps({
        action: {
          type: 'LOCATION_SEARCH/SET_MARKER',
          flyToExistingMarker: false,
          reverseGeocodeResults: mockResults,
          isCoordinatesSearchActive: false,
          coordinates: mockCoordinatesObject,
        },
      });
      renderComponent(props, store);
      expect(store.getActions()).toContainEqual(
        expect.objectContaining({ type: 'SET_GEOCODE_RESULTS' }),
      );
    });

    it('dispatches REMOVE_MARKER when the remove callback from getCoordinatesMarker is invoked', () => {
      const mockResults = { address: 'DC' };
      const store = buildStore();
      const props = buildProps({
        action: {
          type: 'LOCATION_SEARCH/SET_MARKER',
          flyToExistingMarker: false,
          reverseGeocodeResults: mockResults,
          isCoordinatesSearchActive: false,
          coordinates: mockCoordinatesObject,
        },
      });
      renderComponent(props, store);
      const removeFn = getCoordinatesMarker.mock.calls[0][3];
      removeFn();
      expect(store.getActions()).toContainEqual(
        expect.objectContaining({ type: 'REMOVE_MARKER' }),
      );
    });
  });
});

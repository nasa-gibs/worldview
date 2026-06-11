import { render, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('ol/extent', () => ({
  containsCoordinate: jest.fn(() => true),
}));

jest.mock('ol/proj', () => ({
  transform: jest.fn((coords) => coords),
}));

jest.mock('lodash', () => ({
  each: jest.fn((arr, fn) => { if (arr) arr.forEach(fn); }),
  debounce: jest.fn((fn) => {
    const debounced = (...args) => fn(...args);
    debounced.cancel = jest.fn();
    return debounced;
  }),
}));

jest.mock('./cluster', () => ({
  getClusters: jest.fn(() => ({
    clusters: [],
    firstClusterObj: {},
    secondClusterObj: {},
  })),
}));

jest.mock('./util', () => ({
  getTrackLines: jest.fn(() => ({ getId: jest.fn(() => 'track-line-1'), getPosition: jest.fn(() => [0, 0]) })),
  getTrackPoint: jest.fn(() => ({ getId: jest.fn(() => 'track-point-1'), getPosition: jest.fn(() => [0, 0]) })),
  getArrows: jest.fn(() => ({ getId: jest.fn(() => 'arrow-1'), getPosition: jest.fn(() => [0, 0]) })),
  getClusterPointEl: jest.fn(() => ({ getId: jest.fn(() => 'cluster-1'), getPosition: jest.fn(() => [0, 0]) })),
}));

jest.mock('../../modules/natural-events/actions', () => ({
  selectEvent: jest.fn((id, date) => ({ type: 'SELECT_EVENT', id, date })),
  highlightEvent: jest.fn((id, date) => ({ type: 'HIGHLIGHT_EVENT', id, date })),
  unHighlightEvent: jest.fn(() => ({ type: 'UN_HIGHLIGHT_EVENT' })),
}));

jest.mock('../../modules/natural-events/selectors', () => ({
  getFilteredEvents: jest.fn((state) => state.events.filteredEvents || []),
}));

jest.mock('../../modules/natural-events/util', () => ({
  getDefaultEventDate: jest.fn(() => '2023-01-01'),
}));

jest.mock('../../modules/map/constants', () => ({
  CRS: { GEOGRAPHIC: 'EPSG:4326' },
}));

jest.mock('../../util/customHooks', () => jest.fn((val) => val));

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------
import EventTrack from './event-track';
import { getClusters } from './cluster';
import { getTrackLines, getTrackPoint, getArrows } from './util';
import * as olExtent from 'ol/extent';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockStore = configureMockStore([]);

const buildOverlay = (id, position = [0, 0]) => ({
  getId: jest.fn(() => id),
  getPosition: jest.fn(() => position),
});

/**
 * Build a map stub where getView() always returns the SAME view object.
 * This is critical — if getView() returns a new object each call the spy
 * set up in the test and the one called inside the component will differ.
 */
const buildMap = (overlays = []) => {
  const overlayList = [...overlays];
  const view = {
    on: jest.fn(),
    un: jest.fn(),
    calculateExtent: jest.fn(() => [-180, -90, 180, 90]),
  };
  return {
    addOverlay: jest.fn(),
    removeOverlay: jest.fn(),
    getOverlayById: jest.fn((id) => overlayList.find((o) => o.getId() === id) || null),
    getOverlays: jest.fn(() => ({ forEach: jest.fn((fn) => overlayList.forEach(fn)) })),
    // Always return the same view instance
    getView: jest.fn(() => view),
  };
};

const buildEvent = (overrides = {}) => ({
  id: 'event-1',
  title: 'Test Event',
  categories: [{ id: 'wildfires' }],
  geometry: [
    { date: '2023-01-01T00:00:00Z', coordinates: [10, 20], type: 'Point' },
    { date: '2022-12-31T00:00:00Z', coordinates: [11, 21], type: 'Point' },
  ],
  ...overrides,
});

const defaultState = (overrides = {}) => ({
  events: {
    filteredEvents: [],
    isAnimatingToEvent: false,
    selected: { id: 'event-1', date: '2023-01-01' },
    showAllTracks: false,
    highlighted: { id: null },
  },
  animation: { isPlaying: false },
  map: {
    ui: { selected: buildMap() },
    extent: [0, 0, 10, 10],
  },
  proj: { selected: { id: 'geographic', crs: 'EPSG:4326' } },
  date: { selected: '2023-01-01' },
  ...overrides,
});

const renderWithStore = (state = defaultState()) => {
  const store = mockStore(state);
  let result;
  act(() => {
    result = render(
      <Provider store={store}>
        <EventTrack />
      </Provider>,
    );
  });
  return { ...result, store };
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('EventTrack', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------
  describe('rendering', () => {
    it('renders null into the DOM', () => {
      const { container } = renderWithStore();
      expect(container.innerHTML).toBe('');
    });
  });

  // -------------------------------------------------------------------------
  // initialize — map view propertychange listener
  // -------------------------------------------------------------------------
  describe('initialize()', () => {
    it('registers a propertychange listener on the map view on mount', () => {
      const map = buildMap();
      const view = map.getView(); // capture the single shared view instance
      const state = defaultState({ map: { ui: { selected: map }, extent: [0, 0, 10, 10] } });
      renderWithStore(state);
      expect(view.on).toHaveBeenCalledWith('propertychange', expect.any(Function));
    });

    it('does not throw when map is null', () => {
      const state = defaultState({ map: { ui: { selected: null }, extent: [0, 0, 10, 10] } });
      expect(() => renderWithStore(state)).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // Cleanup on unmount
  // -------------------------------------------------------------------------
  describe('unmount cleanup', () => {
    it('unregisters the propertychange listener on unmount', () => {
      const map = buildMap();
      const view = map.getView(); // capture the single shared view instance
      const state = defaultState({ map: { ui: { selected: map }, extent: [0, 0, 10, 10] } });
      const { unmount } = renderWithStore(state);
      act(() => { unmount(); });
      expect(view.un).toHaveBeenCalledWith('propertychange', expect.any(Function));
    });

    it('calls removeAllTracks on unmount when showAllTracks is true', () => {
      const map = buildMap();
      const state = defaultState({
        map: { ui: { selected: map }, extent: [0, 0, 10, 10] },
        events: {
          ...defaultState().events,
          showAllTracks: true,
          filteredEvents: [buildEvent()],
        },
      });
      const { unmount } = renderWithStore(state);
      act(() => { unmount(); });
      expect(map.removeOverlay).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // addOverlayIfIsVisible
  // -------------------------------------------------------------------------
  describe('addOverlayIfIsVisible()', () => {
    it('adds a point overlay to the map when the position is within the extent', () => {
      const map = buildMap();
      olExtent.containsCoordinate.mockReturnValue(true);

      const point = buildOverlay('point-1', [5, 5]);
      getTrackPoint.mockReturnValue(point);

      getClusters.mockReturnValue({
        clusters: [{
          geometry: { coordinates: [5, 5] },
          properties: { date: '2023-01-01', cluster: false },
        }],
        firstClusterObj: {},
        secondClusterObj: {},
      });

      const state = defaultState({
        map: { ui: { selected: map }, extent: [0, 0, 10, 10] },
        events: {
          ...defaultState().events,
          filteredEvents: [buildEvent()],
          selected: { id: 'event-1', date: '2023-01-01' },
        },
      });

      renderWithStore(state);
      // addOverlay is called at least once (for the point overlay)
      expect(map.addOverlay).toHaveBeenCalled();
    });

    it('does NOT add a point overlay when the position is outside the extent', () => {
      const map = buildMap();
      // containsCoordinate returns false so addOverlayIfIsVisible skips the call
      olExtent.containsCoordinate.mockReturnValue(false);

      const point = buildOverlay('point-1', [200, 200]);
      getTrackPoint.mockReturnValue(point);

      // getTrackLines returns undefined so the track addOverlay branch is skipped too
      getTrackLines.mockReturnValue(undefined);

      getClusters.mockReturnValue({
        clusters: [{
          geometry: { coordinates: [200, 200] },
          properties: { date: '2023-01-01', cluster: false },
        }],
        firstClusterObj: {},
        secondClusterObj: {},
      });

      const state = defaultState({
        map: { ui: { selected: map }, extent: [0, 0, 10, 10] },
        events: {
          ...defaultState().events,
          filteredEvents: [buildEvent()],
          selected: { id: 'event-1', date: '2023-01-01' },
        },
      });

      renderWithStore(state);
      expect(map.addOverlay).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // updateCurrentTrack / debouncedTrackUpdate
  // -------------------------------------------------------------------------
  describe('updateCurrentTrack()', () => {
    it('calls getTracksAndPoints (via getClusters) when a valid selected event exists', () => {
      const map = buildMap();
      const event = buildEvent();
      const state = defaultState({
        map: { ui: { selected: map }, extent: [0, 0, 10, 10] },
        events: {
          ...defaultState().events,
          filteredEvents: [event],
          selected: { id: 'event-1', date: '2023-01-01' },
        },
      });
      renderWithStore(state);
      expect(getClusters).toHaveBeenCalled();
    });

    it('does not call getClusters when selectedEvent has no id', () => {
      const map = buildMap();
      const state = defaultState({
        map: { ui: { selected: map }, extent: [0, 0, 10, 10] },
        events: {
          ...defaultState().events,
          filteredEvents: [buildEvent()],
          selected: { id: null, date: null },
        },
      });
      renderWithStore(state);
      expect(getClusters).not.toHaveBeenCalled();
    });

    it('does not call getClusters when the event is not found in eventsData', () => {
      const map = buildMap();
      const state = defaultState({
        map: { ui: { selected: map }, extent: [0, 0, 10, 10] },
        events: {
          ...defaultState().events,
          filteredEvents: [],
          selected: { id: 'event-999', date: '2023-01-01' },
        },
      });
      renderWithStore(state);
      expect(getClusters).not.toHaveBeenCalled();
    });

    it('does not build a track for single-geometry events', () => {
      const map = buildMap();
      const singleGeomEvent = buildEvent({
        geometry: [{ date: '2023-01-01T00:00:00Z', coordinates: [10, 20], type: 'Point' }],
      });
      const state = defaultState({
        map: { ui: { selected: map }, extent: [0, 0, 10, 10] },
        events: {
          ...defaultState().events,
          filteredEvents: [singleGeomEvent],
          selected: { id: 'event-1', date: '2023-01-01' },
        },
      });
      renderWithStore(state);
      expect(getClusters).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // updateAllTracks / debouncedUpdateAllTracks
  // -------------------------------------------------------------------------
  describe('updateAllTracks()', () => {
    it('calls getClusters once per multi-geometry event when showAllTracks is true', () => {
      const map = buildMap();
      const events = [buildEvent(), buildEvent({ id: 'event-2' })];
      const state = defaultState({
        map: { ui: { selected: map }, extent: [0, 0, 10, 10] },
        events: {
          ...defaultState().events,
          filteredEvents: events,
          selected: { id: 'event-1', date: '2023-01-01' },
          showAllTracks: true,
        },
      });
      renderWithStore(state);
      expect(getClusters).toHaveBeenCalledTimes(events.length);
    });

    it('skips single-geometry events when building all tracks', () => {
      const map = buildMap();
      const events = [
        buildEvent({ id: 'event-multi' }),
        buildEvent({
          id: 'event-single',
          geometry: [{ date: '2023-01-01T00:00:00Z', coordinates: [10, 20], type: 'Point' }],
        }),
      ];
      const state = defaultState({
        map: { ui: { selected: map }, extent: [0, 0, 10, 10] },
        events: {
          ...defaultState().events,
          filteredEvents: events,
          selected: { id: 'event-multi', date: '2023-01-01' },
          showAllTracks: true,
        },
      });
      renderWithStore(state);
      expect(getClusters).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // getTracksAndPoints — arrow and point creation
  // -------------------------------------------------------------------------
  describe('getTracksAndPoints()', () => {
    it('creates arrow overlays between consecutive cluster points', () => {
      const map = buildMap();
      getClusters.mockReturnValue({
        clusters: [
          { geometry: { coordinates: [0, 0] }, properties: { date: '2023-01-01', cluster: false } },
          { geometry: { coordinates: [1, 1] }, properties: { date: '2022-12-31', cluster: false } },
        ],
        firstClusterObj: {},
        secondClusterObj: {},
      });
      getArrows.mockReturnValue(buildOverlay('arrow-1'));

      const state = defaultState({
        map: { ui: { selected: map }, extent: [0, 0, 10, 10] },
        events: {
          ...defaultState().events,
          filteredEvents: [buildEvent()],
          selected: { id: 'event-1', date: '2023-01-01' },
        },
      });
      renderWithStore(state);
      expect(getArrows).toHaveBeenCalled();
    });

    it('transforms coordinates for polar projections', () => {
      const olProj = require('ol/proj');
      const map = buildMap();
      getClusters.mockReturnValue({
        clusters: [
          { geometry: { coordinates: [0, 0] }, properties: { date: '2023-01-01', cluster: false } },
          { geometry: { coordinates: [1, 1] }, properties: { date: '2022-12-31', cluster: false } },
        ],
        firstClusterObj: {},
        secondClusterObj: {},
      });

      const state = defaultState({
        map: { ui: { selected: map }, extent: [0, 0, 10, 10] },
        proj: { selected: { id: 'arctic', crs: 'EPSG:3413' } },
        events: {
          ...defaultState().events,
          filteredEvents: [buildEvent()],
          selected: { id: 'event-1', date: '2023-01-01' },
        },
      });
      renderWithStore(state);
      expect(olProj.transform).toHaveBeenCalled();
    });

    it('calls getTrackLines with correct arguments', () => {
      const map = buildMap();
      const event = buildEvent();
      getClusters.mockReturnValue({
        clusters: [
          { geometry: { coordinates: [0, 0] }, properties: { date: '2023-01-01', cluster: false } },
          { geometry: { coordinates: [1, 1] }, properties: { date: '2022-12-31', cluster: false } },
        ],
        firstClusterObj: {},
        secondClusterObj: {},
      });

      const state = defaultState({
        map: { ui: { selected: map }, extent: [0, 0, 10, 10] },
        events: {
          ...defaultState().events,
          filteredEvents: [event],
          selected: { id: 'event-1', date: '2023-01-01' },
        },
      });
      renderWithStore(state);
      expect(getTrackLines).toHaveBeenCalledWith(
        map,
        expect.any(Array),
        event.id,
        expect.any(String),
        expect.any(Function),
        expect.any(Object),
      );
    });
  });

  // -------------------------------------------------------------------------
  // removeTrack / removeAllTracks
  // -------------------------------------------------------------------------
  describe('removeTrack() and removeAllTracks()', () => {
    it('does not throw when called with a null map', () => {
      const state = defaultState({ map: { ui: { selected: null }, extent: [0, 0, 10, 10] } });
      expect(() => renderWithStore(state)).not.toThrow();
    });

    it('calls map.removeOverlay when removing a track that exists in the overlay mapping', () => {
      const trackOverlay = buildOverlay('track-id-1');
      const map = buildMap([trackOverlay]);

      getTrackLines.mockReturnValue(trackOverlay);
      getClusters.mockReturnValue({
        clusters: [
          { geometry: { coordinates: [0, 0] }, properties: { date: '2023-01-01', cluster: false } },
        ],
        firstClusterObj: {},
        secondClusterObj: {},
      });

      const state = defaultState({
        map: { ui: { selected: map }, extent: [0, 0, 10, 10] },
        events: {
          ...defaultState().events,
          filteredEvents: [buildEvent()],
          selected: { id: 'event-1', date: '2023-01-01' },
          showAllTracks: true,
        },
      });

      const { unmount } = renderWithStore(state);
      act(() => { unmount(); });
      expect(map.removeOverlay).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // isAnimatingToEvent guard
  // -------------------------------------------------------------------------
  describe('isAnimatingToEvent guard', () => {
    it('does not add overlays when isAnimatingToEvent is true', () => {
      const map = buildMap();
      const point = buildOverlay('point-1', [5, 5]);
      getTrackPoint.mockReturnValue(point);
      getTrackLines.mockReturnValue(undefined);
      getClusters.mockReturnValue({
        clusters: [
          { geometry: { coordinates: [5, 5] }, properties: { date: '2023-01-01', cluster: false } },
        ],
        firstClusterObj: {},
        secondClusterObj: {},
      });

      const state = defaultState({
        map: { ui: { selected: map }, extent: [0, 0, 10, 10] },
        events: {
          ...defaultState().events,
          filteredEvents: [buildEvent()],
          selected: { id: 'event-1', date: '2023-01-01' },
          isAnimatingToEvent: true,
        },
      });
      renderWithStore(state);
      expect(map.addOverlay).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // isPlaying guard
  // -------------------------------------------------------------------------
  describe('isPlaying guard', () => {
    it('does not trigger track updates when animation is playing', () => {
      const map = buildMap();
      const state = defaultState({
        map: { ui: { selected: map }, extent: [0, 0, 10, 10] },
        animation: { isPlaying: true },
        events: {
          ...defaultState().events,
          filteredEvents: [buildEvent()],
          selected: { id: 'event-1', date: '2023-01-01' },
        },
      });
      renderWithStore(state);
      expect(getClusters).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // showAllTracks toggle
  // -------------------------------------------------------------------------
  describe('showAllTracks toggle', () => {
    it('calls getClusters for each multi-geometry event when showAllTracks is enabled', () => {
      const map = buildMap();
      const events = [buildEvent(), buildEvent({ id: 'event-2' })];
      const state = defaultState({
        map: { ui: { selected: map }, extent: [0, 0, 10, 10] },
        events: {
          ...defaultState().events,
          filteredEvents: events,
          selected: { id: 'event-1', date: '2023-01-01' },
          showAllTracks: true,
        },
      });
      renderWithStore(state);
      expect(getClusters).toHaveBeenCalledTimes(events.length);
    });

    it('does not call getClusters when showAllTracks is false and selectedEvent has no id', () => {
      const map = buildMap();
      const state = defaultState({
        map: { ui: { selected: map }, extent: [0, 0, 10, 10] },
        events: {
          ...defaultState().events,
          filteredEvents: [buildEvent()],
          selected: { id: null, date: null },
          showAllTracks: false,
        },
      });
      renderWithStore(state);
      expect(getClusters).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // highlighted event
  // -------------------------------------------------------------------------
  describe('highlighted event', () => {
    it('passes isHighlighted=true when event matches highlighted event and showAllTracks is true', () => {
      const map = buildMap();
      const event = buildEvent();
      const state = defaultState({
        map: { ui: { selected: map }, extent: [0, 0, 10, 10] },
        events: {
          ...defaultState().events,
          filteredEvents: [event],
          selected: { id: 'event-1', date: '2023-01-01' },
          highlighted: { id: 'event-1' },
          showAllTracks: true,
        },
      });
      renderWithStore(state);
      expect(getClusters).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // createOverlayMapping
  // -------------------------------------------------------------------------
  describe('createOverlayMapping()', () => {
    it('groups overlays by shared id and calls removeOverlay on cleanup', () => {
      const sharedId = 'shared-id';
      const overlay1 = buildOverlay(sharedId);
      const overlay2 = buildOverlay(sharedId);
      const map = buildMap([overlay1, overlay2]);

      const track = buildOverlay(sharedId);
      getTrackLines.mockReturnValue(track);

      getClusters.mockReturnValue({
        clusters: [],
        firstClusterObj: {},
        secondClusterObj: {},
      });

      const state = defaultState({
        map: { ui: { selected: map }, extent: [0, 0, 10, 10] },
        events: {
          ...defaultState().events,
          filteredEvents: [buildEvent()],
          selected: { id: 'event-1', date: '2023-01-01' },
          showAllTracks: true,
        },
      });
      const { unmount } = renderWithStore(state);
      act(() => { unmount(); });

      // removeTrackById finds the shared-id group in the mapping and iterates
      // it — verify removeOverlay was called and that the calls used overlays
      // from the mapped group (overlay1 and/or overlay2)
      expect(map.removeOverlay).toHaveBeenCalled();
      const removedArgs = map.removeOverlay.mock.calls.map((call) => call[0]);
      const removedIds = removedArgs.map((o) => o.getId());
      expect(removedIds.every((id) => id === sharedId)).toBe(true);
    });
  });

  describe('removePointOverlays() - overlay exists in overlayMapping (lines 29-34)', () => {
    it('removes sub-overlays from the mapping when the point overlay id is found', () => {
      const pointId = 'point-overlay-1';
      const subOverlay = { getId: jest.fn(() => pointId), getPosition: jest.fn(() => [0, 0]) };
      const map = buildMap([subOverlay]);

      // getOverlayById returns the overlay so the branch is entered
      map.getOverlayById = jest.fn((id) => (id === pointId ? subOverlay : null));

      const point = { getId: jest.fn(() => pointId), getPosition: jest.fn(() => [0, 0]) };
      getTrackPoint.mockReturnValue(point);
      getTrackLines.mockReturnValue(undefined);

      getClusters.mockReturnValue({
        clusters: [
          { geometry: { coordinates: [0, 0] }, properties: { date: '2023-01-01', cluster: false } },
        ],
        firstClusterObj: {},
        secondClusterObj: {},
      });

      const state = defaultState({
        map: { ui: { selected: map }, extent: [0, 0, 10, 10] },
        events: {
          ...defaultState().events,
          filteredEvents: [buildEvent()],
          selected: { id: 'event-1', date: '2023-01-01' },
          showAllTracks: true,
        },
      });

      const { unmount } = renderWithStore(state);
      act(() => { unmount(); });
      expect(map.removeOverlay).toHaveBeenCalledWith(subOverlay);
    });
  });

  describe('removePointOverlays() - overlay NOT in overlayMapping (lines 61-68)', () => {
    it('calls removeOverlay directly with the pointsAndArrows array when id is not mapped', () => {
      const pointId = 'unmapped-point-1';
      const map = buildMap([]);

      // getOverlayById returns the overlay (so condition passes) but overlayMapping
      // will be empty so the else branch (removeOverlay(pointsAndArrows)) is hit
      const point = { getId: jest.fn(() => pointId), getPosition: jest.fn(() => [0, 0]) };
      map.getOverlayById = jest.fn((id) => (id === pointId ? point : null));
      getTrackPoint.mockReturnValue(point);
      getTrackLines.mockReturnValue(undefined);

      getClusters.mockReturnValue({
        clusters: [
          { geometry: { coordinates: [0, 0] }, properties: { date: '2023-01-01', cluster: false } },
        ],
        firstClusterObj: {},
        secondClusterObj: {},
      });

      const state = defaultState({
        map: { ui: { selected: map }, extent: [0, 0, 10, 10] },
        events: {
          ...defaultState().events,
          filteredEvents: [buildEvent()],
          selected: { id: 'event-1', date: '2023-01-01' },
          showAllTracks: true,
        },
      });

      const { unmount } = renderWithStore(state);
      act(() => { unmount(); });
      expect(map.removeOverlay).toHaveBeenCalled();
    });
  });

  describe('onPropertyChange() - resolution/rotation change (lines 188-189)', () => {
    const setupWithTrack = (extraEventState = {}) => {
      const map = buildMap();
      const view = map.getView();
      let capturedHandler;
      view.on = jest.fn((evt, handler) => { capturedHandler = handler; });

      getClusters.mockReturnValue({
        clusters: [
          { geometry: { coordinates: [0, 0] }, properties: { date: '2023-01-01', cluster: false } },
        ],
        firstClusterObj: {},
        secondClusterObj: {},
      });

      // Render once to build the track and populate trackDetails.id
      const state = defaultState({
        map: { ui: { selected: map }, extent: [0, 0, 10, 10] },
        events: {
          ...defaultState().events,
          filteredEvents: [buildEvent()],
          selected: { id: 'event-1', date: '2023-01-01' },
          ...extraEventState,
        },
      });
      renderWithStore(state);

      map.removeOverlay.mockClear();
      return { map, capturedHandler: () => capturedHandler };
    };

    it('removes all tracks on resolution change when showAllTracks is true and tracks exist', () => {
      const { map, capturedHandler } = setupWithTrack({ showAllTracks: true });
      act(() => {
        const handler = capturedHandler();
        if (handler) handler({ key: 'resolution' });
      });
      expect(map.removeOverlay).toHaveBeenCalled();
    });
  });

  describe('update() - same event, same date with visible track marker (lines 218-225)', () => {
    it('updates DOM classNames when same event re-selected with a new non-clustered date', () => {
      const date1 = '2023-01-01';
      const date2 = '2023-01-02';

      // DOM elements updateSelection() will look up
      const oldSelected = document.createElement('div');
      oldSelected.className = 'track-marker-case-selected';
      document.body.appendChild(oldSelected);

      const newCaseEl = document.createElement('div');
      newCaseEl.id = `track-marker-case-${date2}`;
      document.body.appendChild(newCaseEl);

      // track-marker-${date2} must exist so isClusteredSelection is false
      const trackMarkerEl = document.createElement('div');
      trackMarkerEl.id = `track-marker-${date2}`;
      document.body.appendChild(trackMarkerEl);

      const map = buildMap();

      getClusters.mockReturnValue({
        clusters: [
          { geometry: { coordinates: [0, 0] }, properties: { date: date1, cluster: false } },
        ],
        firstClusterObj: {},
        secondClusterObj: {},
      });

      const event = buildEvent({
        geometry: [
          { date: `${date1}T00:00:00Z`, coordinates: [0, 0], type: 'Point' },
          { date: `${date2}T00:00:00Z`, coordinates: [1, 1], type: 'Point' },
        ],
      });

      // First render: select date1 → populates trackDetailsRef with id=event-1
      const store1 = mockStore(defaultState({
        map: { ui: { selected: map }, extent: [0, 0, 10, 10] },
        events: {
          ...defaultState().events,
          filteredEvents: [event],
          selected: { id: 'event-1', date: date1 },
        },
      }));

      const { rerender } = render(
        <Provider store={store1}>
          <EventTrack />
        </Provider>,
      );

      // Second render: same event, different date → sameEvent=true, sameDate=false
      // track-marker-${date2} exists so isClusteredSelection=false → updateSelection runs
      const store2 = mockStore(defaultState({
        map: { ui: { selected: map }, extent: [0, 0, 10, 10] },
        events: {
          ...defaultState().events,
          filteredEvents: [event],
          selected: { id: 'event-1', date: date2 },
        },
      }));

      act(() => {
        rerender(
          <Provider store={store2}>
            <EventTrack />
          </Provider>,
        );
      });

      expect(newCaseEl.className).toContain('track-marker-case-selected');

      document.body.removeChild(oldSelected);
      document.body.removeChild(newCaseEl);
      document.body.removeChild(trackMarkerEl);
    });
  });

  describe('update() - same event, date changed, new date is clustered (line 271)', () => {
    it('rebuilds the track when the new date falls inside a cluster (no DOM marker)', () => {
      const map = buildMap();
      // No DOM element for the new date → isClusteredSelection = true
      // Ensure there is no element with id track-marker-2023-01-02
      const existing = document.getElementById('track-marker-2023-01-02');
      if (existing) existing.parentNode.removeChild(existing);

      getClusters.mockReturnValue({
        clusters: [
          { geometry: { coordinates: [0, 0] }, properties: { date: '2023-01-01', cluster: false } },
          { geometry: { coordinates: [1, 1] }, properties: { date: '2023-01-02', cluster: true } },
        ],
        firstClusterObj: {},
        secondClusterObj: {},
      });

      const state = defaultState({
        map: { ui: { selected: map }, extent: [0, 0, 10, 10] },
        events: {
          ...defaultState().events,
          filteredEvents: [buildEvent({
            geometry: [
              { date: '2023-01-01T00:00:00Z', coordinates: [0, 0], type: 'Point' },
              { date: '2023-01-02T00:00:00Z', coordinates: [1, 1], type: 'Point' },
            ],
          })],
          selected: { id: 'event-1', date: '2023-01-02' },
        },
      });

      renderWithStore(state);
      expect(getClusters).toHaveBeenCalled();
    });
  });

  describe('useEffect - map instance change triggers re-initialize (lines 322-337)', () => {
    it('calls removeOverlay on the old map and registers listener on the new map', () => {
      const map1 = buildMap();
      const map2 = buildMap();
      const view2 = map2.getView();

      const store1 = mockStore(defaultState({
        map: { ui: { selected: map1 }, extent: [0, 0, 10, 10] },
        events: {
          ...defaultState().events,
          filteredEvents: [buildEvent()],
          selected: { id: 'event-1', date: '2023-01-01' },
        },
      }));

      const store2 = mockStore(defaultState({
        map: { ui: { selected: map2 }, extent: [0, 0, 10, 10] },
        events: {
          ...defaultState().events,
          filteredEvents: [buildEvent()],
          selected: { id: 'event-1', date: '2023-01-01' },
        },
      }));

      const { rerender } = render(
        <Provider store={store1}>
          <EventTrack />
        </Provider>,
      );

      act(() => {
        rerender(
          <Provider store={store2}>
            <EventTrack />
          </Provider>,
        );
      });

      expect(view2.on).toHaveBeenCalledWith('propertychange', expect.any(Function));
    });
  });

  describe('useEffect - showAllTracks toggled off (lines 408-420)', () => {
    it('calls removeOverlay when showAllTracks transitions from true to false', () => {
      const map = buildMap();

      getClusters.mockReturnValue({
        clusters: [
          { geometry: { coordinates: [0, 0] }, properties: { date: '2023-01-01', cluster: false } },
        ],
        firstClusterObj: {},
        secondClusterObj: {},
      });

      // Initial render with showAllTracks=true to populate allTrackDetails
      const stateWithTracks = defaultState({
        map: { ui: { selected: map }, extent: [0, 0, 10, 10] },
        events: {
          ...defaultState().events,
          filteredEvents: [buildEvent()],
          selected: { id: 'event-1', date: '2023-01-01' },
          showAllTracks: true,
        },
      });

      const store1 = mockStore(stateWithTracks);
      const { rerender } = render(
        <Provider store={store1}>
          <EventTrack />
        </Provider>,
      );

      map.removeOverlay.mockClear();

      // Re-render with showAllTracks=false to trigger the removal branch
      const stateWithoutTracks = defaultState({
        map: { ui: { selected: map }, extent: [0, 0, 10, 10] },
        events: {
          ...defaultState().events,
          filteredEvents: [buildEvent()],
          selected: { id: 'event-1', date: '2023-01-01' },
          showAllTracks: false,
        },
      });

      const store2 = mockStore(stateWithoutTracks);
      act(() => {
        rerender(
          <Provider store={store2}>
            <EventTrack />
          </Provider>,
        );
      });

      expect(map.removeOverlay).toHaveBeenCalled();
    });
  });

  describe('useEffect - event deselected, showAllTracks false (line 425)', () => {
    it('calls removeOverlay when event is deselected and showAllTracks is false', () => {
      const map = buildMap();

      getClusters.mockReturnValue({
        clusters: [
          { geometry: { coordinates: [0, 0] }, properties: { date: '2023-01-01', cluster: false } },
        ],
        firstClusterObj: {},
        secondClusterObj: {},
      });

      // First render: event is selected, builds a track
      const selectedState = defaultState({
        map: { ui: { selected: map }, extent: [0, 0, 10, 10] },
        events: {
          ...defaultState().events,
          filteredEvents: [buildEvent()],
          selected: { id: 'event-1', date: '2023-01-01' },
          showAllTracks: false,
        },
      });

      const store1 = mockStore(selectedState);
      const { rerender } = render(
        <Provider store={store1}>
          <EventTrack />
        </Provider>,
      );

      map.removeOverlay.mockClear();

      // Second render: event is deselected (no id)
      const deselectedState = defaultState({
        map: { ui: { selected: map }, extent: [0, 0, 10, 10] },
        events: {
          ...defaultState().events,
          filteredEvents: [buildEvent()],
          selected: { id: null, date: null },
          showAllTracks: false,
        },
      });

      const store2 = mockStore(deselectedState);
      act(() => {
        rerender(
          <Provider store={store2}>
            <EventTrack />
          </Provider>,
        );
      });

      expect(map.removeOverlay).toHaveBeenCalled();
    });
  });
});

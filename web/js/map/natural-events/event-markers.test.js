// event-markers.test.js

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('react-dom/client', () => {
  const actual = jest.requireActual('react-dom/client');
  return {
    ...actual,
    createRoot: jest.fn((container) => {
      // Use the real createRoot for @testing-library/react containers,
      // mock it for EventIcon pin overlays created via document.createElement
      if (container?.parentNode) {
        return actual.createRoot(container);
      }
      return { render: jest.fn(), unmount: jest.fn() };
    }),
  };
});

jest.mock('ol/Overlay', () =>
  jest.fn().mockImplementation((opts) => ({
    element: null,
    setPosition: jest.fn(),
    setMap: jest.fn(),
    ...opts,
  })),
);

jest.mock('ol/Feature', () => jest.fn().mockImplementation(() => ({})));

jest.mock('ol/style/Style', () => jest.fn().mockImplementation(() => ({})));

jest.mock('ol/style/Stroke', () => jest.fn().mockImplementation(() => ({})));

jest.mock('ol/layer/Vector', () =>
  jest.fn().mockImplementation(() => ({
    setMap: jest.fn(),
  })),
);

jest.mock('ol/source/Vector', () => jest.fn().mockImplementation(() => ({})));

jest.mock('ol/geom/Polygon', () =>
  jest.fn().mockImplementation(() => ({
    transform: jest.fn().mockReturnThis(),
  })),
);

jest.mock('ol/extent', () => ({
  boundingExtent: jest.fn(() => [0, 0, 10, 10]),
  getCenter: jest.fn(() => [5, 5]),
}));

jest.mock('ol/proj', () => ({
  transform: jest.fn((coords) => coords),
}));

jest.mock('googleTagManager', () => ({ pushEvent: jest.fn() }));

jest.mock('../../components/sidebar/event-icon', () => () => null);

jest.mock('../../modules/natural-events/actions', () => ({
  selectEvent: jest.fn((id, date) => ({ type: 'SELECT_EVENT', id, date })),
  highlightEvent: jest.fn((id, date) => ({ type: 'HIGHLIGHT_EVENT', id, date })),
  unHighlightEvent: jest.fn(() => ({ type: 'UNHIGHLIGHT_EVENT' })),
}));

jest.mock('../../modules/natural-events/util', () => ({
  getDefaultEventDate: jest.fn(() => '2023-01-01'),
}));

jest.mock('../../modules/natural-events/selectors', () => ({
  getFilteredEvents: jest.fn((state) => state.filteredEvents || []),
}));

jest.mock('../../modules/map/constants', () => ({
  CRS: {
    GEOGRAPHIC: 'EPSG:4326',
    ARCTIC: 'EPSG:3413',
    ANTARCTIC: 'EPSG:3031',
  },
}));

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------
import { render, cleanup, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import googleTagManager from 'googleTagManager';
import { getDefaultEventDate } from '../../modules/natural-events/util';
import * as olExtent from 'ol/extent';
import * as olProj from 'ol/proj';

import EventMarkers from './event-markers';

const mockStoreCreator = configureMockStore([]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const buildMap = () => ({
  addOverlay: jest.fn(),
  removeOverlay: jest.fn(),
  addLayer: jest.fn(),
  removeLayer: jest.fn(),
  getView: jest.fn(() => ({ changed: jest.fn() })),
  renderSync: jest.fn(),
});

const buildMapUi = (supportsPassive = false) => ({ supportsPassive });

const geographicProj = () => ({ selected: { id: 'geographic', crs: 'EPSG:4326' } });
const polarProj = () => ({ selected: { id: 'arctic', crs: 'EPSG:3413' } });

const buildPointEvent = (overrides = {}) => ({
  id: 'event-1',
  title: 'Test Wildfire',
  categories: [{ id: 'wildfires', title: 'Wildfires' }],
  geometry: [{ type: 'Point', date: '2023-01-01T00:00:00Z', coordinates: [10, 20] }],
  ...overrides,
});

const buildPolygonEvent = (overrides = {}) => ({
  id: 'event-2',
  title: 'Test Flood',
  categories: [{ id: 'floods', title: 'Floods' }],
  geometry: [
    {
      type: 'Polygon',
      date: '2023-01-01T00:00:00Z',
      coordinates: [[[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]]],
    },
  ],
  ...overrides,
});

const buildStoreState = (overrides = {}) => {
  const map = overrides.map || buildMap();
  const mapUi = overrides.mapUi || buildMapUi();
  return {
    map: { ui: { selected: map, ...mapUi } },
    proj: overrides.proj || geographicProj(),
    events: {
      selected: overrides.selectedEvent || null,
      isAnimatingToEvent: overrides.isAnimatingToEvent || false,
    },
    screenSize: { isMobileDevice: overrides.isMobile || false },
    filteredEvents: overrides.eventsData || [],
    requestedEvents: { isLoading: overrides.eventsDataIsLoading || false },
    date: { selected: overrides.selectedDate || '2023-01-01' },
    sidebar: { activeTab: 'events' },
  };
};

const renderComponent = (storeOverrides = {}) => {
  const state = buildStoreState(storeOverrides);
  const store = mockStoreCreator(state);
  let result;
  act(() => {
    result = render(
      <Provider store={store}>
        <EventMarkers />
      </Provider>,
    );
  });
  return { ...result, store, state };
};

const rerenderWithNewStore = (rerender, storeOverrides = {}) => {
  const state = buildStoreState(storeOverrides);
  const store = mockStoreCreator(state);
  act(() => {
    rerender(
      <Provider store={store}>
        <EventMarkers />
      </Provider>,
    );
  });
  return { store, state };
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('EventMarkers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getDefaultEventDate.mockReturnValue('2023-01-01');
  });

  afterEach(() => {
    cleanup();
  });

  // -------------------------------------------------------------------------
  // Mount behavior (replaces componentDidMount)
  // -------------------------------------------------------------------------
  describe('mount behavior', () => {
    it('calls draw when eventsDataIsLoading is false', () => {
      const map = buildMap();
      renderComponent({
        map,
        eventsData: [buildPointEvent()],
        selectedEvent: { id: 'other-event' },
      });
      expect(map.addOverlay).toHaveBeenCalledTimes(1);
    });

    it('does NOT call draw when eventsDataIsLoading is true', () => {
      const map = buildMap();
      renderComponent({
        map,
        eventsData: [buildPointEvent()],
        eventsDataIsLoading: true,
        selectedEvent: { id: 'other-event' },
      });
      expect(map.addOverlay).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Update behavior (replaces componentDidUpdate)
  // -------------------------------------------------------------------------
  describe('update behavior', () => {
    it('redraws when loading transitions from true → false', () => {
      const map = buildMap();
      const { rerender } = renderComponent({
        map,
        eventsData: [buildPointEvent()],
        eventsDataIsLoading: true,
        selectedEvent: { id: 'other-event' },
      });
      expect(map.addOverlay).not.toHaveBeenCalled();

      rerenderWithNewStore(rerender, {
        map,
        eventsData: [buildPointEvent()],
        eventsDataIsLoading: false,
        selectedEvent: { id: 'other-event' },
      });
      expect(map.addOverlay).toHaveBeenCalled();
    });

    it('redraws when the projection changes', () => {
      const map = buildMap();
      const { rerender } = renderComponent({
        map,
        eventsData: [buildPointEvent()],
        proj: geographicProj(),
        selectedEvent: { id: 'other-event' },
      });
      map.addOverlay.mockClear();
      map.removeOverlay.mockClear();

      rerenderWithNewStore(rerender, {
        map,
        eventsData: [buildPointEvent()],
        proj: polarProj(),
        selectedEvent: { id: 'other-event' },
      });
      expect(map.addOverlay).toHaveBeenCalled();
    });

    it('redraws when animation finishes (true → false)', () => {
      const map = buildMap();
      const { rerender } = renderComponent({
        map,
        eventsData: [buildPointEvent()],
        isAnimatingToEvent: true,
        selectedEvent: { id: 'other-event' },
      });

      rerenderWithNewStore(rerender, {
        map,
        eventsData: [buildPointEvent()],
        isAnimatingToEvent: false,
        selectedEvent: { id: 'other-event' },
      });
      // Should have drawn at least once after animation finished
      expect(map.addOverlay).toHaveBeenCalled();
    });

    it('redraws when selectedEvent changes', () => {
      const map = buildMap();
      const { rerender } = renderComponent({
        map,
        eventsData: [buildPointEvent()],
        selectedEvent: { id: 'event-old' },
      });
      map.addOverlay.mockClear();

      rerenderWithNewStore(rerender, {
        map,
        eventsData: [buildPointEvent()],
        selectedEvent: { id: 'event-new' },
      });
      expect(map.addOverlay).toHaveBeenCalled();
    });

    it('does NOT redraw when nothing relevant changes', () => {
      const map = buildMap();
      const sharedProj = geographicProj();
      const sharedSelected = { id: 'event-1' };
      const { rerender } = renderComponent({
        map,
        eventsData: [buildPointEvent()],
        proj: sharedProj,
        selectedEvent: sharedSelected,
      });
      map.addOverlay.mockClear();

      // Re-render with same references
      rerenderWithNewStore(rerender, {
        map,
        eventsData: [buildPointEvent()],
        proj: sharedProj,
        selectedEvent: sharedSelected,
      });
      expect(map.addOverlay).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Unmount behavior (replaces componentWillUnmount)
  // -------------------------------------------------------------------------
  describe('unmount behavior', () => {
    it('calls remove when the component unmounts', () => {
      const map = buildMap();
      const { unmount } = renderComponent({
        map,
        eventsData: [buildPointEvent()],
        selectedEvent: { id: 'other-event' },
      });
      expect(map.addOverlay).toHaveBeenCalled();
      unmount();
      expect(map.removeOverlay).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // render
  // -------------------------------------------------------------------------
  describe('render', () => {
    it('returns null', () => {
      const { container } = renderComponent();
      expect(container.innerHTML).toBe('');
    });
  });

  // -------------------------------------------------------------------------
  // draw() – guard clauses
  // -------------------------------------------------------------------------
  describe('draw() – guard clauses', () => {
    it('does not add overlays when eventsData is null', () => {
      const map = buildMap();
      renderComponent({ map, eventsData: null });
      expect(map.addOverlay).not.toHaveBeenCalled();
    });

    it('does not add overlays when eventsData is an empty array', () => {
      const map = buildMap();
      renderComponent({ map, eventsData: [] });
      expect(map.addOverlay).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // draw() – geographic projection, Point geometry
  // -------------------------------------------------------------------------
  describe('draw() – geographic projection, Point geometry', () => {
    it('adds a pin overlay to the map', () => {
      const map = buildMap();
      renderComponent({
        map,
        eventsData: [buildPointEvent()],
        selectedEvent: { id: 'other-event' },
      });
      expect(map.addOverlay).toHaveBeenCalled();
    });

    it('sets the correct pin position from Point coordinates', () => {
      const map = buildMap();
      renderComponent({
        map,
        eventsData: [buildPointEvent()],
        selectedEvent: { id: 'other-event' },
      });
      const overlay = map.addOverlay.mock.calls[0][0];
      expect(overlay.setPosition).toHaveBeenCalledWith([10, 20]);
    });

    it('falls back to a default category when the category id is not in the icons list', () => {
      const map = buildMap();
      expect(() => renderComponent({
        map,
        eventsData: [buildPointEvent({ categories: [{ id: 'unknown', title: 'Unknown' }] })],
        selectedEvent: { id: 'other-event' },
      })).not.toThrow();
      expect(map.addOverlay).toHaveBeenCalled();
    });

    it('uses selectedEvent.date for geometry lookup when the event is selected', () => {
      const map = buildMap();
      renderComponent({
        map,
        eventsData: [buildPointEvent()],
        selectedEvent: { id: 'event-1', date: '2023-02-15' },
      });
      expect(map.addOverlay).toHaveBeenCalled();
    });

    it('calls map.getView().changed() and map.renderSync() after drawing', () => {
      const mockChanged = jest.fn();
      const map = {
        ...buildMap(),
        getView: jest.fn(() => ({ changed: mockChanged })),
      };
      renderComponent({
        map,
        eventsData: [buildPointEvent()],
        selectedEvent: { id: 'other-event' },
      });
      expect(mockChanged).toHaveBeenCalled();
      expect(map.renderSync).toHaveBeenCalled();
    });

    it('hides tooltips when isMobile is true', () => {
      const map = buildMap();
      expect(() => renderComponent({
        map,
        isMobile: true,
        eventsData: [buildPointEvent()],
        selectedEvent: { id: 'other-event' },
      })).not.toThrow();
    });

    it('hides tooltips when isAnimatingToEvent is true', () => {
      const map = buildMap();
      expect(() => renderComponent({
        map,
        isAnimatingToEvent: true,
        eventsData: [buildPointEvent()],
        eventsDataIsLoading: false,
        selectedEvent: { id: 'other-event' },
      })).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // draw() – geographic projection, Polygon geometry
  // -------------------------------------------------------------------------
  describe('draw() – geographic projection, Polygon geometry', () => {
    it('computes the bounding-box centre for a Polygon event', () => {
      const map = buildMap();
      renderComponent({
        map,
        eventsData: [buildPolygonEvent()],
        selectedEvent: { id: 'other-event' },
      });
      expect(olExtent.boundingExtent).toHaveBeenCalled();
      expect(olExtent.getCenter).toHaveBeenCalled();
      expect(map.addOverlay).toHaveBeenCalled();
    });

    it('adds a bounding-box layer when the Polygon event IS selected', () => {
      const map = buildMap();
      renderComponent({
        map,
        eventsData: [buildPolygonEvent()],
        selectedEvent: { id: 'event-2' },
      });
      expect(map.addLayer).toHaveBeenCalled();
    });

    it('does NOT add a bounding-box layer when the Polygon event is NOT selected', () => {
      const map = buildMap();
      renderComponent({
        map,
        eventsData: [buildPolygonEvent()],
        selectedEvent: { id: 'other-event' },
      });
      expect(map.addLayer).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // draw() – polar projection
  // -------------------------------------------------------------------------
  describe('draw() – polar projection', () => {
    it('transforms Point coordinates for a polar projection', () => {
      const map = buildMap();
      renderComponent({
        map,
        proj: polarProj(),
        eventsData: [buildPointEvent()],
        selectedEvent: { id: 'other-event' },
      });
      expect(olProj.transform).toHaveBeenCalled();
      expect(map.addOverlay).toHaveBeenCalled();
    });

    it('handles a Polygon in polar projection and adds bounding-box when selected', () => {
      const map = buildMap();
      renderComponent({
        map,
        proj: polarProj(),
        eventsData: [buildPolygonEvent()],
        selectedEvent: { id: 'event-2' },
      });
      expect(map.addLayer).toHaveBeenCalled();
      expect(olExtent.getCenter).toHaveBeenCalled();
    });

    it('handles a Polygon in polar projection WITHOUT bounding-box when not selected', () => {
      const map = buildMap();
      renderComponent({
        map,
        proj: polarProj(),
        eventsData: [buildPolygonEvent()],
        selectedEvent: { id: 'other-event' },
      });
      expect(map.addLayer).not.toHaveBeenCalled();
      expect(map.addOverlay).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // draw() – geometry edge cases
  // -------------------------------------------------------------------------
  describe('draw() – geometry edge cases', () => {
    it('skips adding an overlay when the event has no geometry entries', () => {
      const map = buildMap();
      renderComponent({
        map,
        eventsData: [buildPointEvent({ geometry: [] })],
        selectedEvent: { id: 'other-event' },
      });
      expect(map.addOverlay).not.toHaveBeenCalled();
    });

    it('falls back to geometry[0] when no geometry matches the resolved date', () => {
      const map = buildMap();
      renderComponent({
        map,
        eventsData: [buildPointEvent({
          geometry: [{ type: 'Point', date: '2022-06-15T00:00:00Z', coordinates: [5, 15] }],
        })],
        selectedEvent: { id: 'other-event' },
      });
      expect(map.addOverlay).toHaveBeenCalled();
    });

    it('creates a marker overlay for each event in eventsData', () => {
      const map = buildMap();
      renderComponent({
        map,
        eventsData: [
          buildPointEvent({ id: 'event-1' }),
          buildPointEvent({ id: 'event-2', categories: [{ id: 'volcanoes', title: 'Volcanoes' }] }),
          buildPolygonEvent({ id: 'event-3' }),
        ],
        selectedEvent: { id: 'event-1' },
      });
      expect(map.addOverlay).toHaveBeenCalledTimes(3);
    });
  });

  // -------------------------------------------------------------------------
  // remove()
  // -------------------------------------------------------------------------
  describe('remove()', () => {
    it('is a no-op when the markers array is empty', () => {
      const map = buildMap();
      const { unmount } = renderComponent({ map });
      unmount();
      expect(map.removeOverlay).not.toHaveBeenCalled();
      expect(map.removeLayer).not.toHaveBeenCalled();
    });

    it('calls setMap(null) and removeOverlay for a marker pin on unmount', () => {
      const map = buildMap();
      const { unmount } = renderComponent({
        map,
        eventsData: [buildPointEvent()],
        selectedEvent: { id: 'other-event' },
      });
      expect(map.addOverlay).toHaveBeenCalled();
      const pin = map.addOverlay.mock.calls[0][0];
      unmount();
      expect(pin.setMap).toHaveBeenCalledWith(null);
      expect(map.removeOverlay).toHaveBeenCalledWith(pin);
    });

    it('calls setMap(null) and removeLayer for a marker boundingBox on unmount', () => {
      const map = buildMap();
      const { unmount } = renderComponent({
        map,
        eventsData: [buildPolygonEvent()],
        selectedEvent: { id: 'event-2' },
      });
      expect(map.addLayer).toHaveBeenCalled();
      const boundingBox = map.addLayer.mock.calls[0][0];
      unmount();
      expect(boundingBox.setMap).toHaveBeenCalledWith(null);
      expect(map.removeLayer).toHaveBeenCalledWith(boundingBox);
    });

    it('removes tooltip DOM elements with class event-icon-tooltip', () => {
      const map = buildMap();
      const tooltip = document.createElement('div');
      tooltip.className = 'event-icon-tooltip';
      document.body.appendChild(tooltip);
      const tooltipRemoveSpy = jest.spyOn(tooltip, 'remove');

      const { unmount } = renderComponent({
        map,
        eventsData: [buildPointEvent()],
        selectedEvent: { id: 'other-event' },
      });
      unmount();

      expect(tooltipRemoveSpy).toHaveBeenCalled();
      tooltip.parentNode?.removeChild(tooltip);
    });
  });

  // -------------------------------------------------------------------------
  // addInteractions()
  // -------------------------------------------------------------------------
  describe('addInteractions()', () => {
    const setup = (overrides = {}) => {
      const map = buildMap();
      const { store } = renderComponent({
        map,
        eventsData: [buildPointEvent()],
        selectedEvent: overrides.isSelected ? { id: 'event-1' } : { id: 'other-event' },
        mapUi: buildMapUi(overrides.supportsPassive || false),
      });
      const overlay = map.addOverlay.mock.calls[0]?.[0];
      const pinEl = overlay?.element;
      return { pinEl, store };
    };

    afterEach(() => {
      document.body.innerHTML = '';
    });

    it('dispatches highlightEvent on mouseenter', () => {
      const { pinEl, store } = setup();
      pinEl.dispatchEvent(new MouseEvent('mouseenter'));
      const actions = store.getActions();
      expect(actions).toContainEqual(expect.objectContaining({ type: 'HIGHLIGHT_EVENT' }));
    });

    it('dispatches unHighlightEvent on mouseleave', () => {
      const { pinEl, store } = setup();
      pinEl.dispatchEvent(new MouseEvent('mouseleave'));
      const actions = store.getActions();
      expect(actions).toContainEqual(expect.objectContaining({ type: 'UNHIGHLIGHT_EVENT' }));
    });

    it('dispatches selectEvent on click when not selected and not dragged', () => {
      const { pinEl, store } = setup();
      pinEl.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      pinEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      const actions = store.getActions();
      expect(actions).toContainEqual(expect.objectContaining({ type: 'SELECT_EVENT' }));
    });

    it('does NOT dispatch selectEvent when the event is already selected', () => {
      const { pinEl, store } = setup({ isSelected: true });
      pinEl.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      pinEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      const actions = store.getActions();
      expect(actions).not.toContainEqual(expect.objectContaining({ type: 'SELECT_EVENT' }));
    });

    it('does NOT dispatch selectEvent after more than 2 mousemove events (drag)', () => {
      const { pinEl, store } = setup();
      pinEl.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      pinEl.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
      pinEl.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
      pinEl.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
      pinEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      const actions = store.getActions();
      expect(actions).not.toContainEqual(expect.objectContaining({ type: 'SELECT_EVENT' }));
    });

    it('pushes a Google Tag Manager event on successful selection', () => {
      const { pinEl } = setup();
      pinEl.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      pinEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(googleTagManager.pushEvent).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'natural_event_selected' }),
      );
    });

    it('resets willSelect and moveCount on a new mousedown after a drag', () => {
      const { pinEl, store } = setup();
      pinEl.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      pinEl.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
      pinEl.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
      pinEl.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
      // A fresh mousedown resets willSelect and moveCount
      pinEl.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      pinEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      const actions = store.getActions();
      expect(actions).toContainEqual(expect.objectContaining({ type: 'SELECT_EVENT' }));
    });

    it('fires selectEvent on touchend when not selected and not dragged', () => {
      const { pinEl, store } = setup();
      pinEl.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
      pinEl.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
      const actions = store.getActions();
      expect(actions).toContainEqual(expect.objectContaining({ type: 'SELECT_EVENT' }));
    });

    it('uses { passive: true } listener option when supportsPassive is true', () => {
      const spy = jest.spyOn(HTMLElement.prototype, 'addEventListener');
      setup({ supportsPassive: true });
      const passiveCalls = spy.mock.calls.filter(([, , opts]) => opts?.passive === true);
      expect(passiveCalls.length).toBeGreaterThan(0);
      spy.mockRestore();
    });

    it('uses false as the listener option when supportsPassive is false', () => {
      const spy = jest.spyOn(HTMLElement.prototype, 'addEventListener');
      setup({ supportsPassive: false });
      const falseCalls = spy.mock.calls.filter(([, , opts]) => opts === false);
      expect(falseCalls.length).toBeGreaterThan(0);
      spy.mockRestore();
    });
  });
});

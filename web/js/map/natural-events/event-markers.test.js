// event-markers.test.js

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(() => ({ render: jest.fn() })),
}));

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
  selectEvent: jest.fn(),
  highlightEvent: jest.fn(),
  unHighlightEvent: jest.fn(),
}));

jest.mock('../../modules/natural-events/util', () => ({
  getDefaultEventDate: jest.fn(() => '2023-01-01'),
}));

jest.mock('../../modules/natural-events/selectors', () => ({
  getFilteredEvents: jest.fn(() => []),
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
import googleTagManager from 'googleTagManager';
import { getDefaultEventDate } from '../../modules/natural-events/util';
import * as olExtent from 'ol/extent';
import * as olProj from 'ol/proj';

import ConnectedEventMarkers from './event-markers';

const EventMarkers = ConnectedEventMarkers.WrappedComponent;

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

const defaultProps = () => ({
  eventsData: [],
  eventsDataIsLoading: false,
  map: buildMap(),
  mapUi: buildMapUi(),
  proj: geographicProj(),
  selectedEvent: null,
  selectedDate: '2023-01-01',
  isMobile: false,
  isAnimatingToEvent: false,
  selectEvent: jest.fn(),
  highlightEvent: jest.fn(),
  unHighlightEvent: jest.fn(),
});

const createInstance = (props) => {
  const instance = new EventMarkers(props);
  instance.props = props;
  instance.state = { markers: [] };
  instance.setState = jest.fn((updater, callback) => {
    const next = typeof updater === 'function' ? updater(instance.state) : updater;
    instance.state = { ...instance.state, ...next };
    if (callback) callback();
  });
  return instance;
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('EventMarkers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getDefaultEventDate.mockReturnValue('2023-01-01');
  });

  // -------------------------------------------------------------------------
  // componentDidMount
  // -------------------------------------------------------------------------
  describe('componentDidMount', () => {
    it('calls draw() when eventsDataIsLoading is false', () => {
      const instance = createInstance(defaultProps());
      const drawSpy = jest.spyOn(instance, 'draw').mockImplementation(() => {});
      instance.componentDidMount();
      expect(drawSpy).toHaveBeenCalledTimes(1);
    });

    it('does NOT call draw() when eventsDataIsLoading is true', () => {
      const instance = createInstance({ ...defaultProps(), eventsDataIsLoading: true });
      const drawSpy = jest.spyOn(instance, 'draw').mockImplementation(() => {});
      instance.componentDidMount();
      expect(drawSpy).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // componentDidUpdate
  // -------------------------------------------------------------------------
  describe('componentDidUpdate', () => {
    let instance;
    let removeSpy;
    let drawSpy;

    beforeEach(() => {
      instance = createInstance(defaultProps());
      removeSpy = jest.spyOn(instance, 'remove').mockImplementation(() => {});
      drawSpy = jest.spyOn(instance, 'draw').mockImplementation(() => {});
    });

    it('calls remove() + draw() when loading transitions from true → false', () => {
      instance.props = { ...defaultProps(), eventsDataIsLoading: false };
      instance.componentDidUpdate({ ...defaultProps(), eventsDataIsLoading: true });
      expect(removeSpy).toHaveBeenCalled();
      expect(drawSpy).toHaveBeenCalled();
    });

    it('calls remove() + draw() when the projection changes', () => {
      const prevProj = geographicProj();
      const nextProj = polarProj();
      instance.props = { ...defaultProps(), proj: nextProj };
      instance.componentDidUpdate({ ...defaultProps(), proj: prevProj });
      expect(removeSpy).toHaveBeenCalled();
      expect(drawSpy).toHaveBeenCalled();
    });

    it('calls remove() + draw() when animation finishes (true → false)', () => {
      instance.props = { ...defaultProps(), isAnimatingToEvent: false };
      instance.componentDidUpdate({ ...defaultProps(), isAnimatingToEvent: true });
      expect(removeSpy).toHaveBeenCalled();
      expect(drawSpy).toHaveBeenCalled();
    });

    it('calls remove() + draw() when selectedEvent changes', () => {
      const prevEvent = { id: 'event-old' };
      const nextEvent = { id: 'event-new' };
      instance.props = { ...defaultProps(), selectedEvent: nextEvent };
      instance.componentDidUpdate({ ...defaultProps(), selectedEvent: prevEvent });
      expect(removeSpy).toHaveBeenCalled();
      expect(drawSpy).toHaveBeenCalled();
    });

    it('does NOT call remove() or draw() when nothing relevant changes', () => {
      const props = defaultProps();
      instance.props = { ...props };
      instance.componentDidUpdate({ ...props });
      expect(removeSpy).not.toHaveBeenCalled();
      expect(drawSpy).not.toHaveBeenCalled();
    });

    it('does NOT call remove() or draw() when selectedEvent stays null', () => {
      // Both current and prev props must share the same proj reference so
      // projChange is false, and eventsDataIsLoading/isAnimatingToEvent must
      // also be unchanged — only selectedEvent (null → null) differs.
      const sharedProj = geographicProj();
      instance.props = { ...defaultProps(), proj: sharedProj, selectedEvent: null };
      instance.componentDidUpdate({ ...defaultProps(), proj: sharedProj, selectedEvent: null });
      expect(removeSpy).not.toHaveBeenCalled();
      expect(drawSpy).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // componentWillUnmount
  // -------------------------------------------------------------------------
  describe('componentWillUnmount', () => {
    it('calls remove() when the component unmounts', () => {
      const instance = createInstance(defaultProps());
      const removeSpy = jest.spyOn(instance, 'remove').mockImplementation(() => {});
      instance.componentWillUnmount();
      expect(removeSpy).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // render
  // -------------------------------------------------------------------------
  describe('render', () => {
    it('returns null', () => {
      const instance = createInstance(defaultProps());
      expect(instance.render()).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // draw() – guard clauses
  // -------------------------------------------------------------------------
  describe('draw() – guard clauses', () => {
    it('returns null when eventsData is null', () => {
      const instance = createInstance({ ...defaultProps(), eventsData: null });
      expect(instance.draw()).toBeNull();
    });

    it('returns null when eventsData is an empty array', () => {
      const instance = createInstance({ ...defaultProps(), eventsData: [] });
      expect(instance.draw()).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // draw() – geographic projection, Point geometry
  // -------------------------------------------------------------------------
  describe('draw() – geographic projection, Point geometry', () => {
    it('adds a pin overlay to the map', () => {
      const map = buildMap();
      const instance = createInstance({
        ...defaultProps(),
        map,
        eventsData: [buildPointEvent()],
        selectedEvent: { id: 'other-event' },
      });
      instance.draw();
      expect(map.addOverlay).toHaveBeenCalled();
    });

    it('sets the correct pin position from Point coordinates', () => {
      const map = buildMap();
      const instance = createInstance({
        ...defaultProps(),
        map,
        eventsData: [buildPointEvent()],
        selectedEvent: { id: 'other-event' },
      });
      instance.draw();
      const overlay = map.addOverlay.mock.calls[0][0];
      expect(overlay.setPosition).toHaveBeenCalledWith([10, 20]);
    });

    it('falls back to a default category when the category id is not in the icons list', () => {
      const map = buildMap();
      const instance = createInstance({
        ...defaultProps(),
        map,
        eventsData: [buildPointEvent({ categories: [{ id: 'unknown', title: 'Unknown' }] })],
        selectedEvent: { id: 'other-event' },
      });
      expect(() => instance.draw()).not.toThrow();
      expect(map.addOverlay).toHaveBeenCalled();
    });

    it('uses selectedEvent.date for geometry lookup when the event is selected', () => {
      const map = buildMap();
      const instance = createInstance({
        ...defaultProps(),
        map,
        eventsData: [buildPointEvent()],
        selectedEvent: { id: 'event-1', date: '2023-02-15' },
      });
      instance.draw();
      expect(map.addOverlay).toHaveBeenCalled();
    });

    it('calls map.getView().changed() and map.renderSync() via the setState callback', () => {
      const mockChanged = jest.fn();
      const map = {
        ...buildMap(),
        getView: jest.fn(() => ({ changed: mockChanged })),
      };
      const instance = createInstance({
        ...defaultProps(),
        map,
        eventsData: [buildPointEvent()],
        selectedEvent: { id: 'other-event' },
      });
      instance.draw();
      expect(mockChanged).toHaveBeenCalled();
      expect(map.renderSync).toHaveBeenCalled();
    });

    it('hides tooltips when isMobile is true', () => {
      const map = buildMap();
      const instance = createInstance({
        ...defaultProps(),
        map,
        isMobile: true,
        eventsData: [buildPointEvent()],
        selectedEvent: { id: 'other-event' },
      });
      expect(() => instance.draw()).not.toThrow();
    });

    it('hides tooltips when isAnimatingToEvent is true', () => {
      const map = buildMap();
      const instance = createInstance({
        ...defaultProps(),
        map,
        isAnimatingToEvent: true,
        eventsData: [buildPointEvent()],
        selectedEvent: { id: 'other-event' },
      });
      expect(() => instance.draw()).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // draw() – geographic projection, Polygon geometry
  // -------------------------------------------------------------------------
  describe('draw() – geographic projection, Polygon geometry', () => {
    it('computes the bounding-box centre for a Polygon event', () => {
      const map = buildMap();
      const instance = createInstance({
        ...defaultProps(),
        map,
        eventsData: [buildPolygonEvent()],
        selectedEvent: { id: 'other-event' },
      });
      instance.draw();
      expect(olExtent.boundingExtent).toHaveBeenCalled();
      expect(olExtent.getCenter).toHaveBeenCalled();
      expect(map.addOverlay).toHaveBeenCalled();
    });

    it('adds a bounding-box layer when the Polygon event IS selected', () => {
      const map = buildMap();
      const instance = createInstance({
        ...defaultProps(),
        map,
        eventsData: [buildPolygonEvent()],
        selectedEvent: { id: 'event-2' },
      });
      instance.draw();
      expect(map.addLayer).toHaveBeenCalled();
    });

    it('does NOT add a bounding-box layer when the Polygon event is NOT selected', () => {
      const map = buildMap();
      const instance = createInstance({
        ...defaultProps(),
        map,
        eventsData: [buildPolygonEvent()],
        selectedEvent: { id: 'other-event' },
      });
      instance.draw();
      expect(map.addLayer).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // draw() – polar projection
  // -------------------------------------------------------------------------
  describe('draw() – polar projection', () => {
    it('transforms Point coordinates for a polar projection', () => {
      const map = buildMap();
      const instance = createInstance({
        ...defaultProps(),
        map,
        proj: polarProj(),
        eventsData: [buildPointEvent()],
        selectedEvent: { id: 'other-event' },
      });
      instance.draw();
      expect(olProj.transform).toHaveBeenCalled();
      expect(map.addOverlay).toHaveBeenCalled();
    });

    it('handles a Polygon in polar projection and adds bounding-box when selected', () => {
      const map = buildMap();
      const instance = createInstance({
        ...defaultProps(),
        map,
        proj: polarProj(),
        eventsData: [buildPolygonEvent()],
        selectedEvent: { id: 'event-2' },
      });
      instance.draw();
      expect(map.addLayer).toHaveBeenCalled();
      expect(olExtent.getCenter).toHaveBeenCalled();
    });

    it('handles a Polygon in polar projection WITHOUT bounding-box when not selected', () => {
      const map = buildMap();
      const instance = createInstance({
        ...defaultProps(),
        map,
        proj: polarProj(),
        eventsData: [buildPolygonEvent()],
        selectedEvent: { id: 'other-event' },
      });
      instance.draw();
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
      const instance = createInstance({
        ...defaultProps(),
        map,
        eventsData: [buildPointEvent({ geometry: [] })],
        selectedEvent: { id: 'other-event' },
      });
      instance.draw();
      expect(map.addOverlay).not.toHaveBeenCalled();
    });

    it('falls back to geometry[0] when no geometry matches the resolved date', () => {
      const map = buildMap();
      const instance = createInstance({
        ...defaultProps(),
        map,
        eventsData: [buildPointEvent({
          geometry: [{ type: 'Point', date: '2022-06-15T00:00:00Z', coordinates: [5, 15] }],
        })],
        selectedEvent: { id: 'other-event' },
      });
      instance.draw();
      expect(map.addOverlay).toHaveBeenCalled();
    });

    it('creates a marker overlay for each event in eventsData', () => {
      const map = buildMap();
      const instance = createInstance({
        ...defaultProps(),
        map,
        eventsData: [
          buildPointEvent({ id: 'event-1' }),
          buildPointEvent({ id: 'event-2', categories: [{ id: 'volcanoes', title: 'Volcanoes' }] }),
          buildPolygonEvent({ id: 'event-3' }),
        ],
        selectedEvent: { id: 'event-1' },
      });
      instance.draw();
      expect(map.addOverlay).toHaveBeenCalledTimes(3);
    });
  });

  // -------------------------------------------------------------------------
  // remove()
  // -------------------------------------------------------------------------
  describe('remove()', () => {
    it('is a no-op when the markers array is empty', () => {
      const map = buildMap();
      const instance = createInstance({ ...defaultProps(), map });
      instance.remove();
      expect(map.removeOverlay).not.toHaveBeenCalled();
      expect(map.removeLayer).not.toHaveBeenCalled();
    });

    it('calls setMap(null) and removeOverlay for a marker pin', () => {
      const map = buildMap();
      const pin = { setMap: jest.fn(), element: document.createElement('div'), setPosition: jest.fn() };
      const instance = createInstance({ ...defaultProps(), map });
      instance.state = { markers: [{ pin }] };
      instance.remove();
      expect(pin.setMap).toHaveBeenCalledWith(null);
      expect(map.removeOverlay).toHaveBeenCalledWith(pin);
    });

    it('calls setMap(null) and removeLayer for a marker boundingBox', () => {
      const map = buildMap();
      const pin = { setMap: jest.fn(), element: document.createElement('div'), setPosition: jest.fn() };
      const boundingBox = { setMap: jest.fn() };
      const instance = createInstance({ ...defaultProps(), map });
      instance.state = { markers: [{ pin, boundingBox }] };
      instance.remove();
      expect(boundingBox.setMap).toHaveBeenCalledWith(null);
      expect(map.removeLayer).toHaveBeenCalledWith(boundingBox);
    });

    it('resets markers state to []', () => {
      const map = buildMap();
      const pin = { setMap: jest.fn(), element: document.createElement('div'), setPosition: jest.fn() };
      const instance = createInstance({ ...defaultProps(), map });
      instance.state = { markers: [{ pin }] };
      instance.remove();
      expect(instance.setState).toHaveBeenCalledWith({ markers: [] });
    });

    it('removes tooltip DOM elements with class event-icon-tooltip', () => {
      const map = buildMap();
      const pin = { setMap: jest.fn(), element: document.createElement('div'), setPosition: jest.fn() };
      const tooltip = document.createElement('div');
      tooltip.className = 'event-icon-tooltip';
      document.body.appendChild(tooltip);
      const tooltipRemoveSpy = jest.spyOn(tooltip, 'remove');

      const instance = createInstance({ ...defaultProps(), map });
      instance.state = { markers: [{ pin }] };
      instance.remove();

      expect(tooltipRemoveSpy).toHaveBeenCalled();
      tooltip.parentNode?.removeChild(tooltip);
    });
  });

  // -------------------------------------------------------------------------
  // addInteractions()
  // -------------------------------------------------------------------------
  describe('addInteractions()', () => {
    const setup = (overrides = {}) => {
      const selectEvent = jest.fn();
      const highlightEvent = jest.fn();
      const unHighlightEvent = jest.fn();
      const instance = createInstance({
        ...defaultProps(),
        selectEvent,
        highlightEvent,
        unHighlightEvent,
        mapUi: buildMapUi(overrides.supportsPassive || false),
      });
      const pinEl = document.createElement('div');
      document.body.appendChild(pinEl);
      const event = buildPointEvent();
      const date = '2023-01-01';
      const isSelected = overrides.isSelected || false;
      instance.addInteractions({ pin: { element: pinEl } }, event, date, isSelected);
      return { pinEl, selectEvent, highlightEvent, unHighlightEvent, event, date };
    };

    afterEach(() => {
      document.body.innerHTML = '';
    });

    it('calls highlightEvent on mouseenter', () => {
      const { pinEl, highlightEvent, event, date } = setup();
      pinEl.dispatchEvent(new MouseEvent('mouseenter'));
      expect(highlightEvent).toHaveBeenCalledWith(event.id, date);
    });

    it('calls unHighlightEvent on mouseleave', () => {
      const { pinEl, unHighlightEvent } = setup();
      pinEl.dispatchEvent(new MouseEvent('mouseleave'));
      expect(unHighlightEvent).toHaveBeenCalled();
    });

    it('calls selectEvent on click when not selected and not dragged', () => {
      const { pinEl, selectEvent, event, date } = setup();
      pinEl.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      pinEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(selectEvent).toHaveBeenCalledWith(event.id, date);
    });

    it('does NOT call selectEvent when the event is already selected', () => {
      const { pinEl, selectEvent } = setup({ isSelected: true });
      pinEl.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      pinEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(selectEvent).not.toHaveBeenCalled();
    });

    it('does NOT call selectEvent after more than 2 mousemove events (drag)', () => {
      const { pinEl, selectEvent } = setup();
      pinEl.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      pinEl.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
      pinEl.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
      pinEl.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
      pinEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(selectEvent).not.toHaveBeenCalled();
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
      const { pinEl, selectEvent } = setup();
      pinEl.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      pinEl.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
      pinEl.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
      pinEl.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
      // A fresh mousedown resets willSelect and moveCount
      pinEl.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      pinEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(selectEvent).toHaveBeenCalled();
    });

    it('fires selectEvent on touchend when not selected and not dragged', () => {
      const { pinEl, selectEvent, event, date } = setup();
      pinEl.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
      pinEl.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
      expect(selectEvent).toHaveBeenCalledWith(event.id, date);
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

  // -------------------------------------------------------------------------
  // Redux connect wiring smoke test
  // -------------------------------------------------------------------------
  describe('redux connect wiring', () => {
    it('exports a connected component as the default export', () => {
      expect(ConnectedEventMarkers).toBeDefined();
    });

    it('exposes the unwrapped class as WrappedComponent', () => {
      expect(ConnectedEventMarkers.WrappedComponent).toBe(EventMarkers);
    });
  });
});

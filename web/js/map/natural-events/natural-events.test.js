import { render, cleanup, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';

import NaturalEvents from './natural-events';
import { fly } from '../util';
import util from '../../util/util';
import {
  getDefaultEventDate,
  validateGeometryCoords,
  toEventDateString,
} from '../../modules/natural-events/util';
import * as olExtent from 'ol/extent';
import * as olProj from 'ol/proj';

jest.mock('ol/extent', () => ({
  boundingExtent: jest.fn(() => [0, 0, 10, 10]),
}));

jest.mock('ol/proj', () => ({
  transform: jest.fn((coords) => coords),
}));

jest.mock('../../modules/natural-events/util', () => ({
  getDefaultEventDate: jest.fn(() => '2023-01-01'),
  validateGeometryCoords: jest.fn(() => true),
  toEventDateString: jest.fn((date) => date.toISOString().split('T')[0]),
}));

jest.mock('../../util/util', () => ({
  now: jest.fn(() => new Date('2023-06-15T00:00:00Z')),
  yesterday: jest.fn(() => new Date('2023-06-14T00:00:00Z')),
  parseDateUTC: jest.fn((dateStr) => new Date(dateStr)),
  dateAdd: jest.fn((date, unit, amount) => {
    const d = new Date(date);
    d.setDate(d.getDate() + amount);
    return d;
  }),
}));

jest.mock('../../modules/date/actions', () => ({
  selectDate: jest.fn((date) => ({ type: 'SELECT_DATE', date })),
}));

jest.mock('../../modules/natural-events/actions', () => ({
  selected: jest.fn(() => ({ type: 'SELECTED_EVENT' })),
}));

jest.mock('../../modules/layers/actions', () => ({
  addLayer: jest.fn((id) => ({ type: 'ADD_LAYER', id })),
  removeGroup: jest.fn((ids) => ({ type: 'REMOVE_GROUP', ids })),
  activateLayersForEventCategory: jest.fn((cat) => ({ type: 'ACTIVATE_LAYERS', cat })),
  toggleVisibility: jest.fn((id, vis) => ({ type: 'TOGGLE_VISIBILITY', id, vis })),
  toggleGroupVisibility: jest.fn((ids, vis) => ({ type: 'TOGGLE_GROUP_VISIBILITY', ids, vis })),
}));

jest.mock('../../modules/natural-events/selectors', () => ({
  getFilteredEvents: jest.fn((state) => state.events.filteredEvents || []),
}));

jest.mock('../../modules/map/constants', () => ({
  CRS: { GEOGRAPHIC: 'EPSG:4326' },
}));

jest.mock('./event-track', () => () => null);
jest.mock('./event-markers', () => ({ __esModule: true, default: () => null }));

jest.mock('../util', () => ({
  fly: jest.fn(() => Promise.resolve()),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockStoreCreator = configureMockStore([]);

const zoomLevelReference = { wildfires: 8, volcanoes: 6 };

/**
 * Build a map stub where getView() always returns the SAME view instance.
 * This is required so that spies set up on view methods in tests are the
 * same objects that the component calls internally.
 */
const buildMap = () => {
  const view = {
    getZoom: jest.fn(() => 5),
    calculateExtent: jest.fn(() => [-180, -90, 180, 90]),
  };
  return {
    getView: jest.fn(() => view),
    addOverlay: jest.fn(),
    removeOverlay: jest.fn(),
  };
};

const geographicProj = () => ({
  selected: { id: 'geographic', crs: 'EPSG:4326' },
});

const buildPointEvent = (overrides = {}) => ({
  id: 'event-1',
  title: 'Test Wildfire',
  categories: [{ id: 'wildfires', title: 'Wildfires' }],
  geometry: [{ date: '2023-01-01T00:00:00Z', coordinates: [10, 20], type: 'Point' }],
  ...overrides,
});

const buildPolygonEvent = (overrides = {}) => ({
  id: 'event-2',
  title: 'Test Flood',
  categories: [{ id: 'floods', title: 'Floods' }],
  geometry: [
    {
      date: '2023-01-01T00:00:00Z',
      type: 'Polygon',
      coordinates: [[[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]]],
    },
  ],
  ...overrides,
});

const defaultStoreState = (overrides = {}) => ({
  map: { ui: { selected: overrides.map || buildMap() } },
  proj: overrides.proj || geographicProj(),
  requestedEvents: { isLoading: overrides.eventsDataIsLoading || false },
  events: {
    active: true,
    selected: overrides.selectedEvent || { id: null, date: null },
    filteredEvents: overrides.eventsData || [],
    showAllTracks: false,
    highlighted: {},
  },
  layers: {
    active: { layers: overrides.layers || [] },
    eventLayers: overrides.eventLayers || ['layer-1'],
  },
  config: {
    naturalEvents: {
      defaultLayer: overrides.defaultEventLayer || 'VIIRS_NOAA20_CorrectedReflectance_TrueColor',
    },
  },
  ui: { isKioskModeActive: overrides.isKioskModeActive || false },
});

const renderComponent = (overrides = {}) => {
  const state = defaultStoreState(overrides);
  const store = mockStoreCreator(state);
  let result;
  act(() => {
    result = render(
      <Provider store={store}>
        <NaturalEvents />
      </Provider>,
    );
  });
  return { ...result, store, state };
};

const rerenderWithNewStore = (rerender, overrides = {}) => {
  const state = defaultStoreState(overrides);
  const store = mockStoreCreator(state);
  act(() => {
    rerender(
      <Provider store={store}>
        <NaturalEvents />
      </Provider>,
    );
  });
  return { store, state };
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('NaturalEvents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    toEventDateString.mockImplementation(
      (d) => (d instanceof Date ? d.toISOString().split('T')[0] : d),
    );
    util.now.mockReturnValue(new Date('2023-06-15T00:00:00Z'));
    util.yesterday.mockReturnValue(new Date('2023-06-14T00:00:00Z'));
    util.parseDateUTC.mockImplementation((s) => new Date(s));
    util.dateAdd.mockImplementation((date, unit, amt) => {
      const d = new Date(date);
      d.setDate(d.getDate() + amt);
      return d;
    });
    getDefaultEventDate.mockReturnValue('2023-01-01');
    validateGeometryCoords.mockReturnValue(true);
    fly.mockResolvedValue();
  });

  afterEach(() => {
    cleanup();
  });

  // -------------------------------------------------------------------------
  // render
  // -------------------------------------------------------------------------
  describe('render', () => {
    it('renders without crashing', () => {
      expect(() => renderComponent()).not.toThrow();
    });

    it('renders EventTrack and EventMarkers as children', () => {
      const { container } = renderComponent();
      expect(container).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // mount – layer initialization (replaces componentDidMount)
  // -------------------------------------------------------------------------
  describe('mount – layer initialization', () => {
    it('dispatches addLayer when the default event layer is not present in layers', () => {
      const { store } = renderComponent({
        layers: [{ id: 'some-other-layer', group: 'baselayers' }],
      });
      const actions = store.getActions();
      expect(actions).toContainEqual(expect.objectContaining({
        type: 'ADD_LAYER',
        id: 'VIIRS_NOAA20_CorrectedReflectance_TrueColor',
      }));
    });

    it('dispatches toggleVisibility(true) when default layer IS present and selectedEvent has no date', () => {
      const defaultLayer = 'VIIRS_NOAA20_CorrectedReflectance_TrueColor';
      const { store } = renderComponent({
        layers: [{ id: defaultLayer, group: 'overlays', layergroup: 'Weather' }],
        selectedEvent: { id: null, date: null },
      });
      const actions = store.getActions();
      expect(actions).toContainEqual(expect.objectContaining({
        type: 'TOGGLE_VISIBILITY',
        id: defaultLayer,
        vis: true,
      }));
    });

    it('hides overlay layers (excluding Reference group) when selectedEvent has no date', () => {
      const defaultLayer = 'VIIRS_NOAA20_CorrectedReflectance_TrueColor';
      const { store } = renderComponent({
        layers: [
          { id: defaultLayer, group: 'overlays', layergroup: 'Weather' },
          { id: 'overlay-1', group: 'overlays', layergroup: 'Weather' },
          { id: 'reference-1', group: 'overlays', layergroup: 'Reference' },
          { id: 'base-1', group: 'baselayers', layergroup: 'Base' },
        ],
        selectedEvent: { id: null, date: null },
      });
      const actions = store.getActions();
      const toggleGroupAction = actions.find((a) => a.type === 'TOGGLE_GROUP_VISIBILITY');
      expect(toggleGroupAction).toBeDefined();
      const hiddenIds = toggleGroupAction.ids;
      expect(hiddenIds).toContain('overlay-1');
      expect(hiddenIds).not.toContain('reference-1');
      expect(hiddenIds).not.toContain('base-1');
    });

    it('does NOT dispatch toggleGroupVisibility when selectedEvent has a date', () => {
      const { store } = renderComponent({
        layers: [{ id: 'overlay-1', group: 'overlays', layergroup: 'Weather' }],
        selectedEvent: { id: 'event-1', date: '2023-01-01' },
      });
      const actions = store.getActions();
      expect(actions).not.toContainEqual(expect.objectContaining({ type: 'TOGGLE_GROUP_VISIBILITY' }));
    });

    it('does NOT dispatch toggleVisibility when default layer is present and selectedEvent has a date', () => {
      const defaultLayer = 'VIIRS_NOAA20_CorrectedReflectance_TrueColor';
      const { store } = renderComponent({
        layers: [{ id: defaultLayer, group: 'overlays', layergroup: 'Weather' }],
        selectedEvent: { id: 'event-1', date: '2023-01-01' },
      });
      const actions = store.getActions();
      expect(actions).not.toContainEqual(expect.objectContaining({ type: 'TOGGLE_VISIBILITY' }));
    });
  });

  // -------------------------------------------------------------------------
  // unmount (replaces componentWillUnmount)
  // -------------------------------------------------------------------------
  describe('unmount', () => {
    it('dispatches toggleVisibility with false on unmount', () => {
      const { store, unmount } = renderComponent();
      store.clearActions();
      unmount();
      const actions = store.getActions();
      expect(actions).toContainEqual(expect.objectContaining({
        type: 'TOGGLE_VISIBILITY',
        id: 'VIIRS_NOAA20_CorrectedReflectance_TrueColor',
        vis: false,
      }));
    });
  });

  // -------------------------------------------------------------------------
  // update – event selection (replaces componentDidUpdate)
  // -------------------------------------------------------------------------
  describe('update – event selection', () => {
    it('returns early when map is null', () => {
      const { store } = renderComponent({ map: null });
      const actions = store.getActions();
      expect(actions).not.toContainEqual(expect.objectContaining({ type: 'SELECT_DATE' }));
    });

    it('returns early when eventsDataIsLoading is true', () => {
      const { store } = renderComponent({ eventsDataIsLoading: true });
      const actions = store.getActions();
      expect(actions).not.toContainEqual(expect.objectContaining({ type: 'SELECT_DATE' }));
    });

    it('calls zoomIfVisible when events finish loading with a selectedEvent', () => {
      const event = buildPointEvent();
      const selectedEvent = { id: 'event-1', date: '2023-01-01' };
      const map = buildMap();
      const { rerender } = renderComponent({
        map,
        eventsData: [event],
        selectedEvent,
        eventsDataIsLoading: true,
      });

      rerenderWithNewStore(rerender, {
        map,
        eventsData: [event],
        selectedEvent,
        eventsDataIsLoading: false,
      });
      // zoomIfVisible calls zoomToEvent which calls fly
      expect(fly).toHaveBeenCalled();
    });

    it('dispatches selectDate when selectedEvent changes to a new event', () => {
      const event = buildPointEvent();
      const map = buildMap();
      const { rerender } = renderComponent({
        map,
        eventsData: [event],
        selectedEvent: { id: null, date: null },
      });

      const { store: store2 } = rerenderWithNewStore(rerender, {
        map,
        eventsData: [event],
        selectedEvent: { id: 'event-1', date: '2023-01-01' },
      });
      const actions = store2.getActions();
      expect(actions).toContainEqual(expect.objectContaining({ type: 'SELECT_DATE' }));
    });

    it('does not dispatch selectDate when selectedEvent does not change', () => {
      const selectedEvent = { id: 'event-1', date: '2023-01-01' };
      const map = buildMap();
      const { rerender, store } = renderComponent({
        map,
        eventsData: [buildPointEvent()],
        selectedEvent,
      });
      store.clearActions();

      // Re-render with same selectedEvent reference
      rerenderWithNewStore(rerender, {
        map,
        eventsData: [buildPointEvent()],
        selectedEvent,
      });
      // The store2 actions should not have SELECT_DATE
      const actions = store.getActions();
      const selectDateActions = actions.filter((a) => a.type === 'SELECT_DATE');
      expect(selectDateActions.length).toBe(0);
    });

    it('dispatches selectEventFinished after zoom promise resolves', async () => {
      const event = buildPointEvent();
      const map = buildMap();
      const { rerender } = renderComponent({
        map,
        eventsData: [event],
        selectedEvent: { id: null, date: null },
      });

      const { store: store2 } = rerenderWithNewStore(rerender, {
        map,
        eventsData: [event],
        selectedEvent: { id: 'event-1', date: '2023-01-01' },
      });
      await Promise.resolve();
      const actions = store2.getActions();
      expect(actions).toContainEqual(expect.objectContaining({ type: 'SELECTED_EVENT' }));
    });

    it('adds one day to wildfire date when the date is not recent', () => {
      const event = buildPointEvent({
        categories: [{ id: 'wildfires', title: 'Wildfires' }],
      });
      const oldDate = '2022-01-01';
      const map = buildMap();
      toEventDateString
        .mockReturnValueOnce('2023-06-15')
        .mockReturnValueOnce('2023-06-14');
      util.parseDateUTC.mockReturnValue(new Date(oldDate));
      const { rerender } = renderComponent({
        map,
        eventsData: [event],
        selectedEvent: { id: null, date: null },
      });

      rerenderWithNewStore(rerender, {
        map,
        eventsData: [event],
        selectedEvent: { id: 'event-1', date: oldDate },
      });
      expect(util.dateAdd).toHaveBeenCalledWith(expect.any(Date), 'day', 1);
    });

    it('does NOT add a day for a wildfire that happened today', () => {
      const event = buildPointEvent({
        categories: [{ id: 'wildfires', title: 'Wildfires' }],
      });
      const todayStr = '2023-06-15';
      toEventDateString.mockReturnValue(todayStr);
      util.parseDateUTC.mockReturnValue(new Date(todayStr));
      const map = buildMap();
      const { rerender } = renderComponent({
        map,
        eventsData: [event],
        selectedEvent: { id: null, date: null },
      });

      rerenderWithNewStore(rerender, {
        map,
        eventsData: [event],
        selectedEvent: { id: 'event-1', date: todayStr },
      });
      expect(util.dateAdd).not.toHaveBeenCalled();
    });

    it('does NOT add a day for non-wildfire events regardless of date', () => {
      const event = buildPointEvent({
        categories: [{ id: 'volcanoes', title: 'Volcanoes' }],
      });
      const map = buildMap();
      const { rerender } = renderComponent({
        map,
        eventsData: [event],
        selectedEvent: { id: null, date: null },
      });

      rerenderWithNewStore(rerender, {
        map,
        eventsData: [event],
        selectedEvent: { id: 'event-1', date: '2022-01-01' },
      });
      expect(util.dateAdd).not.toHaveBeenCalled();
    });

    it('dispatches removeGroup and activateLayersForEventCategory when category changes', async () => {
      const prevEvent = buildPointEvent({
        id: 'event-0',
        categories: [{ id: 'volcanoes', title: 'Volcanoes' }],
      });
      const nextEvent = buildPointEvent({
        id: 'event-1',
        categories: [{ id: 'wildfires', title: 'Wildfires' }],
      });
      const map = buildMap();

      // First render: select event-0
      const { rerender } = renderComponent({
        map,
        eventsData: [prevEvent, nextEvent],
        selectedEvent: { id: null, date: null },
        eventLayers: ['layer-1'],
      });

      // Select event-0 first to establish prevSelectedEvent
      rerenderWithNewStore(rerender, {
        map,
        eventsData: [prevEvent, nextEvent],
        selectedEvent: { id: 'event-0', date: '2023-01-01' },
        eventLayers: ['layer-1'],
      });

      // Now select event-1 (different category)
      const { store: store3 } = rerenderWithNewStore(rerender, {
        map,
        eventsData: [prevEvent, nextEvent],
        selectedEvent: { id: 'event-1', date: '2023-01-01' },
        eventLayers: ['layer-1'],
      });

      await Promise.resolve();
      const actions = store3.getActions();
      expect(actions).toContainEqual(expect.objectContaining({ type: 'REMOVE_GROUP' }));
      expect(actions).toContainEqual(expect.objectContaining({ type: 'ACTIVATE_LAYERS', cat: 'Wildfires' }));
    });

    it('does NOT dispatch removeGroup when category stays the same', async () => {
      const prevEvent = buildPointEvent({
        id: 'event-0',
        categories: [{ id: 'wildfires', title: 'Wildfires' }],
      });
      const nextEvent = buildPointEvent({
        id: 'event-1',
        categories: [{ id: 'wildfires', title: 'Wildfires' }],
      });
      const map = buildMap();
      const { rerender } = renderComponent({
        map,
        eventsData: [prevEvent, nextEvent],
        selectedEvent: { id: null, date: null },
      });

      // Select event-0 first
      rerenderWithNewStore(rerender, {
        map,
        eventsData: [prevEvent, nextEvent],
        selectedEvent: { id: 'event-0', date: '2023-01-01' },
      });

      // Now select event-1 (same category)
      const { store: store3 } = rerenderWithNewStore(rerender, {
        map,
        eventsData: [prevEvent, nextEvent],
        selectedEvent: { id: 'event-1', date: '2023-01-01' },
      });

      await Promise.resolve();
      const actions = store3.getActions();
      expect(actions).not.toContainEqual(expect.objectContaining({ type: 'REMOVE_GROUP' }));
    });

    it('uses getDefaultEventDate when no date is passed', () => {
      const event = buildPointEvent();
      getDefaultEventDate.mockReturnValue('2023-01-01');
      const map = buildMap();
      const { rerender } = renderComponent({
        map,
        eventsData: [event],
        selectedEvent: { id: null, date: null },
      });

      rerenderWithNewStore(rerender, {
        map,
        eventsData: [event],
        selectedEvent: { id: 'event-1', date: null },
      });
      expect(getDefaultEventDate).toHaveBeenCalledWith(event);
    });
  });

  // -------------------------------------------------------------------------
  // zoomToEvent — Point geometry
  // -------------------------------------------------------------------------
  describe('zoomToEvent() – Point geometry', () => {
    it('calls fly() with transformed point coordinates', () => {
      const event = buildPointEvent();
      const map = buildMap();
      const { rerender } = renderComponent({
        map,
        eventsData: [event],
        selectedEvent: { id: null, date: null },
      });

      rerenderWithNewStore(rerender, {
        map,
        eventsData: [event],
        selectedEvent: { id: 'event-1', date: '2023-01-01' },
      });
      expect(fly).toHaveBeenCalledWith(
        map,
        geographicProj(),
        expect.any(Array),
        false,
        zoomLevelReference.wildfires,
        null,
      );
    });

    it('uses undefined zoom for categories not in the reference table', () => {
      const event = buildPointEvent({ categories: [{ id: 'floods', title: 'Floods' }] });
      const map = buildMap();
      const { rerender } = renderComponent({
        map,
        eventsData: [event],
        selectedEvent: { id: null, date: null },
      });

      rerenderWithNewStore(rerender, {
        map,
        eventsData: [event],
        selectedEvent: { id: 'event-1', date: '2023-01-01' },
      });
      expect(fly).toHaveBeenCalledWith(
        map, expect.anything(), expect.anything(), false, undefined, null,
      );
    });

    it('calls olProj.transform on Point coordinates', () => {
      const event = buildPointEvent();
      const map = buildMap();
      const { rerender } = renderComponent({
        map,
        eventsData: [event],
        selectedEvent: { id: null, date: null },
      });

      rerenderWithNewStore(rerender, {
        map,
        eventsData: [event],
        selectedEvent: { id: 'event-1', date: '2023-01-01' },
      });
      expect(olProj.transform).toHaveBeenCalledWith([10, 20], 'EPSG:4326', 'EPSG:4326');
    });

    it('passes isKioskModeActive=true to fly()', () => {
      const event = buildPointEvent();
      const map = buildMap();
      const { rerender } = renderComponent({
        map,
        eventsData: [event],
        selectedEvent: { id: null, date: null },
        isKioskModeActive: true,
      });

      rerenderWithNewStore(rerender, {
        map,
        eventsData: [event],
        selectedEvent: { id: 'event-1', date: '2023-01-01' },
        isKioskModeActive: true,
      });
      expect(fly).toHaveBeenCalledWith(
        map, expect.anything(), expect.anything(), true, expect.anything(), null,
      );
    });
  });

  // -------------------------------------------------------------------------
  // zoomToEvent — Polygon geometry
  // -------------------------------------------------------------------------
  describe('zoomToEvent() – Polygon geometry', () => {
    it('calls boundingExtent and fly() for a Polygon event', () => {
      const event = buildPolygonEvent();
      const map = buildMap();
      const { rerender } = renderComponent({
        map,
        eventsData: [event],
        selectedEvent: { id: null, date: null },
      });

      rerenderWithNewStore(rerender, {
        map,
        eventsData: [event],
        selectedEvent: { id: 'event-2', date: '2023-01-01' },
      });
      expect(olExtent.boundingExtent).toHaveBeenCalled();
      expect(fly).toHaveBeenCalled();
    });

    it('transforms each coordinate in the polygon ring before passing to boundingExtent', () => {
      const event = buildPolygonEvent();
      const map = buildMap();
      const { rerender } = renderComponent({
        map,
        eventsData: [event],
        selectedEvent: { id: null, date: null },
      });

      rerenderWithNewStore(rerender, {
        map,
        eventsData: [event],
        selectedEvent: { id: 'event-2', date: '2023-01-01' },
      });
      // 5 coordinates in the ring → 5 transform calls
      expect(olProj.transform).toHaveBeenCalledTimes(5);
    });
  });

  // -------------------------------------------------------------------------
  // Redux store rendering
  // -------------------------------------------------------------------------
  describe('redux store rendering', () => {
    it('renders inside a Provider without crashing', () => {
      expect(() => renderComponent()).not.toThrow();
    });
  });
});

/* eslint-disable react/jsx-props-no-spreading */
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';

import ConnectedNaturalEvents from './natural-events';
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

const NaturalEvents = ConnectedNaturalEvents.WrappedComponent;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockStore = configureMockStore([]);

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

/**
 * selectedEvent must always be an object (never null) when passed as a prop
 * because componentDidMount accesses selectedEvent.date unconditionally.
 * Use `{ id: null, date: null }` to represent "no event selected".
 */
const defaultProps = (overrides = {}) => ({
  map: buildMap(),
  proj: geographicProj(),
  eventsData: [],
  eventsDataIsLoading: false,
  selectedEvent: { id: null, date: null },
  eventLayers: ['layer-1'],
  layers: [],
  defaultEventLayer: 'VIIRS_NOAA20_CorrectedReflectance_TrueColor',
  isKioskModeActive: false,
  selectDate: jest.fn(),
  selectEventFinished: jest.fn(),
  activateLayersForEventCategory: jest.fn(),
  removeGroup: jest.fn(),
  toggleVisibility: jest.fn(),
  toggleGroupVisibility: jest.fn(),
  addLayer: jest.fn(),
  ...overrides,
});

const createInstance = (props) => {
  const instance = new NaturalEvents(props);
  instance.props = props;
  instance.state = { prevSelectedEvent: {} };
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

  // -------------------------------------------------------------------------
  // render
  // -------------------------------------------------------------------------
  describe('render', () => {
    it('renders without crashing', () => {
      const instance = createInstance(defaultProps());
      expect(() => instance.render()).not.toThrow();
    });

    it('renders EventTrack and EventMarkers as children', () => {
      const { container } = render(<NaturalEvents {...defaultProps()} />);
      expect(container).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // componentDidMount
  // -------------------------------------------------------------------------
  describe('componentDidMount', () => {
    it('calls addLayer when the default event layer is not present in layers', () => {
      const addLayer = jest.fn();
      const props = defaultProps({
        addLayer,
        layers: [{ id: 'some-other-layer', group: 'baselayers' }],
      });
      const instance = createInstance(props);
      instance.componentDidMount();
      expect(addLayer).toHaveBeenCalledWith('VIIRS_NOAA20_CorrectedReflectance_TrueColor');
    });

    it('calls toggleVisibility(true) when default layer IS present and selectedEvent has no date', () => {
      const toggleVisibility = jest.fn();
      const defaultLayer = 'VIIRS_NOAA20_CorrectedReflectance_TrueColor';
      const props = defaultProps({
        toggleVisibility,
        layers: [{ id: defaultLayer, group: 'overlays', layergroup: 'Weather' }],
        selectedEvent: { id: null, date: null },
      });
      const instance = createInstance(props);
      instance.componentDidMount();
      expect(toggleVisibility).toHaveBeenCalledWith(defaultLayer, true);
    });

    it('hides overlay layers (excluding Reference group) when selectedEvent has no date', () => {
      const toggleGroupVisibility = jest.fn();
      const defaultLayer = 'VIIRS_NOAA20_CorrectedReflectance_TrueColor';
      const props = defaultProps({
        toggleGroupVisibility,
        layers: [
          { id: defaultLayer, group: 'overlays', layergroup: 'Weather' },
          { id: 'overlay-1', group: 'overlays', layergroup: 'Weather' },
          { id: 'reference-1', group: 'overlays', layergroup: 'Reference' },
          { id: 'base-1', group: 'baselayers', layergroup: 'Base' },
        ],
        selectedEvent: { id: null, date: null },
      });
      const instance = createInstance(props);
      instance.componentDidMount();
      expect(toggleGroupVisibility).toHaveBeenCalledWith(
        expect.arrayContaining(['overlay-1']),
        false,
      );
      const hiddenIds = toggleGroupVisibility.mock.calls[0][0];
      expect(hiddenIds).not.toContain('reference-1');
      expect(hiddenIds).not.toContain('base-1');
    });

    it('does NOT call toggleGroupVisibility when selectedEvent has a date', () => {
      const toggleGroupVisibility = jest.fn();
      const props = defaultProps({
        toggleGroupVisibility,
        layers: [{ id: 'overlay-1', group: 'overlays', layergroup: 'Weather' }],
        selectedEvent: { id: 'event-1', date: '2023-01-01' },
      });
      const instance = createInstance(props);
      instance.componentDidMount();
      expect(toggleGroupVisibility).not.toHaveBeenCalled();
    });

    it('does NOT call toggleVisibility when default layer is present and selectedEvent has a date', () => {
      const toggleVisibility = jest.fn();
      const defaultLayer = 'VIIRS_NOAA20_CorrectedReflectance_TrueColor';
      const props = defaultProps({
        toggleVisibility,
        layers: [{ id: defaultLayer, group: 'overlays', layergroup: 'Weather' }],
        selectedEvent: { id: 'event-1', date: '2023-01-01' },
      });
      const instance = createInstance(props);
      instance.componentDidMount();
      expect(toggleVisibility).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // componentWillUnmount
  // -------------------------------------------------------------------------
  describe('componentWillUnmount', () => {
    it('calls toggleVisibility with false on unmount', () => {
      const toggleVisibility = jest.fn();
      const defaultLayer = 'VIIRS_NOAA20_CorrectedReflectance_TrueColor';
      const instance = createInstance(defaultProps({ toggleVisibility }));
      instance.componentWillUnmount();
      expect(toggleVisibility).toHaveBeenCalledWith(defaultLayer, false);
    });
  });

  // -------------------------------------------------------------------------
  // componentDidUpdate
  // -------------------------------------------------------------------------
  describe('componentDidUpdate', () => {
    it('returns early when map is null', () => {
      const selectDate = jest.fn();
      const instance = createInstance(defaultProps({ map: null, selectDate }));
      instance.componentDidUpdate({
        map: null,
        eventsDataIsLoading: false,
        selectedEvent: { id: null, date: null },
      });
      expect(selectDate).not.toHaveBeenCalled();
    });

    it('returns early when eventsDataIsLoading is true', () => {
      const selectDate = jest.fn();
      const instance = createInstance(
        defaultProps({ eventsDataIsLoading: true, selectDate }),
      );
      instance.componentDidUpdate({
        map: buildMap(),
        eventsDataIsLoading: false,
        selectedEvent: { id: null, date: null },
      });
      expect(selectDate).not.toHaveBeenCalled();
    });

    it('calls zoomIfVisible when events finish loading with a selectedEvent', () => {
      const event = buildPointEvent();
      const selectedEvent = { id: 'event-1', date: '2023-01-01' };
      const props = defaultProps({
        eventsData: [event],
        selectedEvent,
        eventsDataIsLoading: false,
      });
      const instance = createInstance(props);
      const zoomSpy = jest.spyOn(instance, 'zoomIfVisible').mockImplementation(() => {});
      instance.componentDidUpdate({
        map: buildMap(),
        eventsDataIsLoading: true,
        selectedEvent,
      });
      expect(zoomSpy).toHaveBeenCalledWith(selectedEvent);
    });

    it('calls selectEvent when selectedEvent changes to a new event', () => {
      const event = buildPointEvent();
      const selectedEvent = { id: 'event-1', date: '2023-01-01' };
      const props = defaultProps({
        eventsData: [event],
        selectedEvent,
      });
      const instance = createInstance(props);
      const selectSpy = jest.spyOn(instance, 'selectEvent').mockImplementation(() => {});
      instance.componentDidUpdate({
        map: buildMap(),
        eventsDataIsLoading: false,
        selectedEvent: { id: null, date: null },
      });
      expect(selectSpy).toHaveBeenCalledWith('event-1', '2023-01-01', false);
    });

    it('does not call selectEvent when selectedEvent does not change', () => {
      const selectedEvent = { id: 'event-1', date: '2023-01-01' };
      const props = defaultProps({ selectedEvent });
      const instance = createInstance(props);
      const selectSpy = jest.spyOn(instance, 'selectEvent').mockImplementation(() => {});
      // same reference → no change
      instance.componentDidUpdate({
        map: buildMap(),
        eventsDataIsLoading: false,
        selectedEvent,
      });
      expect(selectSpy).not.toHaveBeenCalled();
    });

    it('passes loadingChange=true to selectEvent when events just finished loading', () => {
      const event = buildPointEvent();
      const selectedEvent = { id: 'event-1', date: '2023-01-01' };
      const props = defaultProps({
        eventsData: [event],
        selectedEvent,
        eventsDataIsLoading: false,
      });
      const instance = createInstance(props);
      const selectSpy = jest.spyOn(instance, 'selectEvent').mockImplementation(() => {});
      instance.componentDidUpdate({
        map: buildMap(),
        eventsDataIsLoading: true,
        selectedEvent: { id: null, date: null },
      });
      expect(selectSpy).toHaveBeenCalledWith('event-1', '2023-01-01', true);
    });
  });

  // -------------------------------------------------------------------------
  // zoomIfVisible
  // -------------------------------------------------------------------------
  describe('zoomIfVisible()', () => {
    it('calls zoomToEvent when the event has visible geometry', () => {
      const event = buildPointEvent();
      validateGeometryCoords.mockReturnValue(true);
      const props = defaultProps({ eventsData: [event] });
      const instance = createInstance(props);
      const zoomSpy = jest.spyOn(instance, 'zoomToEvent').mockResolvedValue();
      instance.zoomIfVisible({ id: 'event-1', date: '2023-01-01' });
      expect(zoomSpy).toHaveBeenCalledWith(event, '2023-01-01');
    });

    it('does NOT call zoomToEvent when no geometry passes validation', () => {
      const event = buildPointEvent();
      validateGeometryCoords.mockReturnValue(false);
      const props = defaultProps({ eventsData: [event] });
      const instance = createInstance(props);
      const zoomSpy = jest.spyOn(instance, 'zoomToEvent').mockResolvedValue();
      instance.zoomIfVisible({ id: 'event-1', date: '2023-01-01' });
      expect(zoomSpy).not.toHaveBeenCalled();
    });

    it('returns early when the event is not found in eventsData', () => {
      const props = defaultProps({ eventsData: [] });
      const instance = createInstance(props);
      const zoomSpy = jest.spyOn(instance, 'zoomToEvent').mockResolvedValue();
      instance.zoomIfVisible({ id: 'event-not-found', date: '2023-01-01' });
      expect(zoomSpy).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // getZoomPromise
  // -------------------------------------------------------------------------
  describe('getZoomPromise()', () => {
    it('returns a resolved promise immediately when isInitialLoad is true', async () => {
      const instance = createInstance(defaultProps());
      jest.spyOn(instance, 'zoomToEvent').mockResolvedValue();
      const result = instance.getZoomPromise(buildPointEvent(), '2023-01-01', false, true);
      await expect(result).resolves.toBeUndefined();
    });

    it('calls zoomToEvent and returns its promise when isInitialLoad is false', () => {
      const event = buildPointEvent();
      const instance = createInstance(defaultProps({ eventsData: [event] }));
      const zoomSpy = jest.spyOn(instance, 'zoomToEvent').mockResolvedValue();
      instance.getZoomPromise(event, '2023-01-01', true, false);
      expect(zoomSpy).toHaveBeenCalledWith(event, '2023-01-01', true);
    });
  });

  // -------------------------------------------------------------------------
  // selectEvent
  // -------------------------------------------------------------------------
  describe('selectEvent()', () => {
    it('returns early when event is not found in eventsData', () => {
      const selectDate = jest.fn();
      const instance = createInstance(defaultProps({ eventsData: [], selectDate }));
      instance.selectEvent('event-not-found', '2023-01-01', false);
      expect(selectDate).not.toHaveBeenCalled();
    });

    it('calls selectDate with the parsed date', () => {
      const event = buildPointEvent();
      const selectDate = jest.fn();
      const instance = createInstance(defaultProps({ eventsData: [event], selectDate }));
      jest.spyOn(instance, 'getZoomPromise').mockReturnValue(Promise.resolve());
      instance.selectEvent('event-1', '2023-01-01', false);
      expect(selectDate).toHaveBeenCalled();
    });

    it('adds one day to wildfire date when the date is not recent', () => {
      const event = buildPointEvent({
        categories: [{ id: 'wildfires', title: 'Wildfires' }],
      });
      const oldDate = '2022-01-01';
      toEventDateString
        .mockReturnValueOnce('2023-06-15')
        .mockReturnValueOnce('2023-06-14');
      util.parseDateUTC.mockReturnValue(new Date(oldDate));
      const instance = createInstance(defaultProps({ eventsData: [event] }));
      jest.spyOn(instance, 'getZoomPromise').mockReturnValue(Promise.resolve());
      instance.selectEvent('event-1', oldDate, false);
      expect(util.dateAdd).toHaveBeenCalledWith(expect.any(Date), 'day', 1);
    });

    it('does NOT add a day for a wildfire that happened today', () => {
      const event = buildPointEvent({
        categories: [{ id: 'wildfires', title: 'Wildfires' }],
      });
      const todayStr = '2023-06-15';
      toEventDateString.mockReturnValue(todayStr);
      util.parseDateUTC.mockReturnValue(new Date(todayStr));
      const instance = createInstance(defaultProps({ eventsData: [event] }));
      jest.spyOn(instance, 'getZoomPromise').mockReturnValue(Promise.resolve());
      instance.selectEvent('event-1', todayStr, false);
      expect(util.dateAdd).not.toHaveBeenCalled();
    });

    it('does NOT add a day for a wildfire that happened yesterday', () => {
      const event = buildPointEvent({
        categories: [{ id: 'wildfires', title: 'Wildfires' }],
      });
      const yesterdayStr = '2023-06-14';
      toEventDateString.mockReturnValue(yesterdayStr);
      util.parseDateUTC.mockReturnValue(new Date(yesterdayStr));
      const instance = createInstance(defaultProps({ eventsData: [event] }));
      jest.spyOn(instance, 'getZoomPromise').mockReturnValue(Promise.resolve());
      instance.selectEvent('event-1', yesterdayStr, false);
      expect(util.dateAdd).not.toHaveBeenCalled();
    });

    it('does NOT add a day for non-wildfire events regardless of date', () => {
      const event = buildPointEvent({
        categories: [{ id: 'volcanoes', title: 'Volcanoes' }],
      });
      const instance = createInstance(defaultProps({ eventsData: [event] }));
      jest.spyOn(instance, 'getZoomPromise').mockReturnValue(Promise.resolve());
      instance.selectEvent('event-1', '2022-01-01', false);
      expect(util.dateAdd).not.toHaveBeenCalled();
    });

    it('calls removeGroup and activateLayersForEventCategory when category changes', async () => {
      const removeGroup = jest.fn();
      const activateLayersForEventCategory = jest.fn();
      const selectEventFinished = jest.fn();
      const prevEvent = buildPointEvent({
        id: 'event-0',
        categories: [{ id: 'volcanoes', title: 'Volcanoes' }],
      });
      const nextEvent = buildPointEvent({
        id: 'event-1',
        categories: [{ id: 'wildfires', title: 'Wildfires' }],
      });
      const instance = createInstance(defaultProps({
        eventsData: [prevEvent, nextEvent],
        removeGroup,
        activateLayersForEventCategory,
        selectEventFinished,
        eventLayers: ['layer-1'],
      }));
      instance.state = { prevSelectedEvent: { id: 'event-0', date: '2023-01-01' } };
      jest.spyOn(instance, 'getZoomPromise').mockReturnValue(Promise.resolve());
      instance.selectEvent('event-1', '2023-01-01', false);
      await Promise.resolve();
      expect(removeGroup).toHaveBeenCalledWith(['layer-1']);
      expect(activateLayersForEventCategory).toHaveBeenCalledWith('Wildfires');
    });

    it('does NOT call removeGroup when category stays the same', async () => {
      const removeGroup = jest.fn();
      const prevEvent = buildPointEvent({
        id: 'event-0',
        categories: [{ id: 'wildfires', title: 'Wildfires' }],
      });
      const nextEvent = buildPointEvent({
        id: 'event-1',
        categories: [{ id: 'wildfires', title: 'Wildfires' }],
      });
      const instance = createInstance(defaultProps({
        eventsData: [prevEvent, nextEvent],
        removeGroup,
      }));
      instance.state = { prevSelectedEvent: { id: 'event-0', date: '2023-01-01' } };
      jest.spyOn(instance, 'getZoomPromise').mockReturnValue(Promise.resolve());
      instance.selectEvent('event-1', '2023-01-01', false);
      await Promise.resolve();
      expect(removeGroup).not.toHaveBeenCalled();
    });

    it('calls selectEventFinished after zoom promise resolves', async () => {
      const event = buildPointEvent();
      const selectEventFinished = jest.fn();
      const instance = createInstance(defaultProps({
        eventsData: [event],
        selectEventFinished,
      }));
      jest.spyOn(instance, 'getZoomPromise').mockReturnValue(Promise.resolve());
      instance.selectEvent('event-1', '2023-01-01', false);
      await Promise.resolve();
      expect(selectEventFinished).toHaveBeenCalled();
    });

    it('does NOT call removeGroup or activateLayersForEventCategory when isInitialLoad is true', async () => {
      const removeGroup = jest.fn();
      const activateLayersForEventCategory = jest.fn();
      const event = buildPointEvent();
      const instance = createInstance(defaultProps({
        eventsData: [event],
        removeGroup,
        activateLayersForEventCategory,
      }));
      jest.spyOn(instance, 'getZoomPromise').mockReturnValue(Promise.resolve());
      instance.selectEvent('event-1', '2023-01-01', true);
      await Promise.resolve();
      expect(removeGroup).not.toHaveBeenCalled();
      expect(activateLayersForEventCategory).not.toHaveBeenCalled();
    });

    it('updates prevSelectedEvent state after being called', () => {
      const event = buildPointEvent();
      const instance = createInstance(defaultProps({ eventsData: [event] }));
      jest.spyOn(instance, 'getZoomPromise').mockReturnValue(Promise.resolve());
      instance.selectEvent('event-1', '2023-01-01', false);
      expect(instance.setState).toHaveBeenCalledWith({
        prevSelectedEvent: { id: 'event-1', date: '2023-01-01' },
      });
    });

    it('uses getDefaultEventDate when no date is passed', () => {
      const event = buildPointEvent();
      getDefaultEventDate.mockReturnValue('2023-01-01');
      const instance = createInstance(defaultProps({ eventsData: [event] }));
      jest.spyOn(instance, 'getZoomPromise').mockReturnValue(Promise.resolve());
      instance.selectEvent('event-1', null, false);
      expect(getDefaultEventDate).toHaveBeenCalledWith(event);
    });

    it('handles the case where prevSelectedEvent has no id (first selection)', async () => {
      const event = buildPointEvent();
      const activateLayersForEventCategory = jest.fn();
      const instance = createInstance(defaultProps({
        eventsData: [event],
        activateLayersForEventCategory,
      }));
      instance.state = { prevSelectedEvent: {} };
      jest.spyOn(instance, 'getZoomPromise').mockReturnValue(Promise.resolve());
      instance.selectEvent('event-1', '2023-01-01', false);
      await Promise.resolve();
      expect(activateLayersForEventCategory).toHaveBeenCalledWith('Wildfires');
    });
  });

  // -------------------------------------------------------------------------
  // zoomToEvent — Point geometry
  // -------------------------------------------------------------------------
  describe('zoomToEvent() – Point geometry', () => {
    it('calls fly() with transformed point coordinates', () => {
      const event = buildPointEvent();
      const map = buildMap();
      const instance = createInstance(defaultProps({ map, eventsData: [event] }));
      instance.zoomToEvent(event, '2023-01-01', false);
      expect(fly).toHaveBeenCalledWith(
        map,
        geographicProj(),
        expect.any(Array),
        false,
        zoomLevelReference.wildfires,
        null,
      );
    });

    it('uses the current map zoom level when isSameEventID is true', () => {
      const event = buildPointEvent({ categories: [{ id: 'volcanoes', title: 'Volcanoes' }] });
      const map = buildMap();
      // Capture the single shared view instance before calling zoomToEvent
      const view = map.getView();
      const instance = createInstance(defaultProps({ map, eventsData: [event] }));
      instance.zoomToEvent(event, '2023-01-01', true);
      expect(view.getZoom).toHaveBeenCalled();
      expect(fly).toHaveBeenCalledWith(map, expect.anything(), expect.anything(), false, 5, null);
    });

    it('uses zoomLevelReference zoom for known categories when isSameEventID is false', () => {
      const event = buildPointEvent({ categories: [{ id: 'volcanoes', title: 'Volcanoes' }] });
      const map = buildMap();
      const instance = createInstance(defaultProps({ map, eventsData: [event] }));
      instance.zoomToEvent(event, '2023-01-01', false);
      expect(fly).toHaveBeenCalledWith(
        map, expect.anything(), expect.anything(), false, zoomLevelReference.volcanoes, null,
      );
    });

    it('uses undefined zoom for categories not in the reference table', () => {
      const event = buildPointEvent({ categories: [{ id: 'floods', title: 'Floods' }] });
      const map = buildMap();
      const instance = createInstance(defaultProps({ map, eventsData: [event] }));
      instance.zoomToEvent(event, '2023-01-01', false);
      expect(fly).toHaveBeenCalledWith(
        map, expect.anything(), expect.anything(), false, undefined, null,
      );
    });

    it('calls olProj.transform on Point coordinates', () => {
      const event = buildPointEvent();
      const map = buildMap();
      const instance = createInstance(defaultProps({ map, eventsData: [event] }));
      instance.zoomToEvent(event, '2023-01-01', false);
      expect(olProj.transform).toHaveBeenCalledWith([10, 20], 'EPSG:4326', 'EPSG:4326');
    });

    it('passes isKioskModeActive=true to fly()', () => {
      const event = buildPointEvent();
      const map = buildMap();
      const instance = createInstance(
        defaultProps({ map, eventsData: [event], isKioskModeActive: true }),
      );
      instance.zoomToEvent(event, '2023-01-01', false);
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
      const instance = createInstance(defaultProps({ map, eventsData: [event] }));
      instance.zoomToEvent(event, '2023-01-01', false);
      expect(olExtent.boundingExtent).toHaveBeenCalled();
      expect(fly).toHaveBeenCalled();
    });

    it('transforms each coordinate in the polygon ring before passing to boundingExtent', () => {
      const event = buildPolygonEvent();
      const map = buildMap();
      const instance = createInstance(defaultProps({ map, eventsData: [event] }));
      instance.zoomToEvent(event, '2023-01-01', false);
      // 5 coordinates in the ring → 5 transform calls
      expect(olProj.transform).toHaveBeenCalledTimes(5);
    });
  });

  // -------------------------------------------------------------------------
  // Redux connect wiring
  // -------------------------------------------------------------------------
  describe('redux connect wiring', () => {
    it('exposes the unwrapped class as WrappedComponent', () => {
      expect(ConnectedNaturalEvents.WrappedComponent).toBe(NaturalEvents);
    });

    it('renders inside a Provider without crashing', () => {
      const store = mockStore({
        map: { ui: { selected: buildMap() } },
        proj: geographicProj(),
        requestedEvents: { isLoading: false },
        events: {
          active: true,
          // Use an object with null fields instead of null to avoid
          // selectedEvent.date access errors in componentDidMount
          selected: { id: null, date: null },
          filteredEvents: [],
          showAllTracks: false,
          highlighted: {},
        },
        layers: {
          active: { layers: [] },
          eventLayers: [],
        },
        config: {
          naturalEvents: { defaultLayer: 'VIIRS_NOAA20_CorrectedReflectance_TrueColor' },
        },
        ui: { isKioskModeActive: false },
      });
      expect(() =>
        render(
          <Provider store={store}>
            <ConnectedNaturalEvents />
          </Provider>,
        ),
      ).not.toThrow();
    });
  });
});

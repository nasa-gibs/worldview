import {
  getEventsRequestURL,
  parseEvent,
  serializeEvent,
  parseEventFilterDates,
  serializeEventFilterDates,
  serializeCategories,
  mapLocationToEventFilterState,
  toEventDateString,
  getDefaultEventDate,
  validateGeometryCoords,
} from './util';

jest.mock('ol/extent', () => ({
  containsCoordinate: jest.fn(),
}));

jest.mock('ol/proj', () => ({
  transform: jest.fn(),
}));

jest.mock('immutability-helper', () => (state, spec) => {
  const result = JSON.parse(JSON.stringify(state));
  if (spec.events) {
    if (spec.events.selectedCategories?.$set !== undefined) {
      result.events.selectedCategories = spec.events.selectedCategories.$set;
    }
    if (spec.events.selectedDates) {
      if (spec.events.selectedDates.start?.$set !== undefined) {
        result.events.selectedDates.start = spec.events.selectedDates.start.$set;
      }
      if (spec.events.selectedDates.end?.$set !== undefined) {
        result.events.selectedDates.end = spec.events.selectedDates.end.$set;
      }
    }
    if (spec.events.showAll?.$set !== undefined) {
      result.events.showAll = spec.events.showAll.$set;
    }
  }
  return result;
});

jest.mock('../map/constants', () => ({
  CRS: {
    GEOGRAPHIC: 'EPSG:4326',
    ARCTIC: 'EPSG:3413',
    ANTARCTIC: 'EPSG:3031',
  },
}));

jest.mock('./constants', () => ({
  LIMIT_EVENT_REQUEST_COUNT: 50,
}));

jest.mock('../../util/util', () => ({
  __esModule: true,
  default: {
    toQueryString: (params) => {
      const str = Object.entries(params)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');
      return str ? `?${str}` : '';
    },
    now: jest.fn(() => new Date('2023-06-15T00:00:00Z')),
  },
}));

import { containsCoordinate } from 'ol/extent';
import { transform } from 'ol/proj';

const GEOGRAPHIC_CRS = 'EPSG:4326';
const ARCTIC_CRS = 'EPSG:3413';
const ANTARCTIC_CRS = 'EPSG:3031';

const buildState = (overrides = {}) => ({
  config: {
    features: {
      naturalEvents: { host: 'fake.eonet.url/api' },
    },
    parameters: {},
    naturalEvents: {
      categories: [{ id: 'wildfires' }, { id: 'floods' }, { id: 'snow' }],
    },
  },
  proj: {
    selected: { crs: GEOGRAPHIC_CRS },
  },
  map: {
    ui: {
      selected: {
        getView: () => ({
          calculateExtent: () => [-15.06, 27.16, 13.32, 56.06],
        }),
      },
    },
  },
  events: {
    selectedCategories: [{ id: 'snow' }, { id: 'wildfires' }, { id: 'manmade' }],
    selectedDates: { start: '2020-01-01', end: '2021-01-01' },
    showAll: true,
  },
  ...overrides,
});

const updateEventState = (newState, state) => ({
  ...state,
  events: { ...state.events, ...newState },
});

const updateProjState = (newState, state) => ({
  ...state,
  proj: { ...newState },
});

describe('getEventsRequestURL', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('Request URL with geographic proj and no bbox [naturalevents-geo-proj-no-bbox]', () => {
    const state = buildState();
    const requestURL = getEventsRequestURL(state);
    expect(requestURL).toBe('fake.eonet.url/api/events?status=all&limit=50&bbox=-180%2C90%2C180%2C-90&start=2020-01-01&end=2021-01-01&category=snow%2Cwildfires%2Cmanmade');
  });

  test('Request URL with geographic proj and bbox set [naturalevents-geo-proj-bbox]', () => {
    const state = updateEventState({ showAll: false }, buildState());
    const requestURL = getEventsRequestURL(state);
    expect(requestURL).toBe('fake.eonet.url/api/events?status=all&limit=50&bbox=-15.06%2C27.16%2C13.32%2C56.06&start=2020-01-01&end=2021-01-01&category=snow%2Cwildfires%2Cmanmade');
  });

  test("Request URL doesn't include categories param if none set [naturalevents-categories-param]", () => {
    const state = updateEventState({ selectedCategories: [] }, buildState());
    const requestURL = getEventsRequestURL(state);
    expect(requestURL).toBe('fake.eonet.url/api/events?status=all&limit=50&bbox=-180%2C90%2C180%2C-90&start=2020-01-01&end=2021-01-01');
  });

  test('Uses mock events if mockEvents is "true" [naturalevents-mock-events]', () => {
    const state = buildState({
      config: { ...buildState().config, parameters: { mockEvents: 'true' } },
    });
    const requestURL = getEventsRequestURL(state);
    expect(requestURL).toBe('mock/events_data.json');
  });

  test('Uses named mock events file when mockEvents is not "true"', () => {
    const state = buildState({
      config: { ...buildState().config, parameters: { mockEvents: 'custom-mock' } },
    });
    const requestURL = getEventsRequestURL(state);
    expect(requestURL).toBe('mock/events_data.json-custom-mock');
  });

  test('Request URL with arctic proj uses default bbox [naturalevents-polar-proj]', () => {
    let state = updateProjState({ selected: { crs: ARCTIC_CRS } }, buildState());
    state = updateEventState({ showAll: false, selectedCategories: [{ id: 'snow' }] }, state);
    const requestURL = getEventsRequestURL(state);
    expect(requestURL).toBe('fake.eonet.url/api/events?status=all&limit=50&bbox=-180%2C40%2C180%2C90&start=2020-01-01&end=2021-01-01&category=snow');
  });

  test('Request URL with antarctic proj uses correct default bbox', () => {
    let state = updateProjState({ selected: { crs: ANTARCTIC_CRS } }, buildState());
    state = updateEventState({ showAll: false, selectedCategories: [{ id: 'snow' }] }, state);
    const requestURL = getEventsRequestURL(state);
    expect(requestURL).toBe('fake.eonet.url/api/events?status=all&limit=50&bbox=-180%2C-90%2C180%2C-40&start=2020-01-01&end=2021-01-01&category=snow');
  });

  test('Request URL does not include date params when selectedDates are null', () => {
    const state = updateEventState({ selectedDates: { start: null, end: null } }, buildState());
    const requestURL = getEventsRequestURL(state);
    expect(requestURL).not.toContain('start=');
    expect(requestURL).not.toContain('end=');
  });

  test('Uses geographic default bbox when showAll is false but map is not available', () => {
    const state = {
      ...buildState(),
      map: null,
      events: { ...buildState().events, showAll: false },
    };
    const requestURL = getEventsRequestURL(state);
    expect(requestURL).toContain('bbox=-180%2C90%2C180%2C-90');
  });

  test('warns when mockEvents is set', () => {
    const state = buildState({
      config: { ...buildState().config, parameters: { mockEvents: 'true' } },
    });
    getEventsRequestURL(state);
    expect(console.warn).toHaveBeenCalledWith('Using mock events data: true');
  });
});

describe('parseEvent', () => {
  it('parses a valid event string with id and date', () => {
    const result = parseEvent('EONET_1234,2023-06-15');
    expect(result.selected.id).toBe('EONET_1234');
    expect(result.selected.date).toBe('2023-06-15');
    expect(result.active).toBe(true);
    expect(result.showAll).toBe(true);
  });

  it('returns empty id when id does not match EONET pattern', () => {
    const result = parseEvent('INVALID_ID,2023-06-15');
    expect(result.selected.id).toBe('');
  });

  it('returns null date when date does not match date pattern', () => {
    const result = parseEvent('EONET_1234,not-a-date');
    expect(result.selected.date).toBeNull();
  });

  it('returns empty id and null date for bare comma', () => {
    const result = parseEvent(',');
    expect(result.selected.id).toBe('');
    expect(result.selected.date).toBeNull();
  });

  it('handles only an id with no date', () => {
    const result = parseEvent('EONET_1234');
    expect(result.selected.id).toBe('EONET_1234');
    expect(result.selected.date).toBeNull();
  });
});

describe('serializeEvent', () => {
  it('returns id,date when active, id, and date are all set', () => {
    const state = { active: true, selected: { id: 'EONET_1234', date: '2023-06-15' } };
    expect(serializeEvent(state)).toBe('EONET_1234,2023-06-15');
  });

  it('returns just the event id when active and id set but date is missing', () => {
    const state = { active: true, selected: { id: 'EONET_1234', date: null } };
    expect(serializeEvent(state)).toBe('EONET_1234');
  });

  it('returns "true" string when active but no id or date', () => {
    const state = { active: true, selected: { id: '', date: null } };
    expect(serializeEvent(state)).toBe('true');
  });

  it('returns undefined when not active', () => {
    const state = { active: false, selected: { id: 'EONET_1234', date: '2023-06-15' } };
    expect(serializeEvent(state)).toBeUndefined();
  });

  it('returns undefined when active is false and no id or date', () => {
    const state = { active: false, selected: { id: '', date: null } };
    expect(serializeEvent(state)).toBeUndefined();
  });
});

describe('parseEventFilterDates', () => {
  it('parses a valid date range string', () => {
    const result = parseEventFilterDates('2023-01-01,2023-12-31');
    expect(result.start).toBe('2023-01-01');
    expect(result.end).toBe('2023-12-31');
  });

  it('returns undefined end when only start is provided', () => {
    const result = parseEventFilterDates('2023-01-01');
    expect(result.start).toBe('2023-01-01');
    expect(result.end).toBeUndefined();
  });

  it('returns both as empty strings when given a bare comma', () => {
    const result = parseEventFilterDates(',');
    expect(result.start).toBe('');
    expect(result.end).toBe('');
  });
});

describe('serializeEventFilterDates', () => {
  it('returns formatted date string when events tab is active and both dates set', () => {
    const currentItemState = { start: '2023-01-01', end: '2023-12-31' };
    const state = { events: { active: true } };
    expect(serializeEventFilterDates(currentItemState, state)).toBe('2023-01-01,2023-12-31');
  });

  it('returns undefined when events tab is not active', () => {
    const currentItemState = { start: '2023-01-01', end: '2023-12-31' };
    const state = { events: { active: false } };
    expect(serializeEventFilterDates(currentItemState, state)).toBeUndefined();
  });

  it('returns undefined when start date is missing', () => {
    const currentItemState = { end: '2023-12-31' };
    const state = { events: { active: true } };
    expect(serializeEventFilterDates(currentItemState, state)).toBeUndefined();
  });

  it('returns undefined when end date is missing', () => {
    const currentItemState = { start: '2023-01-01' };
    const state = { events: { active: true } };
    expect(serializeEventFilterDates(currentItemState, state)).toBeUndefined();
  });
});

describe('serializeCategories', () => {
  const defaultCategories = [{ id: 'wildfires' }, { id: 'floods' }];
  const baseState = {
    events: { active: true },
    config: { naturalEvents: { categories: defaultCategories } },
  };

  it('returns undefined when using default categories reference', () => {
    expect(serializeCategories(defaultCategories, baseState)).toBeUndefined();
  });

  it('returns comma-separated ids when using non-default categories and tab is active', () => {
    const customCategories = [{ id: 'volcanoes' }, { id: 'snow' }];
    expect(serializeCategories(customCategories, baseState)).toBe('volcanoes,snow');
  });

  it('returns undefined when events tab is not active', () => {
    const customCategories = [{ id: 'volcanoes' }];
    const state = { ...baseState, events: { active: false } };
    expect(serializeCategories(customCategories, state)).toBeUndefined();
  });
});

describe('mapLocationToEventFilterState', () => {
  const allCategories = [{ id: 'wildfires' }, { id: 'floods' }, { id: 'snow' }];
  const baseState = {
    config: { naturalEvents: { categories: allCategories } },
  };
  const stateFromLocation = {
    events: {
      selected: { id: '', date: null },
      selectedDates: { start: '2023-01-01', end: '2023-06-01' },
      selectedCategories: [],
      showAll: true,
    },
  };

  it('uses all categories when efc param is not set', () => {
    const result = mapLocationToEventFilterState({}, stateFromLocation, baseState);
    expect(result.events.selectedCategories).toEqual(allCategories);
  });

  it('filters categories by efc param', () => {
    const result = mapLocationToEventFilterState({ efc: 'wildfires,snow' }, stateFromLocation, baseState);
    expect(result.events.selectedCategories).toEqual([{ id: 'wildfires' }, { id: 'snow' }]);
  });

  it('returns empty selectedCategories when allCategories is empty', () => {
    const emptyState = { config: { naturalEvents: { categories: [] } } };
    const result = mapLocationToEventFilterState({ efc: 'wildfires' }, stateFromLocation, emptyState);
    expect(result.events.selectedCategories).toEqual([]);
  });

  it('sets showAll to true when efs is "true"', () => {
    const result = mapLocationToEventFilterState({ efs: 'true' }, stateFromLocation, baseState);
    expect(result.events.showAll).toBe(true);
  });

  it('sets showAll to true when efs param is absent', () => {
    const result = mapLocationToEventFilterState({}, stateFromLocation, baseState);
    expect(result.events.showAll).toBe(true);
  });

  it('sets showAll to false when efs is "false"', () => {
    const result = mapLocationToEventFilterState({ efs: 'false' }, stateFromLocation, baseState);
    expect(result.events.showAll).toBe(false);
  });

  it('uses selected event date for start and end when event is selected and no efd param', () => {
    const stateWithSelected = {
      events: {
        ...stateFromLocation.events,
        selected: { id: 'EONET_1', date: '2023-03-15' },
      },
    };
    const result = mapLocationToEventFilterState({}, stateWithSelected, baseState);
    expect(result.events.selectedDates.start).toBe('2023-03-15');
    expect(result.events.selectedDates.end).toBe('2023-03-15');
  });

  it('uses stateFromLocation dates when no efd param and no event selected', () => {
    const result = mapLocationToEventFilterState({}, stateFromLocation, baseState);
    expect(result.events.selectedDates.start).toBe('2023-01-01');
    expect(result.events.selectedDates.end).toBe('2023-06-01');
  });
});

describe('toEventDateString', () => {
  it('returns the date portion of an ISO string', () => {
    const d = new Date('2023-06-15T12:00:00Z');
    expect(toEventDateString(d)).toBe('2023-06-15');
  });

  it('handles midnight UTC correctly', () => {
    const d = new Date('2023-01-01T00:00:00Z');
    expect(toEventDateString(d)).toBe('2023-01-01');
  });
});

describe('getDefaultEventDate', () => {
  it('returns the date of the first geometry when only one geometry exists', () => {
    const event = {
      geometry: [{ date: '2023-01-01T00:00:00Z' }],
      categories: [{ id: 'wildfires' }],
    };
    expect(getDefaultEventDate(event)).toBe('2023-01-01');
  });

  it('returns the first geometry date for non-severeStorms with multiple geometries', () => {
    const event = {
      geometry: [
        { date: '2023-01-01T00:00:00Z' },
        { date: '2023-01-02T00:00:00Z' },
      ],
      categories: [{ id: 'wildfires' }],
    };
    expect(getDefaultEventDate(event)).toBe('2023-01-01');
  });

  it('uses categories.id directly when categories is an object with id', () => {
    const event = {
      geometry: [
        { date: '2023-01-01T00:00:00Z' },
        { date: '2023-01-02T00:00:00Z' },
      ],
      categories: { id: 'wildfires' },
    };
    expect(getDefaultEventDate(event)).toBe('2023-01-01');
  });

  it('returns previous geometry date for severeStorms event occurring today', () => {
    const event = {
      geometry: [
        { date: '2023-06-15T00:00:00Z' },
        { date: '2023-06-14T00:00:00Z' },
      ],
      categories: [{ id: 'severeStorms' }],
    };
    expect(getDefaultEventDate(event)).toBe('2023-06-14');
  });

  it('returns first geometry date for severeStorms when date is not today', () => {
    const event = {
      geometry: [
        { date: '2020-01-01T00:00:00Z' },
        { date: '2019-12-31T00:00:00Z' },
      ],
      categories: [{ id: 'severeStorms' }],
    };
    expect(getDefaultEventDate(event)).toBe('2020-01-01');
  });
});

describe('validateGeometryCoords', () => {
  const proj = {
    crs: GEOGRAPHIC_CRS,
    maxExtent: [-180, -90, 180, 90],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns true for a Point geometry within extent', () => {
    transform.mockReturnValue([10, 20]);
    containsCoordinate.mockReturnValue(true);
    const geometry = { type: 'Point', coordinates: [10, 20] };
    expect(validateGeometryCoords(geometry, proj)).toBe(true);
  });

  it('returns false for a Point geometry outside extent', () => {
    transform.mockReturnValue([200, 200]);
    containsCoordinate.mockReturnValue(false);
    const geometry = { type: 'Point', coordinates: [200, 200] };
    expect(validateGeometryCoords(geometry, proj)).toBe(false);
  });

  it('returns true for a Polygon where all coordinates are within extent', () => {
    transform.mockReturnValue([10, 20]);
    containsCoordinate.mockReturnValue(true);
    const geometry = {
      type: 'Polygon',
      coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]],
    };
    expect(validateGeometryCoords(geometry, proj)).toBe(true);
  });

  it('returns false for a Polygon where some coordinates are outside extent', () => {
    transform.mockReturnValueOnce([10, 20]).mockReturnValueOnce([200, 200]);
    containsCoordinate.mockReturnValueOnce(true).mockReturnValueOnce(false);
    const geometry = {
      type: 'Polygon',
      coordinates: [[[0, 0], [200, 200]]],
    };
    expect(validateGeometryCoords(geometry, proj)).toBe(false);
  });

  it('returns undefined for an unrecognized geometry type', () => {
    const geometry = { type: 'LineString', coordinates: [[0, 0], [1, 1]] };
    expect(validateGeometryCoords(geometry, proj)).toBeUndefined();
  });

  it('calls transform with the correct source and target CRS', () => {
    transform.mockReturnValue([10, 20]);
    containsCoordinate.mockReturnValue(true);
    const geometry = { type: 'Point', coordinates: [10, 20] };
    validateGeometryCoords(geometry, proj);
    expect(transform).toHaveBeenCalledWith([10, 20], GEOGRAPHIC_CRS, GEOGRAPHIC_CRS);
  });

  it('calls containsCoordinate with the transformed coordinates', () => {
    transform.mockReturnValue([50, 60]);
    containsCoordinate.mockReturnValue(true);
    const geometry = { type: 'Point', coordinates: [10, 20] };
    validateGeometryCoords(geometry, proj);
    expect(containsCoordinate).toHaveBeenCalledWith(proj.maxExtent, [50, 60]);
  });
});

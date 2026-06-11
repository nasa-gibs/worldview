import {
  eventsReducer,
  eventsRequestReducer,
  eventRequestResponse,
  requestedEvents,
  requestedEventSources,
  getInitialEventsState,
  defaultRequestState,
} from './reducers';

jest.mock('./constants', () => ({
  REQUEST_EVENTS: 'REQUEST_EVENTS',
  REQUEST_SOURCES: 'REQUEST_SOURCES',
  SELECT_EVENT: 'SELECT_EVENT',
  DESELECT_EVENT: 'DESELECT_EVENT',
  SET_EVENTS_FILTER: 'SET_EVENTS_FILTER',
  FINISHED_ANIMATING_TO_EVENT: 'FINISHED_ANIMATING_TO_EVENT',
  HIGHLIGHT_EVENT: 'HIGHLIGHT_EVENT',
  UNHIGHLIGHT_EVENT: 'UNHIGHLIGHT_EVENT',
}));

jest.mock('../sidebar/constants', () => ({
  CHANGE_TAB: 'CHANGE_TAB',
}));

const defaultEventsState = {
  selected: {
    id: '',
    date: null,
    eventObject: null,
    geometryForDate: null,
  },
  highlighted: {
    id: '',
    date: null,
  },
  active: false,
  showAll: true,
  showAllTracks: false,
  isAnimatingToEvent: false,
  selectedCategories: [],
  selectedDates: {
    start: null,
    end: null,
  },
};

describe('defaultRequestState', () => {
  it('has correct default shape', () => {
    expect(defaultRequestState).toEqual({
      isLoading: false,
      error: null,
      response: null,
      type: null,
      ignore: [],
    });
  });
});

describe('eventRequestResponse', () => {
  it('returns the default request state when called with no args', () => {
    expect(eventRequestResponse()).toEqual(defaultRequestState);
  });

  it('merges provided props over defaults', () => {
    const result = eventRequestResponse({ isLoading: true, error: 'oops' });
    expect(result.isLoading).toBe(true);
    expect(result.error).toBe('oops');
    expect(result.response).toBeNull();
  });
});

describe('eventsReducer', () => {
  it('returns the default state when no state is provided', () => {
    const state = eventsReducer(undefined, { type: '@@INIT' });
    expect(state).toEqual(defaultEventsState);
  });

  it('returns the same state for an unknown action', () => {
    const state = eventsReducer(defaultEventsState, { type: 'UNKNOWN' });
    expect(state).toBe(defaultEventsState);
  });

  describe('SELECT_EVENT', () => {
    it('sets selected id and date', () => {
      const action = { type: 'SELECT_EVENT', id: 'event-1', date: '2023-01-01' };
      const state = eventsReducer(defaultEventsState, action);
      expect(state.selected.id).toBe('event-1');
      expect(state.selected.date).toBe('2023-01-01');
    });

    it('sets isAnimatingToEvent to true', () => {
      const action = { type: 'SELECT_EVENT', id: 'event-1', date: '2023-01-01' };
      const state = eventsReducer(defaultEventsState, action);
      expect(state.isAnimatingToEvent).toBe(true);
    });
  });

  describe('DESELECT_EVENT', () => {
    it('resets selected to default', () => {
      const preState = {
        ...defaultEventsState,
        selected: { id: 'event-1', date: '2023-01-01' },
      };
      const state = eventsReducer(preState, { type: 'DESELECT_EVENT' });
      expect(state.selected).toEqual({
        id: '',
        date: null,
        eventObject: null,
        geometryForDate: null,
      });
    });
  });

  describe('SET_EVENTS_FILTER', () => {
    it('sets showAll, showAllTracks, selectedCategories, and selectedDates', () => {
      const action = {
        type: 'SET_EVENTS_FILTER',
        showAll: false,
        showAllTracks: true,
        categories: ['wildfires'],
        start: '2023-01-01',
        end: '2023-01-31',
      };
      const state = eventsReducer(defaultEventsState, action);
      expect(state.showAll).toBe(false);
      expect(state.showAllTracks).toBe(true);
      expect(state.selectedCategories).toEqual(['wildfires']);
      expect(state.selectedDates).toEqual({ start: '2023-01-01', end: '2023-01-31' });
    });
  });

  describe('CHANGE_TAB', () => {
    it('sets active to true when activeTab is events', () => {
      const action = { type: 'CHANGE_TAB', activeTab: 'events' };
      const state = eventsReducer(defaultEventsState, action);
      expect(state.active).toBe(true);
    });

    it('sets active to false when activeTab is not events', () => {
      const preState = { ...defaultEventsState, active: true };
      const action = { type: 'CHANGE_TAB', activeTab: 'layers' };
      const state = eventsReducer(preState, action);
      expect(state.active).toBe(false);
    });

    it('returns the same state reference when active does not change', () => {
      const preState = { ...defaultEventsState, active: false };
      const action = { type: 'CHANGE_TAB', activeTab: 'layers' };
      const state = eventsReducer(preState, action);
      expect(state).toBe(preState);
    });
  });

  describe('FINISHED_ANIMATING_TO_EVENT', () => {
    it('sets isAnimatingToEvent to false', () => {
      const preState = { ...defaultEventsState, isAnimatingToEvent: true };
      const state = eventsReducer(preState, { type: 'FINISHED_ANIMATING_TO_EVENT' });
      expect(state.isAnimatingToEvent).toBe(false);
    });
  });

  describe('HIGHLIGHT_EVENT', () => {
    it('sets highlighted id and date', () => {
      const action = { type: 'HIGHLIGHT_EVENT', id: 'event-2', date: '2023-06-15' };
      const state = eventsReducer(defaultEventsState, action);
      expect(state.highlighted.id).toBe('event-2');
      expect(state.highlighted.date).toBe('2023-06-15');
    });
  });

  describe('UNHIGHLIGHT_EVENT', () => {
    it('resets highlighted to default', () => {
      const preState = {
        ...defaultEventsState,
        highlighted: { id: 'event-2', date: '2023-06-15' },
      };
      const state = eventsReducer(preState, { type: 'UNHIGHLIGHT_EVENT' });
      expect(state.highlighted).toEqual({ id: '', date: null });
    });
  });
});

describe('eventsRequestReducer', () => {
  describe('REQUEST_EVENTS_START', () => {
    it('sets isLoading to true and clears response', () => {
      const state = eventsRequestReducer('REQUEST_EVENTS', {}, { type: 'REQUEST_EVENTS_START' });
      expect(state.isLoading).toBe(true);
      expect(state.response).toBeNull();
    });
  });

  describe('REQUEST_EVENTS_SUCCESS', () => {
    it('returns sorted events on success', () => {
      const events = [
        { id: 'e1', geometry: [{ date: '2023-01-01T00:00:00Z' }] },
        { id: 'e2', geometry: [{ date: '2023-06-01T00:00:00Z' }] },
      ];
      const action = { type: 'REQUEST_EVENTS_SUCCESS', response: { events } };
      const state = eventsRequestReducer('REQUEST_EVENTS', {}, action);
      expect(state.isLoading).toBe(false);
      expect(Array.isArray(state.response)).toBe(true);
      expect(state.response[0].id).toBe('e2');
      expect(state.response[1].id).toBe('e1');
    });

    it('returns empty array when events payload is empty', () => {
      const action = { type: 'REQUEST_EVENTS_SUCCESS', response: { events: [] } };
      const state = eventsRequestReducer('REQUEST_EVENTS', {}, action);
      expect(state.response).toEqual([]);
    });

    it('returns empty array when events payload is undefined', () => {
      const action = { type: 'REQUEST_EVENTS_SUCCESS', response: {} };
      const state = eventsRequestReducer('REQUEST_EVENTS', {}, action);
      expect(state.response).toEqual([]);
    });

    it('deduplicates geometry entries with the same date', () => {
      const events = [
        {
          id: 'e1',
          geometry: [
            { date: '2023-01-01T00:00:00Z' },
            { date: '2023-01-01T12:00:00Z' },
          ],
        },
      ];
      const action = { type: 'REQUEST_EVENTS_SUCCESS', response: { events } };
      const state = eventsRequestReducer('REQUEST_EVENTS', {}, action);
      expect(state.response[0].geometry).toHaveLength(1);
    });

    it('handles events with non-array geometry', () => {
      const events = [{ id: 'e1', geometry: null }];
      const action = { type: 'REQUEST_EVENTS_SUCCESS', response: { events } };
      const state = eventsRequestReducer('REQUEST_EVENTS', {}, action);
      expect(state.response[0].geometry).toEqual([]);
    });
  });

  describe('REQUEST_EVENTS_FAILURE', () => {
    it('sets error and clears response', () => {
      const action = { type: 'REQUEST_EVENTS_FAILURE', error: 'fetch failed' };
      const state = eventsRequestReducer('REQUEST_EVENTS', {}, action);
      expect(state.error).toBe('fetch failed');
      expect(state.response).toBeNull();
      expect(state.isLoading).toBe(false);
    });
  });

  describe('REQUEST_SOURCES_START', () => {
    it('sets isLoading to true and clears response', () => {
      const state = eventsRequestReducer('REQUEST_SOURCES', {}, { type: 'REQUEST_SOURCES_START' });
      expect(state.isLoading).toBe(true);
      expect(state.response).toBeNull();
    });
  });

  describe('REQUEST_SOURCES_SUCCESS', () => {
    it('returns sources payload on success', () => {
      const sources = [{ id: 's1' }, { id: 's2' }];
      const action = { type: 'REQUEST_SOURCES_SUCCESS', response: { sources } };
      const state = eventsRequestReducer('REQUEST_SOURCES', {}, action);
      expect(state.isLoading).toBe(false);
      expect(state.response).toEqual(sources);
    });

    it('returns null when sources payload is missing', () => {
      const action = { type: 'REQUEST_SOURCES_SUCCESS', response: {} };
      const state = eventsRequestReducer('REQUEST_SOURCES', {}, action);
      expect(state.response).toBeNull();
    });
  });

  describe('REQUEST_SOURCES_FAILURE', () => {
    it('sets error and clears response', () => {
      const action = { type: 'REQUEST_SOURCES_FAILURE', error: 'sources failed' };
      const state = eventsRequestReducer('REQUEST_SOURCES', {}, action);
      expect(state.error).toBe('sources failed');
      expect(state.response).toBeNull();
      expect(state.isLoading).toBe(false);
    });
  });

  describe('default case', () => {
    it('returns default request state for unknown action', () => {
      const state = eventsRequestReducer('REQUEST_EVENTS', {}, { type: 'UNKNOWN' });
      expect(state).toEqual(defaultRequestState);
    });
  });
});

describe('requestedEvents', () => {
  it('returns default state for unknown action', () => {
    const state = requestedEvents(undefined, { type: 'UNKNOWN' });
    expect(state).toEqual(defaultRequestState);
  });

  it('handles REQUEST_EVENTS_START', () => {
    const state = requestedEvents({}, { type: 'REQUEST_EVENTS_START' });
    expect(state.isLoading).toBe(true);
  });

  it('handles REQUEST_EVENTS_SUCCESS', () => {
    const events = [{ id: 'e1', geometry: [{ date: '2023-01-01T00:00:00Z' }] }];
    const state = requestedEvents({}, { type: 'REQUEST_EVENTS_SUCCESS', response: { events } });
    expect(state.isLoading).toBe(false);
    expect(Array.isArray(state.response)).toBe(true);
  });

  it('handles REQUEST_EVENTS_FAILURE', () => {
    const state = requestedEvents({}, { type: 'REQUEST_EVENTS_FAILURE', error: 'err' });
    expect(state.error).toBe('err');
  });
});

describe('requestedEventSources', () => {
  it('returns default state for unknown action', () => {
    const state = requestedEventSources(undefined, { type: 'UNKNOWN' });
    expect(state).toEqual(defaultRequestState);
  });

  it('handles REQUEST_SOURCES_START', () => {
    const state = requestedEventSources({}, { type: 'REQUEST_SOURCES_START' });
    expect(state.isLoading).toBe(true);
  });

  it('handles REQUEST_SOURCES_SUCCESS', () => {
    const sources = [{ id: 's1' }];
    const state = requestedEventSources({}, { type: 'REQUEST_SOURCES_SUCCESS', response: { sources } });
    expect(state.isLoading).toBe(false);
    expect(state.response).toEqual(sources);
  });

  it('handles REQUEST_SOURCES_FAILURE', () => {
    const state = requestedEventSources({}, { type: 'REQUEST_SOURCES_FAILURE', error: 'src err' });
    expect(state.error).toBe('src err');
  });
});

describe('getInitialEventsState', () => {
  const config = {
    initialDate: '2023-06-01',
    naturalEvents: {
      categories: ['wildfires', 'floods'],
    },
  };

  it('returns selectedCategories from config', () => {
    const state = getInitialEventsState(config);
    expect(state.selectedCategories).toEqual(['wildfires', 'floods']);
  });

  it('returns correct endDate based on initialDate', () => {
    const state = getInitialEventsState(config);
    expect(state.selectedDates.end).toBe('2023-06-01');
  });

  it('returns correct startDate 120 days before initialDate', () => {
    const state = getInitialEventsState(config);
    expect(state.selectedDates.start).toBe('2023-02-01');
  });

  it('spreads the default eventsReducerState properties', () => {
    const state = getInitialEventsState(config);
    expect(state.active).toBe(false);
    expect(state.showAll).toBe(true);
    expect(state.isAnimatingToEvent).toBe(false);
    expect(state.highlighted).toEqual({ id: '', date: null });
  });
});

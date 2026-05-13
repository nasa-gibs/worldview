import {
  requestEvents,
  requestSources,
  selectEvent,
  deselectEvent,
  setEventsFilter,
  highlightEvent,
  unHighlightEvent,
  selected,
} from './actions';

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

jest.mock('./util', () => ({
  getEventsRequestURL: jest.fn(() => 'http://mock-url/events'),
}));

jest.mock('../core/actions', () => ({
  requestAction: jest.fn(),
}));

import { getEventsRequestURL } from './util';
import { requestAction } from '../core/actions';

describe('requestEvents', () => {
  it('returns a thunk', () => {
    const thunk = requestEvents();
    expect(typeof thunk).toBe('function');
  });

  it('calls getEventsRequestURL with state', () => {
    const mockState = { events: {} };
    const dispatch = jest.fn();
    const getState = jest.fn(() => mockState);
    requestEvents()(dispatch, getState);
    expect(getEventsRequestURL).toHaveBeenCalledWith(mockState);
  });

  it('calls requestAction with correct arguments', () => {
    const mockState = { events: {} };
    const dispatch = jest.fn();
    const getState = jest.fn(() => mockState);
    requestEvents()(dispatch, getState);
    expect(requestAction).toHaveBeenCalledWith(
      dispatch,
      'REQUEST_EVENTS',
      'http://mock-url/events',
      'application/json',
    );
  });
});

describe('requestSources', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns a thunk', () => {
    const thunk = requestSources();
    expect(typeof thunk).toBe('function');
  });

  it('calls requestAction with the correct sources URL when no mock', () => {
    const mockState = {
      config: {
        features: { naturalEvents: { host: 'http://mock-host' } },
        parameters: {},
      },
    };
    const dispatch = jest.fn();
    const getState = jest.fn(() => mockState);
    requestSources()(dispatch, getState);
    expect(requestAction).toHaveBeenCalledWith(
      dispatch,
      'REQUEST_SOURCES',
      'http://mock-host/sources',
      'application/json',
    );
  });

  it('uses mock sources URL and warns when mockSources is set', () => {
    const mockState = {
      config: {
        features: { naturalEvents: { host: 'http://mock-host' } },
        parameters: { mockSources: 'test-mock' },
      },
    };
    const dispatch = jest.fn();
    const getState = jest.fn(() => mockState);
    requestSources()(dispatch, getState);
    expect(console.warn).toHaveBeenCalledWith('Using mock sources data: test-mock');
    expect(requestAction).toHaveBeenCalledWith(
      dispatch,
      'REQUEST_SOURCES',
      'mock/sources_data.json-test-mock',
      'application/json',
    );
  });

  it('catches and logs errors thrown by requestAction', () => {
    requestAction.mockImplementationOnce(() => {
      throw new Error('network error');
    });
    const mockState = {
      config: {
        features: { naturalEvents: { host: 'http://mock-host' } },
        parameters: {},
      },
    };
    const dispatch = jest.fn();
    const getState = jest.fn(() => mockState);
    expect(() => requestSources()(dispatch, getState)).not.toThrow();
    expect(console.error).toHaveBeenCalled();
  });
});

describe('selectEvent', () => {
  it('returns the correct type', () => {
    const result = selectEvent('event-1', '2023-01-01');
    expect(result.type).toBe('SELECT_EVENT');
  });

  it('returns the correct id', () => {
    const result = selectEvent('event-1', '2023-01-01');
    expect(result.id).toBe('event-1');
  });

  it('returns the correct date', () => {
    const result = selectEvent('event-1', '2023-01-01');
    expect(result.date).toBe('2023-01-01');
  });

  it('returns undefined id and date when no args passed', () => {
    const result = selectEvent();
    expect(result.id).toBeUndefined();
    expect(result.date).toBeUndefined();
  });
});

describe('deselectEvent', () => {
  it('returns the correct type', () => {
    const result = deselectEvent('event-1', '2023-01-01');
    expect(result.type).toBe('DESELECT_EVENT');
  });

  it('does not include id or date in the returned object', () => {
    const result = deselectEvent('event-1', '2023-01-01');
    expect(result.id).toBeUndefined();
    expect(result.date).toBeUndefined();
  });
});

describe('setEventsFilter', () => {
  const baseState = {
    events: {
      selectedCategories: ['wildfires'],
      selectedDates: { start: '2023-01-01', end: '2023-01-31' },
      showAll: false,
    },
  };

  it('returns a thunk', () => {
    const thunk = setEventsFilter([], '2023-01-01', '2023-01-31', false, false);
    expect(typeof thunk).toBe('function');
  });

  it('dispatches SET_EVENTS_FILTER with correct payload', () => {
    const dispatch = jest.fn();
    const getState = jest.fn(() => baseState);
    setEventsFilter(['wildfires'], '2023-01-01', '2023-01-31', false, true)(dispatch, getState);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_EVENTS_FILTER',
      categories: ['wildfires'],
      start: '2023-01-01',
      end: '2023-01-31',
      showAll: false,
      showAllTracks: true,
    });
  });

  it('dispatches requestEvents when showAll is false', () => {
    const dispatch = jest.fn();
    const getState = jest.fn(() => baseState);
    setEventsFilter(['wildfires'], '2023-01-01', '2023-01-31', false, false)(dispatch, getState);
    expect(dispatch).toHaveBeenCalledTimes(2);
  });

  it('dispatches requestEvents when categories have changed', () => {
    const dispatch = jest.fn();
    const getState = jest.fn(() => baseState);
    setEventsFilter(['floods'], '2023-01-01', '2023-01-31', true, false)(dispatch, getState);
    expect(dispatch).toHaveBeenCalledTimes(2);
  });

  it('dispatches requestEvents when dates have changed', () => {
    const dispatch = jest.fn();
    const getState = jest.fn(() => baseState);
    setEventsFilter(['wildfires'], '2023-02-01', '2023-02-28', true, false)(dispatch, getState);
    expect(dispatch).toHaveBeenCalledTimes(2);
  });

  it('dispatches requestEvents when showAll changes from false to true', () => {
    const dispatch = jest.fn();
    const getState = jest.fn(() => baseState);
    setEventsFilter(['wildfires'], '2023-01-01', '2023-01-31', true, false)(dispatch, getState);
    expect(dispatch).toHaveBeenCalledTimes(2);
  });

  it('does not dispatch requestEvents when showAll is true and nothing has changed', () => {
    const unchangedState = {
      events: {
        selectedCategories: ['wildfires'],
        selectedDates: { start: '2023-01-01', end: '2023-01-31' },
        showAll: true,
      },
    };
    const dispatch = jest.fn();
    const getState = jest.fn(() => unchangedState);
    setEventsFilter(['wildfires'], '2023-01-01', '2023-01-31', true, false)(dispatch, getState);
    expect(dispatch).toHaveBeenCalledTimes(1);
  });
});

describe('highlightEvent', () => {
  it('returns the correct type', () => {
    const result = highlightEvent('event-1', '2023-01-01');
    expect(result.type).toBe('HIGHLIGHT_EVENT');
  });

  it('returns the correct id', () => {
    const result = highlightEvent('event-1', '2023-01-01');
    expect(result.id).toBe('event-1');
  });

  it('returns the correct date', () => {
    const result = highlightEvent('event-1', '2023-01-01');
    expect(result.date).toBe('2023-01-01');
  });

  it('returns undefined id and date when no args passed', () => {
    const result = highlightEvent();
    expect(result.id).toBeUndefined();
    expect(result.date).toBeUndefined();
  });
});

describe('unHighlightEvent', () => {
  it('returns the correct type', () => {
    const result = unHighlightEvent('event-1', '2023-01-01');
    expect(result.type).toBe('UNHIGHLIGHT_EVENT');
  });

  it('does not include id or date in the returned object', () => {
    const result = unHighlightEvent('event-1', '2023-01-01');
    expect(result.id).toBeUndefined();
    expect(result.date).toBeUndefined();
  });
});

describe('selected', () => {
  it('returns the correct type', () => {
    const result = selected();
    expect(result.type).toBe('FINISHED_ANIMATING_TO_EVENT');
  });

  it('returns only the type property', () => {
    const result = selected();
    expect(Object.keys(result)).toEqual(['type']);
  });
});

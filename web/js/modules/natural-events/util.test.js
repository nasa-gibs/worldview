import { config } from '@fortawesome/fontawesome-svg-core';
import { getEventsRequestURL } from './util';
import fixtures from '../../fixtures';

let initialState = fixtures.getState();

initialState = {
  ...initialState,
  events: {
    ...initialState.events,
    selectedDates: {
      start: '2020-01-01',
      end: '2021-01-01',
    },
    selectedCategories: [
      { id: 'snow' },
      { id: 'wildfires' },
      { id: 'manmade' },
    ],
  },
};

const mockProj = {
  geographic: { selected: { crs: 'EPSG:4326' } },
  arctic: { selected: { crs: 'EPSG:3413' } },
  antarctic: { selected: { crs: 'EPSG:3031' } },
};

const updateEventState = (newState, state) => ({
  ...state,
  events: {
    ...state.events,
    ...newState,
  },
});

const updateProjState = (newState, state) => ({
  ...state,
  proj: {
    ...newState,
  },
});

test('Request URL with grographic proj and no bbox [naturalevents-geo-proj-no-bbox]', () => {
  const requestURL = getEventsRequestURL(initialState);
  expect(requestURL).toBe('fake.eonet.url/api/events?status=all&limit=50&bbox=-180%2C90%2C180%2C-90&start=2020-01-01&end=2021-01-01&category=snow%2Cwildfires%2Cmanmade');
});

test('Request URL with grographic proj and bbox set [naturalevents-geo-proj-bbox]', () => {
  const state = updateEventState({ showAll: false }, initialState);
  const requestURL = getEventsRequestURL(state);
  expect(requestURL).toBe('fake.eonet.url/api/events?status=all&limit=50&bbox=-15.06%2C27.16%2C13.32%2C56.06&start=2020-01-01&end=2021-01-01&category=snow%2Cwildfires%2Cmanmade');
});

test('Request URL doesn\'t include categories param if none set [naturalevents-categories-param]', () => {
  const state = updateEventState({ selectedCategories: [] }, initialState);
  const requestURL = getEventsRequestURL(state);
  expect(requestURL).toBe('fake.eonet.url/api/events?status=all&limit=50&bbox=-180%2C90%2C180%2C-90&start=2020-01-01&end=2021-01-01');
});

test('Uses mock events if mockEvents param is present [naturalevents-mock-events]', () => {
  const state = {
    ...initialState,
    config: {
      ...config,
      parameters: {
        mockEvents: 'true',
      },
    },
  };
  const requestURL = getEventsRequestURL(state);
  expect(requestURL).toBe('mock/events_data.json');
});

test('Request URL with polar proj uses default bbox [naturalevents-polar-proj]', () => {
  let state = updateProjState(mockProj.arctic, initialState);
  state = updateEventState({
    showAll: false,
    selectedCategories: [{ id: 'snow' }],
  }, state);
  const requestURL = getEventsRequestURL(state);
  expect(requestURL).toBe('fake.eonet.url/api/events?status=all&limit=50&bbox=-180%2C40%2C180%2C90&start=2020-01-01&end=2021-01-01&category=snow');
});

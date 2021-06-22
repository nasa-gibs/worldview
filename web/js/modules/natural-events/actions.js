import {
  get as lodashGet,
  isEqual as lodashEqual,
} from 'lodash';
import {
  getEventsRequestURL,
} from './util';

import {
  REQUEST_EVENTS,
  REQUEST_SOURCES,
  SELECT_EVENT,
  DESELECT_EVENT,
  SET_EVENTS_FILTER,
  FINISHED_ANIMATING_TO_EVENT,
} from './constants';
import { requestAction } from '../core/actions';

export function requestEvents() {
  return (dispatch, getState) => {
    const state = getState();
    const requestUrl = getEventsRequestURL(state);
    requestAction(
      dispatch,
      REQUEST_EVENTS,
      requestUrl,
      'application/json',
    );
  };
}

export function requestSources() {
  return (dispatch, getState) => {
    const { config } = getState();
    const baseUrl = lodashGet(config, 'features.naturalEvents.host');
    const mockSources = lodashGet(config, 'parameters.mockSources');
    let sourcesURL = `${baseUrl}/sources`;

    if (mockSources) {
      // eslint-disable-next-line no-console
      console.warn(`Using mock sources data: ${mockSources}`);
      sourcesURL = `mock/sources_data.json-${mockSources}`;
    }
    requestAction(
      dispatch,
      REQUEST_SOURCES,
      sourcesURL,
      'application/json',
    );
  };
}

export function selectEvent(id, eventDate) {
  return {
    type: SELECT_EVENT,
    id,
    date: eventDate,
  };
}

export function deselectEvent(id, date) {
  return {
    type: DESELECT_EVENT,
  };
}

export function setEventsFilter(categories, start, end, showAll) {
  return (dispatch, getState) => {
    const {
      selectedCategories,
      selectedDates,
      showAll: prevShowAll,
    } = getState().events;
    const requestUrl = getEventsRequestURL(getState());
    const sameCategories = lodashEqual(selectedCategories, categories);
    const sameDates = lodashEqual(selectedDates, { start, end });
    dispatch({
      type: SET_EVENTS_FILTER,
      categories,
      start,
      end,
      showAll,
    });
    // Only make request if something has changed
    if (!showAll || (prevShowAll !== showAll) || !sameCategories || !sameDates) {
      dispatch(requestEvents(requestUrl));
    }
  };
}

export function selected() {
  return {
    type: FINISHED_ANIMATING_TO_EVENT,
  };
}

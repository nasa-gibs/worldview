import {
  get as lodashGet,
  isEqual as lodashEqual,
} from 'lodash';

import {
  REQUEST_EVENTS,
  REQUEST_SOURCES,
  SELECT_EVENT,
  DESELECT_EVENT,
  SET_EVENTS_FILTER,
  FINISHED_ANIMATING_TO_EVENT,
} from './constants';
import { requestAction } from '../core/actions';
import { getEventsRequestURL } from '../../map/natural-events/util';

export function requestEvents(location) {
  return (dispatch) => requestAction(
    dispatch,
    REQUEST_EVENTS,
    location,
    'application/json',
  );
}

export function requestSources(location) {
  return (dispatch) => requestAction(
    dispatch,
    REQUEST_SOURCES,
    location,
    'application/json',
  );
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

export function setEventsFilter(categories, startDate, endDate, showAll) {
  return (dispatch, getState) => {
    const { config, proj, events } = getState();
    const { selectedCategories, selectedDates } = events;
    const baseUrl = lodashGet(config, 'features.naturalEvents.host');
    const requestUrl = getEventsRequestURL(baseUrl, startDate, endDate, categories, proj);
    const sameCategories = lodashEqual(selectedCategories, categories);
    const sameDates = lodashEqual(selectedDates, { start: startDate, end: endDate });
    if (!sameCategories || !sameDates) {
      dispatch(requestEvents(requestUrl));
    }

    dispatch({
      type: SET_EVENTS_FILTER,
      categories,
      startDate,
      endDate,
      showAll,
    });
  };
}

export function selected() {
  return {
    type: FINISHED_ANIMATING_TO_EVENT,
  };
}

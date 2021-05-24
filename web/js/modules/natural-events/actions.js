import {
  get as lodashGet,
} from 'lodash';
import {
  REQUEST_EVENTS,
  REQUEST_SOURCES,
  SELECT_EVENT,
  DESELECT_EVENT,
  SHOW_ALL_EVENTS,
  SET_EVENTS_FILTER,
  ONLY_SHOW_VISIBLE,
  TOGGLE_SHOW_ALL,
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

export function showAll() {
  return {
    type: SHOW_ALL_EVENTS,
  };
}

export function setEventsFilter(categories, startDate, endDate) {
  return (dispatch, getState) => {
    const { config, proj } = getState();
    const baseUrl = lodashGet(config, 'features.naturalEvents.host');
    const requestUrl = getEventsRequestURL(baseUrl, startDate, endDate, categories, proj);
    dispatch(requestEvents(requestUrl));
    dispatch({
      type: SET_EVENTS_FILTER,
      categories,
      startDate,
      endDate,
    });
  };
}

export function toggleListAll() {
  return {
    type: TOGGLE_SHOW_ALL,
  };
}

export function onlyShowVisible() {
  return {
    type: ONLY_SHOW_VISIBLE,
  };
}

export function selected() {
  return {
    type: FINISHED_ANIMATING_TO_EVENT,
  };
}

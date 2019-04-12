import {
  REQUEST_EVENTS,
  REQUEST_SOURCES,
  REQUEST_CATEGORIES,
  SELECT_EVENT,
  DESELECT_EVENT,
  SHOW_ALL_EVENTS,
  ONLY_SHOW_VISIBLE
} from './constants';
import { requestAction } from '../core/actions';

export function requestEvents(location) {
  return dispatch => {
    return requestAction(
      dispatch,
      REQUEST_EVENTS,
      location,
      'application/json'
    );
  };
}
export function requestCategories(location) {
  return dispatch => {
    return requestAction(
      dispatch,
      REQUEST_CATEGORIES,
      location,
      'application/json'
    );
  };
}
export function requestSources(location) {
  return dispatch => {
    return requestAction(
      dispatch,
      REQUEST_SOURCES,
      location,
      'application/json'
    );
  };
}

export function selectEvent(id, date) {
  console.log(id, date);
  return {
    type: SELECT_EVENT,
    id: id,
    date: date
  };
}

export function deselectEvent(id, date) {
  return {
    type: DESELECT_EVENT,
    id: id,
    date: date
  };
}

export function showAll() {
  return {
    type: SHOW_ALL_EVENTS
  };
}

export function onlyShowVisible() {
  return {
    type: ONLY_SHOW_VISIBLE
  };
}

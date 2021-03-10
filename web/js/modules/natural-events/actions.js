import {
  REQUEST_EVENTS,
  REQUEST_SOURCES,
  SELECT_EVENT,
  DESELECT_EVENT,
  SHOW_ALL_EVENTS,
  SELECT_CATEGORY,
  ONLY_SHOW_VISIBLE,
  TOGGLE_SHOW_ALL,
  FINISHED_ANIMATING_TO_EVENT,
} from './constants';
import { requestAction } from '../core/actions';

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

export function selectEvent(id, date) {
  return {
    type: SELECT_EVENT,
    id,
    date,
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

export function selectCategory(category) {
  return {
    type: SELECT_CATEGORY,
    category,
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

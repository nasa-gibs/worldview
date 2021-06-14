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

export function setEventsFilter(categories, start, end, showAll) {
  return (dispatch, getState) => {
    const {
      config, proj, events, map,
    } = getState();
    const {
      selectedCategories,
      selectedDates,
      showAll: prevShowAll,
    } = events;
    const bbox = !showAll && map.ui.selected.getView().calculateExtent();
    const baseUrl = lodashGet(config, 'features.naturalEvents.host');
    const requestUrl = getEventsRequestURL(baseUrl, { start, end }, categories, proj, bbox);
    const sameCategories = lodashEqual(selectedCategories, categories);
    const sameDates = lodashEqual(selectedDates, { start, end });

    // Only make request if something has changed
    if (!showAll || (prevShowAll !== showAll) || !sameCategories || !sameDates) {
      dispatch(requestEvents(requestUrl));
    }
    dispatch({
      type: SET_EVENTS_FILTER,
      categories,
      start,
      end,
      showAll,
    });
  };
}

export function selected() {
  return {
    type: FINISHED_ANIMATING_TO_EVENT,
  };
}

import { get } from 'lodash';
import update from 'immutability-helper';
import moment from 'moment';
import util from '../../util/util';
import {
  LIMIT_EVENT_REQUEST_COUNT,
} from './constants';

export function parseEvent(eventString) {
  const values = eventString.split(',');
  let id = values[0] || '';
  let date = values[1] || '';
  id = id.match(/^EONET_[0-9]+/i) ? values[0] : '';
  date = date.match(/\d{4}-\d{2}-\d{2}/) ? values[1] : null;
  return {
    selected: {
      id,
      date,
    },
    active: true,
    showAll: true,
  };
}
export function serializeEvent(currentItemState) {
  const eventId = get(currentItemState, 'selected.id');
  const eventDate = get(currentItemState, 'selected.date');
  const eventsTabActive = currentItemState.active;
  return eventsTabActive && eventDate && eventId
    ? [eventId, eventDate].join(',')
    : eventId && eventsTabActive
      ? eventId
      : eventsTabActive
        ? 'true'
        : undefined;
}

export function parseEventFilterDates(eventFilterDatesString) {
  const [selectedStartDate, selectedEndDate] = eventFilterDatesString.split(',');
  return {
    start: selectedStartDate,
    end: selectedEndDate,
  };
}

export function serializeEventFilterDates(currentItemState, state) {
  const selectedStartDate = get(currentItemState, 'start');
  const selectedEndDate = get(currentItemState, 'end');
  const eventsTabActive = state.events.active;
  return eventsTabActive && selectedStartDate && selectedEndDate
    ? `${selectedStartDate},${selectedEndDate}`
    : undefined;
}

export function serializeCategories(categories, state) {
  const eventsTabActive = state.events.active;
  return eventsTabActive ? categories.map(({ id }) => id).join(',') : undefined;
}

export function mapLocationToEventFilterState(parameters, stateFromLocation, state) {
  const allCategories = state.config.naturalEvents.categories;
  const { selected, selectedDates } = stateFromLocation.events;
  const selectedIds = parameters.efc
    ? parameters.efc.split(',')
    : allCategories.map(({ id }) => id);
  const selectedCategories = !allCategories.length
    ? []
    : selectedIds.map((id) => allCategories.find((c) => c.id === id));

  let [selectedStartDate, selectedEndDate] = (parameters.efd || ',').split(',');

  const eventIsSelected = selected.id && selected.date;
  const filterDatesAreSet = selectedStartDate && selectedEndDate;
  if (eventIsSelected && !filterDatesAreSet) {
    selectedStartDate = selected.date;
    selectedEndDate = selected.date;
  } else {
    selectedStartDate = selectedDates.start;
    selectedEndDate = selectedDates.end;
  }

  let showAll;
  if (parameters.efs === 'true' || !parameters.efs) {
    showAll = true;
  } else if (parameters.efs === 'false') {
    showAll = false;
  }

  return update(stateFromLocation, {
    events: {
      selectedCategories: {
        $set: selectedCategories,
      },
      selectedDates: {
        start: { $set: selectedStartDate },
        end: { $set: selectedEndDate },
      },
      showAll: {
        $set: showAll,
      },
    },
  });
}

export function getEventsRequestURL (baseUrl, selectedDates, categories = [], proj, bbox) {
  const { crs } = proj.selected;
  const params = {
    status: 'all',
    limit: LIMIT_EVENT_REQUEST_COUNT,
  };
  const { start, end } = selectedDates;

  if (start && end) {
    params.start = moment.utc(start).format('YYYY-MM-DD');
    params.end = moment.utc(end).format('YYYY-MM-DD');
  }
  if (categories.length) {
    params.category = categories.map(({ id }) => id).join(',');
  }

  let [minLon, maxLat, maxLon, minLat] = [-180, 90, 180, -90];
  if (crs === 'EPSG:3413') {
    [minLon, maxLat, maxLon, minLat] = [-180, 50, 180, 90];
  }
  if (crs === 'EPSG:3031') {
    [minLon, maxLat, maxLon, minLat] = [-180, -90, 180, -50];
  }
  if (bbox && bbox.length && crs === 'EPSG:4326') {
    [minLon, maxLat, maxLon, minLat] = bbox;
  }
  params.bbox = [minLon, maxLat, maxLon, minLat];

  return `${baseUrl}/events${util.toQueryString(params)}`;
}

/**
 *
 * @param {*} event
 */
export function getDefaultEventDate(event) {
  const preDate = event.geometry[0] && event.geometry[0].date;
  let date = new Date(preDate).toISOString().split('T')[0];
  if (event.geometry.length < 2) return date;
  const category = event.categories.title || event.categories[0].title;
  const today = new Date().toISOString().split('T')[0];
  // For storms that happened today, get previous date
  if (date === today && category === 'Severe Storms') {
    [date] = new Date(event.geometry[1].date).toISOString().split('T');
  }
  return date;
}

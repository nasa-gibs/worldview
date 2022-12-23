import { get as lodashGet } from 'lodash';
import update from 'immutability-helper';
import moment from 'moment';
import { containsCoordinate } from 'ol/extent';
import { transform } from 'ol/proj';
import util from '../../util/util';
import {
  LIMIT_EVENT_REQUEST_COUNT,
} from './constants';
import { CRS } from '../map/constants';

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
  const eventId = lodashGet(currentItemState, 'selected.id');
  const eventDate = lodashGet(currentItemState, 'selected.date');
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
  const selectedStartDate = lodashGet(currentItemState, 'start');
  const selectedEndDate = lodashGet(currentItemState, 'end');
  const eventsTabActive = state.events.active;
  return eventsTabActive && selectedStartDate && selectedEndDate
    ? `${selectedStartDate},${selectedEndDate}`
    : undefined;
}

export function serializeCategories(categories, state) {
  const eventsTabActive = state.events.active;
  const usingDefaults = categories === state.config.naturalEvents.categories;
  return eventsTabActive && !usingDefaults ? categories.map(({ id }) => id).join(',') : undefined;
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

export function getEventsRequestURL (state) {
  const {
    config, proj, events, map,
  } = state;
  const {
    selectedCategories,
    selectedDates,
    showAll,
  } = events;
  const baseUrl = lodashGet(config, 'features.naturalEvents.host');
  const mockEvents = lodashGet(config, 'parameters.mockEvents');
  if (mockEvents) {
    // eslint-disable-next-line no-console
    console.warn(`Using mock events data: ${mockEvents}`);
    return mockEvents === 'true'
      ? 'mock/events_data.json'
      : `mock/events_data.json-${mockEvents}`;
  }
  // Rough extents used for EONET projection extent filtering.  Polar extents do not
  // represent exact bounds seen in app since they are expressed in EPSG:4326
  // format which is the only format the API supports
  const extentBounds = {
    [CRS.GEOGRAPHIC]: [-180, 90, 180, -90],
    [CRS.ARCTIC]: [-180, 40, 180, 90],
    [CRS.ANTARCTIC]: [-180, -90, 180, -40],
  };
  const { crs } = proj.selected;
  const selectedMap = map && map.ui.selected;
  const bbox = !showAll && selectedMap && selectedMap.getView().calculateExtent();
  const { start, end } = selectedDates;
  const params = {
    status: 'all',
    limit: LIMIT_EVENT_REQUEST_COUNT,
  };
  const useBbox = bbox && bbox.length && crs === CRS.GEOGRAPHIC;
  params.bbox = useBbox ? bbox : extentBounds[crs];

  if (start && end) {
    params.start = moment.utc(start).format('YYYY-MM-DD');
    params.end = moment.utc(end).format('YYYY-MM-DD');
  }
  if (selectedCategories.length) {
    params.category = selectedCategories.map(({ id }) => id).join(',');
  }
  return `${baseUrl}/events${util.toQueryString(params)}`;
}

export const toEventDateString = (d) => d.toISOString().split('T')[0];

/**
 *
 * @param {*} event
 */
export function getDefaultEventDate({ geometry, categories }) {
  const preDate = geometry[0] && geometry[0].date;
  let date = toEventDateString(new Date(preDate));
  if (geometry.length < 2) {
    return date;
  }
  const category = categories.title || categories[0].title;
  const today = toEventDateString(util.now());
  // For storms that happened today, get previous date
  if (date === today && category === 'Severe Storms') {
    [date] = geometry[1].date.split('T');
  }
  return date;
}

/**
 * Validate whether an event and all it's points/polygons fall within
 * the provided projection's maxExtent
 *
 * @param {*} event
 * @param {*} proj
 * @returns
 */
export const validateGeometryCoords = (geometry, proj) => {
  const { coordinates, type } = geometry;
  const { crs, maxExtent } = proj;
  const passesFilter = (coords) => {
    const tCoords = transform(coords, CRS.GEOGRAPHIC, crs);
    return containsCoordinate(maxExtent, tCoords);
  };
  if (type === 'Point') {
    return passesFilter(coordinates);
  } if (type === 'Polygon') {
    return coordinates[0].every(passesFilter);
  }
};

import {
  find as lodashFind,
} from 'lodash';
import { transform } from 'ol/proj';
import { getCenter, boundingExtent, containsCoordinate } from 'ol/extent';
import moment from 'moment';
import util from '../../util/util';
import { LIMIT_EVENT_REQUEST_COUNT } from '../../modules/natural-events/constants';

export function getEventsRequestURL (baseUrl, startDate, endDate, categories = [], proj) {
  const params = {
    status: 'all',
    limit: LIMIT_EVENT_REQUEST_COUNT,
  };
  if (startDate && endDate) {
    params.start = moment.utc(startDate).format('YYYY-MM-DD');
    params.end = moment.utc(endDate).format('YYYY-MM-DD');
  }
  if (categories.length) {
    params.category = categories.map(({ id }) => id).join(',');
  }

  let [minLon, maxLat, maxLon, minLat] = [-180, 90, 180, -90];
  const { crs } = proj.selected;
  if (crs === 'EPSG:3413') {
    [minLon, maxLat, maxLon, minLat] = [-180, 50, 180, 90];
  }
  if (crs === 'EPSG:3031') {
    [minLon, maxLat, maxLon, minLat] = [-180, -90, 180, -50];
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

/**
 *
 * @param {*} events
 * @param {*} selected
 * @param {*} extent
 * @param {*} selectedProj
 * @param {*} showAll
 */
export function getEventsWithinExtent(
  events,
  selected,
  currentExtent,
  selectedProj,
) {
  const { maxExtent, crs } = selectedProj;
  const visibleListEvents = {};

  events.forEach((naturalEvent) => {
    const isSelectedEvent = selected.id === naturalEvent.id;
    let date = getDefaultEventDate(naturalEvent);
    if (selected && selected.date) {
      date = selected.date;
    }
    const geometry = lodashFind(
      naturalEvent.geometry,
      (geom) => geom.date.split('T')[0] === date,
    ) || naturalEvent.geometry[0];

    let { coordinates } = geometry;

    if (selectedProj.id !== 'geographic') {
      if (geometry.type === 'Polygon') {
        const coordinatesTransform = coordinates[0].map(
          (coordinate) => transform(coordinate, 'EPSG:4326', crs),
        );
        const geomExtent = boundingExtent(coordinatesTransform);
        coordinates = getCenter(geomExtent);
      } else {
        coordinates = transform(coordinates, 'EPSG:4326', crs);
      }
    } else if (geometry.type === 'Polygon') {
      const geomExtent = boundingExtent(geometry.coordinates[0]);
      coordinates = getCenter(geomExtent);
    }

    const visibleInProj = containsCoordinate(maxExtent, coordinates);
    const visibleInExtent = containsCoordinate(currentExtent, coordinates) && visibleInProj;

    if (visibleInExtent || (isSelectedEvent && visibleInProj)) {
      visibleListEvents[naturalEvent.id] = true;
    }
  });

  return visibleListEvents;
}

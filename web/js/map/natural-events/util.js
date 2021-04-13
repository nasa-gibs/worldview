import lodashFind from 'lodash/find';
import * as olProj from 'ol/proj';
import { getCenter, boundingExtent, containsCoordinate } from 'ol/extent';

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
 * @param {*} loadedEvents
 * @param {*} selected
 * @param {*} extent
 * @param {*} selectedProj
 * @param {*} showAll
 */
export function getEventsWithinExtent(
  loadedEvents,
  selected,
  extent,
  selectedProj,
) {
  const { maxExtent, crs } = selectedProj;
  const visibleListEvents = {};

  loadedEvents.forEach((naturalEvent) => {
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
          (coordinate) => olProj.transform(coordinate, 'EPSG:4326', crs),
        );
        const geomExtent = boundingExtent(coordinatesTransform);
        coordinates = getCenter(geomExtent);
      } else {
        coordinates = olProj.transform(coordinates, 'EPSG:4326', crs);
      }
    } else if (geometry.type === 'Polygon') {
      const geomExtent = boundingExtent(geometry.coordinates[0]);
      coordinates = getCenter(geomExtent);
    }

    // limit to maxExtent while allowing zoom and filter 'out of extent' events
    const coordsInProjExtent = containsCoordinate(maxExtent, coordinates);
    const isVisible = containsCoordinate(extent, coordinates) && coordsInProjExtent;

    if (isVisible || (isSelectedEvent && coordsInProjExtent)) {
      visibleListEvents[naturalEvent.id] = true;
    }
  });

  return visibleListEvents;
}

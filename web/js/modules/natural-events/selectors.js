import { find as lodashFind } from 'lodash';
import * as olProj from 'ol/proj';
import * as olExtent from 'ol/extent';

export function getEventsWithinExtent(
  loadedEvents,
  selected,
  extent,
  selectedProj,
  showAll,
) {
  const { maxExtent } = selectedProj;
  const visibleListEvents = {};

  loadedEvents.forEach((naturalEvent) => {
    const isSelectedEvent = selected.id === naturalEvent.id;
    let date = getDefaultEventDate(naturalEvent);
    if (selected && selected.date) {
      date = selected.date;
    }
    const geometry = lodashFind(naturalEvent.geometries, (geometry) => geometry.date.split('T')[0] === date) || naturalEvent.geometries[0];

    let { coordinates } = geometry;

    if (selectedProj.id !== 'geographic') {
      // check for polygon geometries for targeted projection coordinate transform
      if (geometry.type === 'Polygon') {
        const coordinatesTransform = coordinates[0].map((coordinate) => olProj.transform(coordinate, 'EPSG:4326', selectedProj.crs));
        const geomExtent = olExtent.boundingExtent(coordinatesTransform);
        coordinates = olExtent.getCenter(geomExtent);
      } else {
        // if normal geometries, transform given lon/lat array
        coordinates = olProj.transform(
          coordinates,
          'EPSG:4326',
          selectedProj.crs,
        );
      }
    } else if (geometry.type === 'Polygon') {
      const geomExtent = olExtent.boundingExtent(geometry.coordinates[0]);
      coordinates = olExtent.getCenter(geomExtent);
    }

    // limit to maxExtent while allowing zoom and filter 'out of extent' events
    const isVisible = olExtent.containsCoordinate(extent, coordinates)
      && olExtent.containsCoordinate(maxExtent, coordinates);

    if (isVisible) {
      visibleListEvents[naturalEvent.id] = true;
    } else if (
      // Keep selected in event list if within proj limits
      isSelectedEvent
      && olExtent.containsCoordinate(maxExtent, coordinates)
    ) {
      visibleListEvents[naturalEvent.id] = true;
    }
  });
  return visibleListEvents;
}
export function getDefaultEventDate(event) {
  let date = new Date(event.geometries[0].date).toISOString().split('T')[0];
  if (event.geometries.length < 2) return date;
  const category = event.categories.title || event.categories[0].title;
  const today = new Date().toISOString().split('T')[0];
  // For storms that happened today, get previous date
  if (date === today && category === 'Severe Storms') {
    date = new Date(event.geometries[1].date).toISOString().split('T')[0];
  }
  return date;
}

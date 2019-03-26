import { find as lodashFind, get as lodashGet } from 'lodash';
import * as olProj from 'ol/proj';
import * as olExtent from 'ol/extent';

export function getEventsWithinExtent(loadedEvents, selected, extent, state) {
  const selectedProj = lodashGet(state, 'proj.selected');
  var maxExtent = selectedProj.maxExtent;
  var visibleListEvents = {};

  loadedEvents.forEach(function(naturalEvent) {
    var isSelectedEvent = selected.id === naturalEvent.id;
    var date = getDefaultEventDate(naturalEvent);
    if (selected && selected.date) {
      date = selected.date;
    }
    var geometry =
      lodashFind(naturalEvent.geometries, function(geometry) {
        return geometry.date.split('T')[0] === date;
      }) || naturalEvent.geometries[0];

    var coordinates = geometry.coordinates;

    if (selectedProj.id !== 'geographic') {
      // check for polygon geometries for targeted projection coordinate transform
      if (geometry.type === 'Polygon') {
        let coordinatesTransform = coordinates[0].map(coordinate => {
          return olProj.transform(coordinate, 'EPSG:4326', selectedProj.crs);
        });
        let geomExtent = olExtent.boundingExtent(coordinatesTransform);
        coordinates = olExtent.getCenter(geomExtent);
      } else {
        // if normal geometries, transform given lon/lat array
        coordinates = olProj.transform(
          coordinates,
          'EPSG:4326',
          selectedProj.crs
        );
      }
    } else {
      if (geometry.type === 'Polygon') {
        let geomExtent = olExtent.boundingExtent(geometry.coordinates[0]);
        coordinates = olExtent.getCenter(geomExtent);
      }
    }

    // limit to maxExtent while allowing zoom and filter 'out of extent' events
    var isVisible =
      olExtent.containsCoordinate(extent, coordinates) &&
      olExtent.containsCoordinate(maxExtent, coordinates);

    if (isVisible || isSelectedEvent) {
      visibleListEvents[naturalEvent.id] = true;
    }
  });
  return visibleListEvents;
}
export function getDefaultEventDate(event) {
  var date = new Date(event.geometries[0].date).toISOString().split('T')[0];
  if (event.geometries.length < 2) return date;
  var category = event.categories.title || event.categories[0].title;
  var today = new Date().toISOString().split('T')[0];
  // For storms that happened today, get previous date
  if (date === today && category === 'Severe Storms') {
    date = new Date(event.geometries[1].date).toISOString().split('T')[0];
  }
  return date;
}

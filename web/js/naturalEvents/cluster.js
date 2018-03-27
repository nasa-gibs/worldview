import superCluster from 'supercluster';
import lodashRound from 'lodash/round';

export function naturalEventsPointToGeoJSON(id, coordinates, date) {
  return {
    type: 'Feature',
    properties: {
      id: id + '-' + date,
      date: date
    },
    geometry: {
      type: 'Point',
      coordinates: coordinates
    }
  };
}
export function naturalEventsGetClusterPoints(pointArray, zoomLevel) {
  var index = superCluster({
    radius: 80,
    maxZoom: 16
  });
  index.load(pointArray);
  console.log(zoomLevel);
  return index.getClusters([-180, -85, 180, 85], lodashRound(zoomLevel));
};
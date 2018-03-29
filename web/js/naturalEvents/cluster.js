import superCluster from 'supercluster';
import lodashRound from 'lodash/round';
import lodashEach from 'lodash/each';

const superClusterObj = superCluster({
  radius: 60,
  maxZoom: 16
});

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
};

export function naturalEventsGetClusterPoints(pointArray, zoomLevel) {
  superClusterObj.load(pointArray);
  return superClusterObj.getClusters([-180, -85, 180, 85], lodashRound(zoomLevel));
};

export function naturalEventsCalculateRange(clusterId) {
  var clusterPointArray = superClusterObj.getLeaves(clusterId, Infinity);
  console.log(clusterPointArray);
  // clusterPointArray
  // lodashEach(clusterPointArray, (point) => {

  // });
};

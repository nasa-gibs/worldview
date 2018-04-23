import superCluster from 'supercluster';
import lodashRound from 'lodash/round';

/**
 * Create superCLuster Object - Uses map and reduce
 * operations to create a timespan on each clustered
 * object
 *
 * @return {void}
 */
export function naturalEventsClusterCreateObject() {
  return superCluster({
    radius: 60, // pixel radius where points are clustered
    maxZoom: 16,
    initial: function() {
      return {
        startDate: null,
        endDate: null
      };
    },
    map: function(props) {
      return {
        startDate: props.date,
        endDate: props.date
      };
    },
    reduce: function(accumulated, properties) {
      var newDate = properties.startDate;
      var pastStartDate = accumulated.startDate;
      var pastEndDate = accumulated.endDate;
      if (!pastEndDate) {
        accumulated.startDate = newDate;
        accumulated.endDate = newDate;
      } else {
        accumulated.startDate = Date.parse(new Date(pastStartDate)) > Date.parse(new Date(newDate)) ? newDate : pastStartDate;
        accumulated.endDate = Date.parse(new Date(pastEndDate)) < Date.parse(new Date(newDate)) ? newDate : pastEndDate;
      }
    }

  });
};
/**
 * Create a geoJSON point out of a point
 *
 * @param  {String} id
 * @param  {Array} coordinates
 * @param  {String} date
 * @return {Object} geoJSON point
 */
export function naturalEventsClusterPointToGeoJSON(id, coordinates, date) {
  return {
    type: 'Feature',
    properties: {
      id: id + '-' + date,
      event_id: id,
      date: date
    },
    geometry: {
      type: 'Point',
      coordinates: coordinates
    }
  };
};
/**
 * @param  {Array}
 * @return {void}
 */
export function naturalEventsClusterSort(clusterArray) {
  let newArray = clusterArray.sort(function(a, b) {
    var firstDate = a.properties.date || a.properties.startDate;
    var secondDate = b.properties.date || b.properties.startDate;

    return new Date(secondDate) - new Date(firstDate);
  });
  return newArray;
};
/**
 * Load points given superCluster Object
 *
 * @param  {Object} superClusterObj
 * @param  {Array} pointArray
 * @param  {number} zoomLevel
 * @return {Object}
 */
export function naturalEventsClusterGetPoints(superClusterObj, pointArray, zoomLevel) {
  superClusterObj.load(pointArray);
  return superClusterObj.getClusters([-180, -90, 180, 90], lodashRound(zoomLevel));
};

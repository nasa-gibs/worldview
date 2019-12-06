import Supercluster from 'supercluster';
import lodashRound from 'lodash/round';

/**
 * Create Supercluster Object - Uses map and reduce
 * operations to create a timespan on each clustered
 * object
 *
 * @return {void}
 */
export const naturalEventsClusterCreateObject = () => {
  return new Supercluster({
    radius: 60, // pixel radius where points are clustered
    maxZoom: 12,
    map: (props) => ({ startDate: props.date, endDate: props.date }),
    reduce: (accumulated, properties) => {
      const newDate = properties.startDate;
      const pastStartDate = accumulated.startDate;
      const pastEndDate = accumulated.endDate;
      if (!pastEndDate) {
        accumulated.startDate = newDate;
        accumulated.endDate = newDate;
      } else {
        const newDateFormatted = new Date(newDate).getTime();
        accumulated.startDate =
          new Date(pastStartDate).getTime() > newDateFormatted
            ? newDate
            : pastStartDate;
        accumulated.endDate =
          new Date(pastEndDate).getTime() < newDateFormatted
            ? newDate
            : pastEndDate;
      }
    },
    setPolar: () => ({ radius: 30, maxZoom: 7 }),
    setGeo: () => ({ radius: 60, maxZoom: 12 })
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
export const naturalEventsClusterPointToGeoJSON = (id, coordinates, date) => {
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
export const naturalEventsClusterSort = (clusterArray) => {
  const newArray = clusterArray.sort((a, b) => {
    const firstDate = a.properties.date || a.properties.startDate;
    const secondDate = b.properties.date || b.properties.startDate;

    return new Date(secondDate) - new Date(firstDate);
  });
  return newArray;
};
/**
 * Load points given Supercluster Object
 *
 * @param  {Object} superClusterObj
 * @param  {Array} pointArray
 * @param  {number} zoomLevel
 * @return {Object}
 */
export const naturalEventsClusterGetPoints = (
  superClusterObj,
  pointArray,
  zoomLevel,
  extent
) => {
  superClusterObj.load(pointArray);
  return superClusterObj.getClusters(extent, lodashRound(zoomLevel));
};

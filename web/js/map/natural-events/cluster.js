import Supercluster from 'supercluster';
import lodashRound from 'lodash/round';
import { crossesDateLine, getOverDateLineCoordinates } from '../util';

/**
 * Create Supercluster Object - Uses map and reduce
 * operations to create a timespan on each clustered
 * object
 *
 * @return {void}
 */
export const naturalEventsClusterCreateObject = () => new Supercluster({
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
      accumulated.startDate = new Date(pastStartDate).getTime() > newDateFormatted
        ? newDate
        : pastStartDate;
      accumulated.endDate = new Date(pastEndDate).getTime() < newDateFormatted
        ? newDate
        : pastEndDate;
    }
  },
  setPolar: () => ({ radius: 30, maxZoom: 7 }),
  setGeo: () => ({ radius: 60, maxZoom: 12 }),
});

const firstClusterObj = naturalEventsClusterCreateObject(); // Cluster before selected event
const secondClusterObj = naturalEventsClusterCreateObject(); // Cluster after selected event

/**
 * Create a geoJSON point out of a point
 *
 * @param  {String} id
 * @param  {Array} coordinates
 * @param  {String} date
 * @return {Object} geoJSON point
 */
export const clusterPointToGeoJSON = (id, coordinates, date) => ({
  type: 'Feature',
  properties: {
    id: `${id}-${date}`,
    event_id: id,
    date,
  },
  geometry: {
    type: 'Point',
    coordinates,
  },
});

export const clusterSort = (clusterArray) => {
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
export const getClusterPoints = (superClusterObj, pointArray, zoomLevel, extent) => {
  superClusterObj.load(pointArray);
  return superClusterObj.getClusters(extent, lodashRound(zoomLevel));
};

export const getClusters = ({ geometry, id }, proj, selectedDate, map) => {
  const geoJSONPointsBeforeSelected = [];
  const geoJSONPointsAfterSelected = [];
  let selectedPoint;
  let afterSelected = false;
  const zoom = map.getView().getZoom();
  const extent = proj.selected.id === 'geographic'
    ? [-250, -90, 250, 90]
    : [-180, -90, 180, 90];

  const selectedCoords = geometry.find(({ date }) => date.split('T')[0] === selectedDate).coordinates;
  geometry.forEach((geom) => {
    let { coordinates } = geom;
    const date = geom.date.split('T')[0];
    const isSelected = selectedDate === date;
    const isOverDateline = proj.selected.id === 'geographic'
      ? crossesDateLine(selectedCoords, coordinates)
      : false;
    if (isOverDateline) {
      // replace coordinates
      coordinates = getOverDateLineCoordinates(coordinates);
    }
    // Cluster in three groups
    if (isSelected) {
      selectedPoint = clusterPointToGeoJSON(
        id,
        coordinates,
        date,
      );
      afterSelected = true;
    } else if (!afterSelected) {
      geoJSONPointsBeforeSelected.push(
        clusterPointToGeoJSON(id, coordinates, date),
      );
    } else {
      geoJSONPointsAfterSelected.push(
        clusterPointToGeoJSON(id, coordinates, date),
      );
    }
  });

  // set radius and maxZoom of superCluster object for polar vs geographic projections
  if (proj.selected.id !== 'geographic') {
    firstClusterObj.options.setPolar();
    secondClusterObj.options.setPolar();
  } else {
    firstClusterObj.options.setGeo();
    secondClusterObj.options.setGeo();
  }

  const clustersBeforeSelected = getClusterPoints(
    firstClusterObj,
    geoJSONPointsBeforeSelected,
    zoom,
    extent,
  );
  const clustersAfterSelected = getClusterPoints(
    secondClusterObj,
    geoJSONPointsAfterSelected,
    zoom,
    extent,
  );
  let clusters = clustersBeforeSelected.concat(
    [selectedPoint],
    clustersAfterSelected,
  );
  clusters = clusterSort(clusters);

  return {
    clusters,
    firstClusterObj,
    secondClusterObj,
  };
};

import OlOverlay from 'ol/Overlay';
import OlLayerVector from 'ol/layer/Vector';
import OlSourceVector from 'ol/source/Vector';
import OlStyleStroke from 'ol/style/Stroke';
import OlStyleStyle from 'ol/style/Style';
import * as olProj from 'ol/proj';
import { mapUtilZoomAction } from '../util';
import { formatDisplayDate } from '../../modules/date/util';

/**
* Create event point
*
* @param  {Object} clusterPoint
* @param  {Boolean} isSelected
* @param  {Function} callback
* @return {Object} Openlayers overlay object
*/
export const getTrackPoint = function(
  proj,
  clusterPoint,
  isSelected,
  map,
  callback,
) {
  const overlayEl = document.createElement('div');
  const circleEl = document.createElement('div');
  const textEl = document.createElement('span');
  const { properties } = clusterPoint;
  const content = document.createTextNode(formatDisplayDate(properties.date));
  const { date } = properties;
  const eventID = properties.event_id;
  let { coordinates } = clusterPoint.geometry;
  if (proj.selected.id !== 'geographic') {
    coordinates = olProj.transform(coordinates, 'EPSG:4326', proj.selected.crs);
  }
  overlayEl.className = isSelected
    ? 'track-marker-case track-marker-case-selected'
    : 'track-marker-case';
  overlayEl.dataset.id = eventID;
  overlayEl.id = `track-marker-case-${date}`;
  overlayEl.onclick = function() {
    callback(eventID, date);
  };
  textEl.appendChild(content);
  textEl.className = 'track-marker-date';
  circleEl.className = `track-marker track-marker-${date}`;
  circleEl.id = `track-marker-${date}`;
  overlayEl.appendChild(circleEl);
  overlayEl.appendChild(textEl);

  return new OlOverlay({
    position: coordinates,
    positioning: 'center-center',
    element: overlayEl,
    stopEvent: false,
    id: eventID + date.toString(),
  });
};

/**
 * Create vector layer
 *
 * @param  {Array} featuresArray Array of linstring points
 * @return {Object} OpenLayers Vector Layer
 */
export const getTrack = function(proj, features) {
  const extentWithWings = [-250, -90, 250, 90];
  const extent = proj.selected.id === 'geographic'
    ? extentWithWings
    : proj.selected.maxExtent;

  const getLineStyle = function(color, width) {
    return new OlStyleStyle({
      stroke: new OlStyleStroke({ color, width }),
    });
  };
  return new OlLayerVector({
    source: new OlSourceVector({ features }),
    extent,
    style: [getLineStyle('black', 2), getLineStyle('white', 1)],
  });
};



/**
 * Create rotated element that displays arrows between points
 * as repeated css background image
 *
 * @param  {Array} lineSegmentCoords Start and end points of
 *                  line in Lat/long
 * @param  {Object} map OpenLayers map Object
 * @return {Object} Openlayers overlay Object
 */
export const getArrows = function(lineSegmentCoords, map) {
  const currentRotation = map.getView().getRotation();
  const overlayEl = document.createElement('div');
  const innerEl = document.createElement('div');

  const clusterPadding = 20; // 10px on each side
  const end = lineSegmentCoords[0];
  const start = lineSegmentCoords[1];
  const dxCoord = end[0] - start[0];
  const dyCoord = end[1] - start[1];
  const pixel1 = map.getPixelFromCoordinate(start);
  const pixel2 = map.getPixelFromCoordinate(end);
  const dx = pixel2[0] - pixel1[0];
  const dy = pixel2[1] - pixel1[1];
  const pixelMidPoint = [0.5 * dx + pixel1[0], 0.5 * dy + pixel1[1]];
  const distanceInPixels = Math.sqrt((dx ** 2) + (dy ** 2));
  const angleRadians = Math.atan2(dyCoord, dxCoord) - currentRotation;
  const angleDegrees = -angleRadians * (180 / Math.PI);
  const lengthOfArrowDiv = distanceInPixels - clusterPadding;

  innerEl.className = 'event-track-arrows';
  overlayEl.appendChild(innerEl);
  overlayEl.style.width = '1px';
  overlayEl.style.height = '1px';
  innerEl.style.width = `${lengthOfArrowDiv}px`;
  innerEl.style.height = '16px';
  innerEl.style.transform = `translate(${-(lengthOfArrowDiv / 2)}px, -8px)`;
  overlayEl.style.transform = `rotate(${angleDegrees}deg)`;
  return new OlOverlay({
    position: map.getCoordinateFromPixel(pixelMidPoint),
    positioning: 'center-center',
    stopEvent: true,
    element: overlayEl,
    id: `arrow${pixelMidPoint[0].toString()}${pixelMidPoint[1].toString()}`,
  });
};

/**
 * Create cluster point
 *
 * @param  {Object} clusterPoint
 * @param  {Object} map Openlayers map object
 * @param  {Object} pointClusterObj supercluster object
 * @param  {Function} callback
 * @return {Object} Openlayers overlay object
 */
export const getClusterPointEl = function (proj, cluster, map, pointClusterObj) {
  const overlayEl = document.createElement('div');
  const circleEl = document.createElement('div');
  const innerCircleEl = document.createElement('div');

  const textEl = document.createElement('span');
  const { properties } = cluster;
  const clusterId = properties.cluster_id;
  const number = properties.point_count_abbreviated;
  const numberEl = document.createTextNode(number);
  const dateRangeTextEl = document.createTextNode(
    `${formatDisplayDate(properties.startDate)} to ${formatDisplayDate(properties.endDate)}`,
  );
  let { coordinates } = cluster.geometry;
  const mapView = map.getView();
  if (proj.selected.id !== 'geographic') {
    coordinates = olProj.transform(coordinates, 'EPSG:4326', proj.selected.crs);
  }
  const sizeClass = number < 10 ? 'small' : number < 20 ? 'medium' : 'large';

  overlayEl.className = 'cluster-track-marker-case track-marker-case';
  textEl.className = 'cluster-track-marker-date track-marker-date';
  textEl.appendChild(dateRangeTextEl);
  circleEl.className = `cluster-marker cluster-marker-${sizeClass}`;
  innerCircleEl.className = 'cluster-marker-inner';
  innerCircleEl.appendChild(numberEl);
  circleEl.appendChild(innerCircleEl);
  circleEl.onclick = () => {
    const zoomTo = pointClusterObj.getClusterExpansionZoom(clusterId);
    const mapZoom = mapView.getZoom();
    mapUtilZoomAction(map, zoomTo - mapZoom, 450, coordinates);
  };
  overlayEl.appendChild(circleEl);
  overlayEl.appendChild(textEl);

  return new OlOverlay({
    position: coordinates,
    positioning: 'center-center',
    element: overlayEl,
    stopEvent: false,
    id: clusterId + properties.startDate + properties.endDate,
  });
};

import OlOverlay from 'ol/Overlay';
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
export const getTrackPoint = function(proj, clusterPoint, isSelected, callback) {
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
 * Create rotated element that displays arrows between points
 * as repeated css background image
 *
 * @param  {Array} lineSegmentCoords Start and end points of line in Lat/long
 * @param  {Object} map OpenLayers map Object
 * @return {Object} Openlayers overlay Object
 */
export const getArrows = function(lineSegmentCoords, map) {
  const currentRotation = map.getView().getRotation();
  const overlayEl = document.createElement('div');
  const arrowEl = document.createElement('div');

  const clusterPadding = 20; // 10px on each side
  const end = lineSegmentCoords[0];
  const start = lineSegmentCoords[1];
  const dxCoord = end[0] - start[0];
  const dyCoord = end[1] - start[1];
  const pixelStart = map.getPixelFromCoordinate(start);
  const pixelEnd = map.getPixelFromCoordinate(end);
  const dx = pixelEnd[0] - pixelStart[0];
  const dy = pixelEnd[1] - pixelStart[1];
  const pixelMidPoint = [0.5 * dx + pixelStart[0], 0.5 * dy + pixelStart[1]];
  const distanceInPixels = Math.sqrt((dx ** 2) + (dy ** 2));
  const angleRadians = Math.atan2(dyCoord, dxCoord) - currentRotation;
  const angleDegrees = -angleRadians * (180 / Math.PI);
  const lengthOfArrowDiv = distanceInPixels - clusterPadding;

  arrowEl.className = 'event-track-arrows';
  arrowEl.style.width = `${lengthOfArrowDiv}px`;
  arrowEl.style.height = '16px';
  arrowEl.style.transform = `translate(${-(lengthOfArrowDiv / 2)}px, -8px)`;

  overlayEl.appendChild(arrowEl);
  overlayEl.style.width = '1px';
  overlayEl.style.height = '1px';
  overlayEl.style.transform = `rotate(${angleDegrees}deg)`;

  return new OlOverlay({
    position: map.getCoordinateFromPixel(pixelMidPoint),
    positioning: 'center-center',
    stopEvent: true,
    element: overlayEl,
    id: `arrow${pixelMidPoint[0].toString()}${pixelMidPoint[1].toString()}`,
  });
};

export const getTrackLines = function(map, trackCoords) {
  const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const lineEl = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  let lineString = '';
  const first = trackCoords[0][0];
  const last = trackCoords[trackCoords.length - 1][0];
  const bottomLeft = [first[0], first[1]];
  const topRight = [last[0], last[1]];

  trackCoords.forEach(([[x1, y1], [x2, y2]]) => {
    bottomLeft[0] = Math.min(x1, x2, bottomLeft[0]);
    bottomLeft[1] = Math.min(y1, y2, bottomLeft[1]);
    topRight[0] = Math.max(x1, x2, topRight[0]);
    topRight[1] = Math.max(y1, y2, topRight[1]);
  });
  const pixelBottomLeft = map.getPixelFromCoordinate(bottomLeft);
  const pixelTopRight = map.getPixelFromCoordinate(topRight);

  const [minX, maxY] = pixelBottomLeft;
  const [maxX, minY] = pixelTopRight;
  const height = Math.abs(maxY - minY);
  const width = Math.abs(maxX - minX);
  const rotation = Number(map.getView().getRotation() * (180 / Math.PI)).toFixed();

  svgEl.setAttribute('height', height);
  svgEl.setAttribute('width', width);
  svgEl.style.height = `${height}px`;
  svgEl.style.width = `${width}px`;
  svgEl.style.backgroundColor = 'rgba(255, 0, 0, 0.15)';
  svgEl.style.display = 'inline-block';
  svgEl.style.transform = `rotate(${rotation}deg)`;
  svgEl.appendChild(lineEl);

  trackCoords.forEach(([start, end], index) => {
    const [x1, y1] = map.getPixelFromCoordinate(start);
    const [x2, y2] = map.getPixelFromCoordinate(end);
    const newStart = `${x1 - minX},${y1 - minY}`;
    const newEnd = `${x2 - minX},${y2 - minY}`;
    lineString += index === 0 ? `${newStart} ${newEnd} ` : `${newEnd} `;
  });

  lineEl.style.fill = 'transparent';
  lineEl.style.stroke = 'black';
  lineEl.style.strokeWidth = '1px';
  lineEl.style.display = 'inline-block';
  lineEl.setAttribute('points', lineString);

  return new OlOverlay({
    position: bottomLeft,
    positioning: 'bottom-left',
    insertFirst: true,
    stopEvent: false,
    element: svgEl,
    id: 'event-track',
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

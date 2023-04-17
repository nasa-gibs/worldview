import OlOverlay from 'ol/Overlay';
import * as olProj from 'ol/proj';
import { mapUtilZoomAction } from '../util';
import { formatDisplayDate } from '../../modules/date/util';
import { CRS } from '../../modules/map/constants';

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
  const { properties, geometry } = clusterPoint;
  const content = document.createTextNode(formatDisplayDate(properties.date));

  const { magnitudeValue, magnitudeUnit } = geometry;
  const magnitudeContent = document.createElement('div');
  const hasMagnitude = magnitudeUnit && magnitudeValue;
  if (hasMagnitude) {
    const superscriptUnit = document.createElement('sup');
    superscriptUnit.append('2');
    const formattedMagnitudeUnit = magnitudeUnit === 'kts' ? ' kts' : ' NM';
    magnitudeContent.append(magnitudeValue.toLocaleString());
    magnitudeContent.append(formattedMagnitudeUnit);
    if (formattedMagnitudeUnit === ' NM') magnitudeContent.append(superscriptUnit);
  }

  const { date } = properties;
  const eventID = properties.event_id;
  let { coordinates } = clusterPoint.geometry;
  if (proj.selected.id !== 'geographic') {
    coordinates = olProj.transform(coordinates, CRS.GEOGRAPHIC, proj.selected.crs);
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
  textEl.appendChild(magnitudeContent);
  textEl.className = 'track-marker-date';
  if (!isSelected) {
    textEl.style.top = hasMagnitude ? '-40px' : '-28px';
  }
  circleEl.className = `track-marker track-marker-${date}`;
  circleEl.id = `track-marker-${date}`;
  overlayEl.appendChild(circleEl);
  overlayEl.appendChild(textEl);

  return new OlOverlay({
    className: 'event-track-point',
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

  const clusterPadding = 30; // 10px on each side
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
  const outlineEl = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  let lineString = '';
  const pixelCoords = trackCoords.map(([start, end]) => [
    map.getPixelFromCoordinate(end),
    map.getPixelFromCoordinate(start),
  ]);
  if (!pixelCoords.length) return;
  const first = pixelCoords[0][0];
  const last = pixelCoords[pixelCoords.length - 1][0];
  const topLeft = [first[0], first[1]];
  const bottomRight = [last[0], last[1]];

  pixelCoords.forEach(([[x1, y1], [x2, y2]]) => {
    topLeft[0] = Math.min(x1, x2, topLeft[0]);
    topLeft[1] = Math.min(y1, y2, topLeft[1]);
    bottomRight[0] = Math.max(x1, x2, bottomRight[0]);
    bottomRight[1] = Math.max(y1, y2, bottomRight[1]);
  });

  const [minX, minY] = topLeft;
  const [maxX, maxY] = bottomRight;
  const height = Math.abs(maxY - minY);
  const width = Math.abs(maxX - minX);

  svgEl.style.height = `${height + 5}px`;
  svgEl.style.width = `${width + 5}px`;
  svgEl.setAttribute('height', height.toFixed(0));
  svgEl.setAttribute('width', width.toFixed(0));
  svgEl.appendChild(outlineEl);
  svgEl.appendChild(lineEl);

  pixelCoords.forEach(([[x1, y1], [x2, y2]], index) => {
    const newEnd = `${(x1 - minX).toFixed(0)},${(y1 - minY).toFixed(0)}`;
    const newStart = `${(x2 - minX).toFixed(0)},${(y2 - minY).toFixed(0)}`;
    lineString += `${newStart} ${newEnd} `;
  });

  lineEl.style.fill = 'transparent';
  lineEl.style.stroke = 'white';
  lineEl.style.strokeWidth = '1px';
  lineEl.setAttribute('points', lineString);

  outlineEl.style.fill = 'transparent';
  outlineEl.style.stroke = 'rgba(0,0,0,0.5)';
  outlineEl.style.strokeWidth = '3px';
  outlineEl.setAttribute('points', lineString);

  return new OlOverlay({
    className: 'event-track-line',
    position: map.getCoordinateFromPixel(topLeft),
    positioning: 'top-left',
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
    coordinates = olProj.transform(coordinates, CRS.GEOGRAPHIC, proj.selected.crs);
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
    className: 'event-track-cluster-point',
    position: coordinates,
    positioning: 'center-center',
    element: overlayEl,
    stopEvent: false,
    id: clusterId + properties.startDate + properties.endDate,
  });
};

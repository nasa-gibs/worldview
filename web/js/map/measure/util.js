import { MultiLineString, Polygon } from 'ol/geom';
import { getArea, getLength } from 'ol/sphere';
import arc from 'arc';

const equatorialRadiusMeters = 6378137;
const referenceProjection = 'EPSG:4326';
const metersPerkilometer = 1000;
const ftPerMile = 5280;
const sqFtPerSqMile = 27878400;
const sqMeterPerKilometer = 1000000;
const metersToFeet = (meters) => meters * 3.28084;
const squareMetersToFeet = (sqMeters) => sqMeters * 10.76391;
const toRadians = (degrees) => degrees * (Math.PI / 180);

const getArcLine = (p1, p2) => {
// The number of additional coordinate points to add to a LineString when
// converting it to conform to a great circle arc.
  const arcLineResolution = 50;
  const start = { x: p1[0], y: p1[1] };
  const end = { x: p2[0], y: p2[1] };
  const arcGen = new arc.GreatCircle(start, end);
  return arcGen.Arc(arcLineResolution, { offset: 10 });
};

/**
 * Transforms a LineString of two points to a MultiLineString of multiple points
 * applying a great circle arc transformation
 * @param {*} geom - the geometry object to apply great circle arc transformation to
 */
export function transformLineStringArc (geom, projection) {
  const coords = [];
  const transformedGeom = geom.clone().transform(projection, referenceProjection);

  transformedGeom.forEachSegment((segStart, segEnd) => {
    getArcLine(segStart, segEnd).geometries.forEach((arcGeom) => {
      coords.push(arcGeom.coords);
    });
  });
  return new MultiLineString(coords).transform(referenceProjection, projection);
};

/**
 * Transforms a Polygon into one with addiitonal points on each edge to account for
 * great circle arc
 * @param {*} geom - the geometry object to apply great circle arc transformation to
 */
export function transformPolygonArc (geom, projection) {
  let coords = [];
  const transformedGeom = geom.clone().transform(projection, referenceProjection);
  const polyCoords = transformedGeom.getCoordinates()[0];
  for (let i = 0; i < polyCoords.length - 1; i++) {
    const arcLine = getArcLine(polyCoords[i], polyCoords[i + 1]);
    arcLine.geometries.forEach((arcGeom) => {
      coords = coords.concat(arcGeom.coords);
    });
  }
  return new Polygon([coords]).transform(referenceProjection, projection);
};

/**
   *
   * @param {*} line
   * @return {String} - The formatted distance measurement
   */
export function getFormattedLength(line, projection, unitOfMeasure, useGreatCircle) {
  const metricLength = useGreatCircle
    ? getLength(line, { projection })
    : getRhumbLineDistance(line);

  if (unitOfMeasure === 'km') {
    return metricLength > 100
      ? `${roundAndLocale(metricLength, metersPerkilometer)} km`
      : `${roundAndLocale(metricLength)} m`;
  }
  if (unitOfMeasure === 'mi') {
    const imperialLength = metersToFeet(metricLength);
    return imperialLength > (ftPerMile / 4)
      ? `${roundAndLocale(imperialLength, ftPerMile)} mi`
      : `${roundAndLocale(imperialLength)} ft`;
  }
};

/**
   *
   * @param {*} polygon
   * @return {String} - The formatted area measurement
   */
export function getFormattedArea(polygon, projection, unitOfMeasure, useGreatCircle) {
  const metricArea = useGreatCircle
    ? getArea(polygon, { projection })
    : getRhumbLineArea(polygon);

  if (unitOfMeasure === 'km') {
    return metricArea > 10000
      ? `${roundAndLocale(metricArea, sqMeterPerKilometer)} km<sup>2</sup>`
      : `${roundAndLocale(metricArea)} m<sup>2</sup>`;
  }
  if (unitOfMeasure === 'mi') {
    const imperialArea = squareMetersToFeet(metricArea);
    return imperialArea > (sqFtPerSqMile / 8)
      ? `${roundAndLocale(imperialArea, sqFtPerSqMile)} mi<sup>2</sup>`
      : `${roundAndLocale(imperialArea)} ft<sup>2</sup>`;
  }
};

/**
 *
 */
export function getRhumbLineDistance(lineString) {
  const c1 = lineString.getFirstCoordinate();
  const c2 = lineString.getLastCoordinate();
  const lat1 = toRadians(c1[1]);
  const lat2 = toRadians(c2[1]);
  const dLat = lat2 - lat1;
  const dPsi = Math.log(Math.tan(Math.PI / 4 + lat2 / 2) / Math.tan(Math.PI / 4 + lat1 / 2));
  let dLon = toRadians(c2[0] - c1[0]);
  // E-W course becomes ill-conditioned with 0/0
  const q = Math.abs(dPsi) > 10e-12 ? dLat / dPsi : Math.cos(lat1);
  // if dLon over 180 degrees take shorter rhumb across anti-meridian:
  if (Math.abs(dLon) > Math.PI) {
    dLon = dLon > 0 ? -(2 * Math.PI - dLon) : (2 * Math.PI + dLon);
  }
  return Math.sqrt(dLat * dLat + q * q * dLon * dLon) * equatorialRadiusMeters;
};

export function getRhumbLineArea(polygon) {
  return 10000000;
}

/**
 * Convert and format raw measurements to two decimal points
 * @param {*} measurement
 * @param {*} factor
 * @return {String} - The measurement, converted based on factor and locale
 */
export function roundAndLocale (measurement, factor) {
  factor = factor || 1;
  return (Math.round(measurement / factor * 100) / 100).toLocaleString();
};

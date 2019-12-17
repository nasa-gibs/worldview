import {
  MultiLineString as OlGeomMultiLineString,
  Polygon as OlGeomPolygon
} from 'ol/geom';
import geographiclib from 'geographiclib';

const geod = geographiclib.Geodesic.WGS84;
const geographicProj = 'EPSG:4326';
const metersPerKilometer = 1000;
const ftPerMile = 5280;
const sqFtPerSqMile = 27878400;
const sqMeterPerKilometer = 1000000;
const metersToFeet = (meters) => meters * 3.28084;
const squareMetersToFeet = (sqMeters) => sqMeters * 10.76391;

/**
 * Transforms a LineString of two points to a MultiLineString of multiple points
 * applying a great circle arc transformation
 * @param {*} geom - the geometry object to apply great circle arc transformation to
 */
export function transformLineStringArc(geom, projection) {
  const coords = [];
  const distance = 10000; // meters between segments
  const transformedGeom = geom.clone().transform(projection, geographicProj);
  transformedGeom.forEachSegment((segStart, segEnd) => {
    const line = geod.InverseLine(segStart[1], segStart[0], segEnd[1], segEnd[0]);
    const n = Math.ceil(line.s13 / distance);
    for (let i = 0; i <= n; ++i) {
      const s = Math.min(distance * i, line.s13);
      const r = line.Position(s, geographiclib.Geodesic.LONG_UNROLL);
      coords.push([r.lon2, r.lat2]);
    }
  });
  return new OlGeomMultiLineString([coords]).transform(geographicProj, projection);
};

/**
 * Transforms a Polygon into one with addiitonal points on each edge to account for
 * great circle arc
 * @param {*} geom - the geometry object to apply great circle arc transformation to
 */
export function transformPolygonArc(geom, projection) {
  const coords = [];
  const transformedGeom = geom.clone().transform(projection, geographicProj);
  const distance = 10000; // meters between segments
  const polyCoords = transformedGeom.getCoordinates()[0];
  for (let i = 0; i < polyCoords.length - 1; i++) {
    const line = geod.InverseLine(
      polyCoords[i][1],
      polyCoords[i][0],
      polyCoords[i + 1][1],
      polyCoords[i + 1][0]
    );
    const n = Math.ceil(line.s13 / distance);
    for (let j = 0; j <= n; ++j) {
      const s = Math.min(distance * j, line.s13);
      const r = line.Position(s, geographiclib.Geodesic.LONG_UNROLL);
      coords.push([r.lon2, r.lat2]);
    }
  };
  return new OlGeomPolygon([coords]).transform(geographicProj, projection);
};

/**
   *
   * @param {*} line
   * @return {String} - The formatted distance measurement
   */
export function getFormattedLength(line, projection, unitOfMeasure) {
  const transformedLine = line.clone().transform(projection, geographicProj);
  const metricLength = getGeographicLibDistance(transformedLine);
  if (unitOfMeasure === 'km') {
    return metricLength > 100
      ? `${roundAndLocale(metricLength, metersPerKilometer)} km`
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
export function getFormattedArea(polygon, projection, unitOfMeasure) {
  const transformedPoly = polygon.clone().transform(projection, geographicProj);
  const metricArea = getGeographicLibArea(transformedPoly);
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
 * Calculate area of a polygon with GeographicLib library
 * @param {*} polygon
 * @returns {Number} - area in square meters
 */
export function getGeographicLibArea(polygon) {
  const coordinates = polygon.getCoordinates()[0];
  if (coordinates.length < 3) return 0;
  const geoPoly = geod.Polygon(false);
  coordinates.forEach(coord => {
    // flip lat/lon position
    geoPoly.AddPoint(coord[1], coord[0]);
  });
  const { area } = geoPoly.Compute(false, true);
  return Math.abs(area);
}

/**
 * Calculate distance of a line with GeographicLib library
 * @param {*} polygon
 * @returns {Number} - distance in meters
 */
export function getGeographicLibDistance(line) {
  let totalDistance = 0;
  line.forEachSegment((segStart, segEnd) => {
    const r = geod.Inverse(segStart[1], segStart[0], segEnd[1], segEnd[0]);
    totalDistance += r.s12;
  });
  return totalDistance;
}

/**
 * Convert and format raw measurements to two decimal points
 * @param {*} measurement
 * @param {*} factor
 * @return {String} - The measurement, converted based on factor and locale
 */
export function roundAndLocale(measurement, factor) {
  factor = factor || 1;
  return (Math.round(measurement / factor * 100) / 100).toLocaleString();
};

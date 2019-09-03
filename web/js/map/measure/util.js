import { MultiLineString, Polygon } from 'ol/geom';
import arc from 'arc';

const equatorialRadiusMeters = 6378137;
const referenceProjection = 'EPSG:4326';
const toRadians = (degrees) => degrees * (Math.PI / 180);

export const metersPerkilometer = 1000;
export const ftPerMile = 5280;
export const metersToFeet = (meters) => meters * 3.28084;
export const squareMetersToFeet = (sqMeters) => sqMeters * 10.76391;

/**
   * Transforms a LineString of two points to a MultiLineString of multiple points
   * applying a great circle arc transformation
   * @param {*} geom - the geometry object to apply great circle arc transformation to
   */
export function transformLineStringArc (geom, projection) {
  const coords = [];
  const transformedGeom = geom.clone().transform(projection, referenceProjection);
  transformedGeom.forEachSegment((segStart, segEnd) => {
    const start = {
      x: segStart[0],
      y: segStart[1]
    };
    const end = {
      x: segEnd[0],
      y: segEnd[1]
    };
    const arcGen = new arc.GreatCircle(start, end);
    const arcline = arcGen.Arc(25, { offset: 10 });
    arcline.geometries.forEach((arcGeom) => {
      coords.push(arcGeom.coords);
    });
  });
  return new MultiLineString(coords).transform(referenceProjection, projection);
};

/**
   * Transforms a Polygon to one with addiitonal points on each edge to account for
   * great circle arc
   * @param {*} geom - the geometry object to apply great circle arc transformation to
   */
export function transformPolygonArc (geom, projection) {
  let coords = [];
  const transformedGeom = geom.clone().transform(projection, referenceProjection);
  const polyCoords = transformedGeom.getCoordinates()[0];
  for (let i = 0; i < polyCoords.length - 1; i++) {
    const start = {
      x: polyCoords[i][0],
      y: polyCoords[i][1]
    };
    const end = {
      x: polyCoords[i + 1][0],
      y: polyCoords[i + 1][1]
    };
    const arcGen = new arc.GreatCircle(start, end);
    const arcline = arcGen.Arc(25, { offset: 10 });
    arcline.geometries.forEach((arcGeom) => {
      coords = coords.concat(arcGeom.coords);
    });
  }
  return new Polygon([coords]).transform(referenceProjection, projection);
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

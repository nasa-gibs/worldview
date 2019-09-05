import { MultiLineString as OlGeomMultiLineString, Polygon as OlGeomPolygon } from 'ol/geom';
import { getArea as OlSphereGetArea, getLength as OlSphereGetLength } from 'ol/sphere';
import {
  area as TurfArea,
  polygon as TurfPolygon,
  rhumbDistance as TurfRhumbDistance,
  point as TurfPoint
} from '@turf/turf';
import arc from 'arc';

const referenceProjection = 'EPSG:4326';
const metersPerKilometer = 1000;
const ftPerMile = 5280;
const sqFtPerSqMile = 27878400;
const sqMeterPerKilometer = 1000000;
const metersToFeet = (meters) => meters * 3.28084;
const squareMetersToFeet = (sqMeters) => sqMeters * 10.76391;

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
  return new OlGeomMultiLineString(coords).transform(referenceProjection, projection);
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
  return new OlGeomPolygon([coords]).transform(referenceProjection, projection);
};

/**
   *
   * @param {*} line
   * @return {String} - The formatted distance measurement
   */
export function getFormattedLength(line, projection, unitOfMeasure, useGreatCircle) {
  const metricLength = useGreatCircle
    ? OlSphereGetLength(line, { projection })
    : getRhumbLineDistance(line, projection);

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
export function getFormattedArea(polygon, projection, unitOfMeasure, useGreatCircle) {
  const metricArea = useGreatCircle
    ? OlSphereGetArea(polygon, { projection })
    : getRhumbLineArea(polygon, projection);

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
export function getRhumbLineDistance(lineString, projection) {
  let transformedLine = lineString;
  if (projection !== referenceProjection) {
    transformedLine = lineString.clone().transform(projection, referenceProjection);
  }
  const p1 = TurfPoint(transformedLine.getFirstCoordinate());
  const p2 = TurfPoint(transformedLine.getLastCoordinate());
  return TurfRhumbDistance(p1, p2) * metersPerKilometer;
};

/**
 *
 */
export function getRhumbLineArea(polygon, projection) {
  let transformedPoly = polygon;
  if (projection !== referenceProjection) {
    transformedPoly = polygon.clone().transform(projection, referenceProjection);
  }
  const coords = polygon.getCoordinates()[0];
  if (coords.length < 4) {
    return 0;
  }
  const poly = TurfPolygon(transformedPoly.getCoordinates());
  return TurfArea(poly);
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

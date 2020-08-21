import {
  MultiLineString as OlGeomMultiLineString,
  Polygon as OlGeomPolygon,
} from 'ol/geom';
import geographiclib from 'geographiclib';
import shpWrite from 'shp-write';
import FileSaver from 'file-saver';

const geod = geographiclib.Geodesic.WGS84;
const geographicProj = 'EPSG:4326';

/**
 * Shift x value of every coord except the last,
 * which is the active drawing point
 * @param {*} coords
 * @param {*} shiftValue
 */
function shiftXCoords (coords, shiftValue) {
  const newCoordsArray = [];
  const len = coords.length;
  for (let i = 0; i < len - 1; i += 1) {
    const [x, y] = coords[i];
    newCoordsArray.push([x + shiftValue, y]);
  }
  newCoordsArray.push(coords[len - 1]);
  return newCoordsArray;
}

/**
 * If the last two coordinates in a measurement are more than 180
 * degrees apart, flip the whole drawing forward or backward 360 degrees
 * @param {*} geom
 */
function checkForXFlip(geom, projection) {
  const coords = geom.getCoordinates();
  const [x1] = coords[coords.length - 2];
  const [x2] = coords[coords.length - 1];
  if (Math.abs(x1 - x2) > 180 && projection === geographicProj) {
    if (x1 < x2) {
      geom.setCoordinates(shiftXCoords(coords, 360));
    } else if (x1 > x2) {
      geom.setCoordinates(shiftXCoords(coords, -360));
    }
  }
  return geom;
}

/**
 * Transforms a LineString of two points to a MultiLineString of multiple points
 * applying a great circle arc transformation
 * @param {*} geom - the geometry object to apply great circle arc transformation to
 */
export function transformLineStringArc(geom, projection) {
  const coords = [];
  const distance = 50000; // meters between segments
  const transformedGeom = checkForXFlip(geom, projection).clone().transform(projection, geographicProj);
  transformedGeom.forEachSegment((segStart, segEnd) => {
    const line = geod.InverseLine(segStart[1], segStart[0], segEnd[1], segEnd[0]);
    const n = Math.ceil(line.s13 / distance);
    for (let i = 0; i <= n; i += 1) {
      const s = Math.min(distance * i, line.s13);
      const r = line.Position(s, geographiclib.Geodesic.LONG_UNROLL);
      coords.push([r.lon2, r.lat2]);
    }
  });
  return new OlGeomMultiLineString([coords]).transform(geographicProj, projection);
}

/**
 * Transforms a Polygon into one with addiitonal points on each edge to account for
 * great circle arc
 * @param {*} geom - the geometry object to apply great circle arc transformation to
 */
export function transformPolygonArc(geom, projection) {
  const coords = [];
  const transformedGeom = geom.clone().transform(projection, geographicProj);
  const distance = 50000; // meters between segments
  const polyCoords = transformedGeom.getCoordinates()[0];
  for (let i = 0; i < polyCoords.length - 1; i += 1) {
    const line = geod.InverseLine(
      polyCoords[i][1],
      polyCoords[i][0],
      polyCoords[i + 1][1],
      polyCoords[i + 1][0],
    );
    const n = Math.ceil(line.s13 / distance);
    for (let j = 0; j <= n; j += 1) {
      const s = Math.min(distance * j, line.s13);
      const r = line.Position(s, geographiclib.Geodesic.LONG_UNROLL);
      coords.push([r.lon2, r.lat2]);
    }
  }
  return new OlGeomPolygon([coords]).transform(geographicProj, projection);
}

/**
 * Calculate area of a polygon with GeographicLib library
 * @param {*} polygon
 * @returns {Number} - area in square meters
 */
export function getGeographicLibArea(polygon) {
  const coordinates = polygon.getCoordinates()[0];
  if (coordinates.length < 3) return 0;
  const geoPoly = geod.Polygon(false);
  coordinates.forEach((coord) => {
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

function getFeatureJSON(measurements, crs) {
  return {
    type: 'FeatureCollection',
    features: Object.values(measurements).map(({ feature, overlay }, index) => {
      const geom = feature.getGeometry();
      const isPolygon = geom.getType() === 'Polygon';
      const transformFn = isPolygon
        ? transformPolygonArc
        : transformLineStringArc;
      const transformedGeom = transformFn(geom, crs);
      const coordinates = isPolygon
        ? transformedGeom.getCoordinates()
        : transformedGeom.getCoordinates()[0];

      if (isPolygon) {
        debugger;
        coordinates[0].push(coordinates[0][0]);
      }

      const [size, units] = overlay.element.innerText.split(' ');
      const parsedSize = parseFloat(size.replace(/,/g, ''));

      return {
        type: 'Feature',
        geometry: {
          type: geom.getType(),
          coordinates,
        },
        properties: {
          id: `${index}`,
          size: parsedSize,
          units,
        },
      };
    }),
  };
}

export function downloadShapefiles(measurements, crs) {
  // Set names for feature types and zipped folder
  const options = {
    folder: 'worldviewMeasurements',
    types: {
      polygon: 'areaMeasurements',
      polyline: 'distanceMeasurements',
    },
  };
  const json = getFeatureJSON(measurements, crs);
  shpWrite.download(json, options);
}

export function downloadGeoJSON(measurements, crs) {
  const data = JSON.stringify(getFeatureJSON(measurements, crs), undefined, 2);
  const fileName = 'worldviewMeasurements.json';
  const fileType = 'application/geo+json';
  const blob = new Blob([data], { fileType, fileName });
  FileSaver.saveAs(blob, fileName);
}

import { Polygon, LineString, MultiLineString } from 'ol/geom';
import FileSaver from 'file-saver';
import {
  getGeographicLibArea,
  getGeographicLibDistance,
  transformLineStringArc,
  transformPolygonArc,
  downloadGeoJSON,
} from './util';
import { registerProjections } from '../../fixtures';

jest.mock('file-saver', () => ({ saveAs: jest.fn() }));

beforeEach(registerProjections);

/**
 * Should be able to handle area calculation made crossing the anti-meridian in polar projection
 * where coordinates do NOT extend beyond +/- 180, +/- 90
 */
test('two different triangles of the same size return the same measurement', () => {
  // triangle crosses anti-meridian
  const tri1 = [[0, 90], [-150, 80], [150, 80], [0, 90]];
  // triangle does NOT anti-meridian
  const tri2 = [[0, 90], [-150, 80], [-90, 80], [0, 90]];
  const tri1poly = new Polygon([tri1]);
  const tri2poly = new Polygon([tri2]);

  const tri1Area = getGeographicLibArea(tri1poly).toFixed(0);
  const tri2Area = getGeographicLibArea(tri2poly).toFixed(0);

  expect(tri1Area).toBe(tri2Area);
});

/**
 * Should be able to handle area calculation made
 * crossing the anti-meridian in geographic projection
 * where coordinates DO extend beyond +/- 180, +/- 90 due to map repeating
 */
test('area measurement that includes coordinates outisde of "normal" extents return correct result', () => {
  const normalTri = [[0, 90], [-150, 80], [-90, 80], [0, 90]];
  // partially outside normal longitudinal extents
  const geoTri1 = [[-180, -90], [-150, -80], [-210, -80], [-180, -90]];
  // entirely outside normal longitudinal extents
  const shiftedTri1 = [[-210, -90], [-180, -80], [-240, -80], [-210, -90]];

  const normalTriPoly = new Polygon([normalTri]);
  const geoTriPoly = new Polygon([geoTri1]);
  const shiftedTriPoly = new Polygon([shiftedTri1]);

  const normalTriArea = getGeographicLibArea(normalTriPoly).toFixed(0);
  const geoTriArea = getGeographicLibArea(geoTriPoly).toFixed(0);
  const shiftedTriArea = getGeographicLibArea(shiftedTriPoly).toFixed(0);
  expect(normalTriArea).toBe(geoTriArea);
  expect(normalTriArea).toBe(shiftedTriArea);
});

test('two different lines, one which crosses the antimeridian, are the same length', () => {
  // Crosses anti-meridian
  const line1 = [[-120, -80], [120, -80]];
  const line2 = [[-60, -80], [60, -80]];
  const lineString1 = new LineString(line1);
  const lineString2 = new LineString(line2);

  const lineString1Distance = getGeographicLibDistance(lineString1);
  const lineString2Distance = getGeographicLibDistance(lineString2);

  const lineString1Miles = getGeographicLibDistance(lineString1);
  const lineString2Miles = getGeographicLibDistance(lineString2);

  expect(lineString1Distance).toBe(lineString2Distance);
  expect(lineString1Miles).toBe(lineString2Miles);
});

test('lines which are the same numbers of degrees apart, at different poles, and which cross the poles, are the same length', () => {
  const line1 = [[-30, -80], [150, -80]];
  const line2 = [[60, -80], [-120, -80]];
  const line3 = [[-30, 80], [150, 80]];
  const line4 = [[60, 80], [-120, 80]];

  const lineString1 = new LineString(line1);
  const lineString2 = new LineString(line2);
  const lineString3 = new LineString(line3);
  const lineString4 = new LineString(line4);

  const lineString1Distance = getGeographicLibDistance(lineString1);
  const lineString2Distance = getGeographicLibDistance(lineString2);
  const lineString3Distance = getGeographicLibDistance(lineString3);
  const lineString4Distance = getGeographicLibDistance(lineString4);

  expect(lineString1Distance).toBe(lineString2Distance);
  expect(lineString1Distance).toBe(lineString3Distance);
  expect(lineString1Distance).toBe(lineString4Distance);
});

/**
 * Check for equality across ant-meridian to left and right of standard extents (-180, -90, 180, 90)
 */
test('lines which cross the anti-meridian outside of "normal" extents' +
     ' are the same length as equal distances within extents', () => {
  const line1 = [[-50, 0], [0, 0]]; // normal
  const line2 = [[-230, 0], [-180, 0]]; // outside left
  const line3 = [[180, 0], [230, 0]]; // outside right

  const lineString1 = new LineString(line1);
  const lineString2 = new LineString(line2);
  const lineString3 = new LineString(line3);

  const lineString1Distance = getGeographicLibDistance(lineString1);
  const lineString2Distance = getGeographicLibDistance(lineString2);
  const lineString3Distance = getGeographicLibDistance(lineString3);

  expect(lineString1Distance).toBe(lineString2Distance);
  expect(lineString1Distance).toBe(lineString3Distance);
});

test('always use the shortest distance between two points if within normal extents', () => {
  const line1 = [[-60, 0], [-10, 0]]; // normal
  const line2 = [[-130, 0], [180, 0]]; // "long" distance coordinates

  const lineString1 = new LineString(line1);
  const lineString2 = new LineString(line2);

  const lineString1Distance = getGeographicLibDistance(lineString1);
  const lineString2Distance = getGeographicLibDistance(lineString2);

  expect(lineString1Distance).toBe(lineString2Distance);
});

// ─── transformLineStringArc ────────────────────────────────────────────────

describe('transformLineStringArc', () => {
  const GEO = 'EPSG:4326';

  test('returns a MultiLineString', () => {
    const line = new LineString([[-74, 40], [0, 51]]);
    const result = transformLineStringArc(line, GEO);
    expect(result).toBeInstanceOf(MultiLineString);
  });

  test('transformed arc has more points than the original two-point line', () => {
    const line = new LineString([[-74, 40], [0, 51]]);
    const result = transformLineStringArc(line, GEO);
    // The flat coordinates array should have at least 3 pairs
    expect(result.getCoordinates()[0].length).toBeGreaterThan(2);
  });

  test('arc distance matches direct geodesic distance within 0.1%', () => {
    const coords = [[-74, 40], [0, 51]];
    const line = new LineString(coords);
    const directDistance = getGeographicLibDistance(line);
    const arcLine = transformLineStringArc(line, GEO);
    const arcPoints = arcLine.getCoordinates()[0];
    let arcDistance = 0;
    for (let i = 0; i < arcPoints.length - 1; i += 1) {
      const seg = new LineString([arcPoints[i], arcPoints[i + 1]]);
      arcDistance += getGeographicLibDistance(seg);
    }
    expect(Math.abs(arcDistance - directDistance) / directDistance).toBeLessThan(0.001);
  });

  test('handles line crossing anti-meridian (last two coords > 180 apart)', () => {
    // These two points are ~240 degrees apart in longitude → triggers checkForXFlip
    const line = new LineString([[-120, 0], [130, 0]]);
    const result = transformLineStringArc(line, GEO);
    expect(result).toBeInstanceOf(MultiLineString);
  });

  test('anti-meridian crossing line has same arc length as equivalent non-crossing line', () => {
    const crossingLine = new LineString([[-120, 0], [130, 0]]);
    const equivalentLine = new LineString([[-120, 0], [-230, 0]]); // shifted 360
    const crossingArc = transformLineStringArc(crossingLine, GEO);
    const equivalentArc = transformLineStringArc(equivalentLine, GEO);
    const sumSegments = (arc) => {
      const pts = arc.getCoordinates()[0];
      let dist = 0;
      for (let i = 0; i < pts.length - 1; i += 1) {
        dist += getGeographicLibDistance(new LineString([pts[i], pts[i + 1]]));
      }
      return dist;
    };
    expect(sumSegments(crossingArc).toFixed(0)).toBe(sumSegments(equivalentArc).toFixed(0));
  });
});

// ─── transformPolygonArc ───────────────────────────────────────────────────

describe('transformPolygonArc', () => {
  const GEO = 'EPSG:4326';

  test('returns a Polygon', () => {
    const poly = new Polygon([[[0, 0], [10, 0], [0, 10], [0, 0]]]);
    const result = transformPolygonArc(poly, GEO);
    expect(result).toBeInstanceOf(Polygon);
  });

  test('transformed polygon ring has more points than the original', () => {
    const poly = new Polygon([[[0, 0], [10, 0], [0, 10], [0, 0]]]);
    const original = poly.getCoordinates()[0].length;
    const result = transformPolygonArc(poly, GEO);
    expect(result.getCoordinates()[0].length).toBeGreaterThan(original);
  });

  test('arc polygon area is within 1% of the direct-calculation area', () => {
    const coords = [[[0, 0], [5, 0], [0, 5], [0, 0]]];
    const poly = new Polygon(coords);
    const directArea = getGeographicLibArea(poly);
    const arcPoly = transformPolygonArc(poly, GEO);
    const arcArea = getGeographicLibArea(arcPoly);
    expect(Math.abs(arcArea - directArea) / directArea).toBeLessThan(0.01);
  });
});

// ─── downloadGeoJSON ──────────────────────────────────────────────────────

function readBlob(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(blob);
  });
}

describe('downloadGeoJSON', () => {
  const GEO = 'EPSG:4326';

  function makeFakeMeasurement(type, coords, label = '100 km') {
    const geom = type === 'Polygon'
      ? new Polygon([coords])
      : new LineString(coords);
    return {
      feature: { getGeometry: () => geom },
      overlay: { element: { innerText: label } },
    };
  }

  beforeEach(() => jest.clearAllMocks());

  test('calls FileSaver.saveAs with correct filename', () => {
    const measurements = {
      m1: makeFakeMeasurement('LineString', [[-74, 40], [0, 51]]),
    };
    downloadGeoJSON(measurements, GEO);
    expect(FileSaver.saveAs).toHaveBeenCalledTimes(1);
    const [, fileName] = FileSaver.saveAs.mock.calls[0];
    expect(fileName).toBe('worldviewMeasurements.json');
  });

  test('produces a valid GeoJSON FeatureCollection blob', async () => {
    const measurements = {
      m1: makeFakeMeasurement('LineString', [[-74, 40], [0, 51]]),
    };
    downloadGeoJSON(measurements, GEO);
    const [blob] = FileSaver.saveAs.mock.calls[0];
    expect(blob).toBeInstanceOf(Blob);
    const text = await readBlob(blob);
    const json = JSON.parse(text);
    expect(json.type).toBe('FeatureCollection');
    expect(json.features).toHaveLength(1);
    expect(json.features[0].properties.size).toBe(100);
    expect(json.features[0].properties.units).toBe('km');
  });

  test('handles Polygon measurements', async () => {
    const measurements = {
      m1: makeFakeMeasurement('Polygon', [[0, 0], [5, 0], [0, 5], [0, 0]]),
    };
    downloadGeoJSON(measurements, GEO);
    const [blob] = FileSaver.saveAs.mock.calls[0];
    const text = await readBlob(blob);
    const json = JSON.parse(text);
    expect(json.features[0].geometry.type).toBe('Polygon');
  });

  test('handles multiple measurements', async () => {
    const measurements = {
      m1: makeFakeMeasurement('LineString', [[-74, 40], [0, 51]]),
      m2: makeFakeMeasurement('Polygon', [[0, 0], [5, 0], [0, 5], [0, 0]]),
    };
    downloadGeoJSON(measurements, GEO);
    const [blob] = FileSaver.saveAs.mock.calls[0];
    const text = await readBlob(blob);
    const json = JSON.parse(text);
    expect(json.features).toHaveLength(2);
  });

  test('parses size with comma-formatted numbers from overlay text', async () => {
    const measurements = {
      m1: makeFakeMeasurement('LineString', [[-74, 40], [0, 51]], '1,234 km'),
    };
    downloadGeoJSON(measurements, GEO);
    const [blob] = FileSaver.saveAs.mock.calls[0];
    const text = await readBlob(blob);
    const json = JSON.parse(text);
    expect(json.features[0].properties.size).toBe(1234);
  });
});

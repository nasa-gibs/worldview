import { Polygon, LineString } from 'ol/geom';
import {
  getGeographicLibArea,
  getGeographicLibDistance,
} from './util';
import { registerProjections } from '../../fixtures';

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
 * Should be able to handle area calculation made crossing the anti-meridian in geographic projection
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
test('lines which cross the anti-meridian outside of "normal" extents'
     + ' are the same length as equal distances within extents', () => {
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

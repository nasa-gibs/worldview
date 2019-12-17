import {
  getFormattedArea,
  getFormattedLength
} from './util';
import { Polygon, LineString } from 'ol/geom';
import { registerProjections } from '../../fixtures';

beforeEach(registerProjections);
const miles = 'mi';
const kilos = 'km';

/**
 * Should be able to handle area calculation made crossing the anti-meridian in polar projection
 * where coordinates do NOT extend beyond +/- 180, +/- 90
 */
test('two different triangles of the same size return the same measurement', () => {
  // triangle crosses anti-meridian
  const tri1 = [[0, 90], [-150, 80], [150, 80], [0, 90]];
  // triangle does NOT anti-meridian
  const tri2 = [[0, 90], [-150, 80], [-90, 80], [0, 90]];
  const greatCircleMeasure = false;
  const tri1poly = new Polygon([tri1]);
  const tri2poly = new Polygon([tri2]);

  const tri1AreaKm = getFormattedArea(tri1poly, 'EPSG:4326', kilos, greatCircleMeasure);
  const tri2AreaKm = getFormattedArea(tri2poly, 'EPSG:4326', kilos, greatCircleMeasure);
  const tri1AreaMiles = getFormattedArea(tri1poly, 'EPSG:4326', miles, greatCircleMeasure);
  const tri2AreaMiles = getFormattedArea(tri2poly, 'EPSG:4326', miles, greatCircleMeasure);

  expect(tri1AreaKm).toBe(tri2AreaKm);
  expect(tri1AreaMiles).toBe(tri2AreaMiles);
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

  const normalTriArea = getFormattedArea(normalTriPoly, 'EPSG:4326', kilos, true);
  const geoTriArea = getFormattedArea(geoTriPoly, 'EPSG:4326', kilos, true);
  const shiftedTriArea = getFormattedArea(shiftedTriPoly, 'EPSG:4326', kilos, true);
  expect(normalTriArea).toBe(geoTriArea);
  expect(normalTriArea).toBe(shiftedTriArea);
});



test('two different lines, one which crosses the antimeridian, are the same length', () => {
  // Crosses anti-meridian
  const line1 = [[-120, -80], [120, -80]];
  const line2 = [[-60, -80], [60, -80]];
  const lineString1 = new LineString(line1);
  const lineString2 = new LineString(line2);

  const lineString1Km = getFormattedLength(lineString1, 'EPSG:4326', kilos);
  const lineString2Km = getFormattedLength(lineString2, 'EPSG:4326', kilos);

  const lineString1Miles = getFormattedLength(lineString1, 'EPSG:4326', miles);
  const lineString2Miles = getFormattedLength(lineString2, 'EPSG:4326', miles);

  expect(lineString1Km).toBe(lineString2Km);
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

  const lineString1Km = getFormattedLength(lineString1, 'EPSG:4326', kilos);
  const lineString2Km = getFormattedLength(lineString2, 'EPSG:4326', kilos);
  const lineString3Km = getFormattedLength(lineString3, 'EPSG:4326', kilos);
  const lineString4Km = getFormattedLength(lineString4, 'EPSG:4326', kilos);

  const lineString1Miles = getFormattedLength(lineString1, 'EPSG:4326', miles);
  const lineString2Miles = getFormattedLength(lineString2, 'EPSG:4326', miles);
  const lineString3Miles = getFormattedLength(lineString3, 'EPSG:4326', miles);
  const lineString4Miles = getFormattedLength(lineString4, 'EPSG:4326', miles);

  expect(lineString1Km).toBe(lineString2Km);
  expect(lineString1Km).toBe(lineString3Km);
  expect(lineString1Km).toBe(lineString4Km);

  expect(lineString1Miles).toBe(lineString2Miles);
  expect(lineString1Miles).toBe(lineString3Miles);
  expect(lineString1Miles).toBe(lineString4Miles);
});

import {
  getFormattedArea
  // getFormattedLength
} from './util';
// import { getArea as OlSphereGetArea } from 'ol/sphere';
import { Polygon } from 'ol/geom';
import { registerProjections } from '../../fixtures';

beforeEach(registerProjections);

// const miles = 'mi';
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

  const tri1Area = getFormattedArea(tri1poly, 'EPSG:4326', kilos, greatCircleMeasure);
  const tri2Area = getFormattedArea(tri2poly, 'EPSG:4326', kilos, greatCircleMeasure);
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

  const normalTriArea = getFormattedArea(normalTriPoly, 'EPSG:4326', kilos, true);
  const geoTriArea = getFormattedArea(geoTriPoly, 'EPSG:4326', kilos, true);
  const shiftedTriArea = getFormattedArea(shiftedTriPoly, 'EPSG:4326', kilos, true);
  expect(normalTriArea).toBe(geoTriArea);
  expect(normalTriArea).toBe(shiftedTriArea);
  console.log(normalTriArea);
});

// test('two triangles of the same size return the same Rhumb line area measurement', () => {
//   const tri1poly = new Polygon([tri1]);
//   const tri2poly = new Polygon([tri2]);

//   const tri1Area = getRhumbLineArea(tri1poly, 'EPSG:4326');
//   const tri2Area = getRhumbLineArea(tri2poly, 'EPSG:4326');
//   console.log('Triangle 1: ', tri1Area);
//   console.log('Triangle 2: ', tri2Area);

//   expect(tri1Area).toBe(tri2Area);
// });

// test('polygon with same coordinates in different projections should return the same measurement', () => {
//   const greatCircleMeasure = true;
//   const tri1poly = new Polygon([tri1]);
//   const proj1Area = getFormattedArea(tri1poly, 'EPSG:3413', kilos, greatCircleMeasure);
//   const proj2Area = getFormattedArea(tri1poly, 'EPSG:4326', kilos, greatCircleMeasure);
//   expect(proj1Area).toBe(proj2Area);
// });

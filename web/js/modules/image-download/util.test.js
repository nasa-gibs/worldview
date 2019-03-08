import { bboxWMS13, imageUtilCalculateResolution } from './util';

const geoResolutions = [
  0.5625,
  0.28125,
  0.140625,
  0.0703125,
  0.03515625,
  0.017578125,
  0.0087890625,
  0.00439453125,
  0.002197265625,
  0.0010986328125,
  0.00054931640625,
  0.00027465820313
];

test('bboxWMS13', () => {
  let coords = [[11, 22], [33, 44]];
  let bboxGeo = bboxWMS13(coords, 'EPSG:4326');
  expect(bboxGeo).toBe('22,11,44,33');
  let bboxArctic = bboxWMS13(coords, 'EPSG:3413');
  expect(bboxArctic).toBe('11,22,33,44');
});

test('Default km resolution Calculation', () => {
  const zoom = 5;
  const isGeo = true;
  expect(imageUtilCalculateResolution(zoom, isGeo, geoResolutions)).toBe('4');
});

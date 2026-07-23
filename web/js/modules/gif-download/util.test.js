import {
  imageUtilCalculateResolution,
} from './util';

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
  0.00027465820313,
];

test('Default km resolution Calculation [imagedownload-default-resolution]', () => {
  const zoom = 5;
  const isGeo = true;
  expect(imageUtilCalculateResolution(zoom, isGeo, geoResolutions)).toBe('4');
});

import { bboxWMS13 } from './util';

test('bboxWMS13', () => {
  let coords = [[11, 22], [33, 44]];
  let bboxGeo = bboxWMS13(coords, 'EPSG:4326');
  expect(bboxGeo).toBe('22,11,44,33');
  let bboxArctic = bboxWMS13(coords, 'EPSG:3413');
  expect(bboxArctic).toBe('11,22,33,44');
});

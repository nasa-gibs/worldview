import util from '../../util/util';
import fixtures from '../../fixtures';
import { addLayer } from './selectors';

const config = fixtures.config();

// beforeAll(() => {
//   unmocked.now = util.now;
// });

// afterAll(() => {
//   util.now = unmocked.now;
// });

// function testData() {
//   let today = new Date(Date.UTC(2014, 0, 1));
//   util.now = () => today;
//   let config = fixtures.config();
//   let models = fixtures.models(config);
//   return {
//     config
//   };
// }

test('adds base layer', () => {
  let layers = addLayer('terra-cr', {}, [], config.layers, 0);
  layers = addLayer('terra-aod', {}, layers, config.layers, 1);
  layers = addLayer('mask', {}, layers, config.layers, 2);
  let layerList = layers.map(x => x.id);
  expect(layerList).toEqual(['mask', 'terra-cr', 'terra-aod']);
});

// test('adds overlay layer', () => {
//   let { models } = testData();
//   models.layers.add('terra-cr');
//   models.layers.add('terra-aod');
//   models.layers.add('combo-aod');

//   let layerList = models.layers.get().map(x => x.id);
//   expect(layerList).toEqual(['terra-cr', 'combo-aod', 'terra-aod']);
// });

// test('does not add duplicate layer', () => {
//   let { models } = testData();
//   models.layers.add('terra-cr');
//   models.layers.add('terra-aod');
//   models.layers.add('terra-cr');

//   let layerList = models.layers.get().map(x => x.id);
//   expect(layerList).toEqual(['terra-cr', 'terra-aod']);
// });

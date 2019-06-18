import util from '../../util/util';
import fixtures from '../../fixtures';
import { addLayer, getLayers, resetLayers, dateRange } from './selectors';
import update from 'immutability-helper';
const config = fixtures.config();
function getState(layers) {
  return {
    config,
    proj: { id: 'geographic', selected: config.projections['geographic'] },
    layers: {
      active: layers
    },
    compare: { isCompareA: true },
    date: { selected: new Date(Date.UTC(2014, 0, 1)) }
  };
}

test('adds base layer', () => {
  let layers = addLayer('terra-cr', {}, [], config.layers, 0);
  layers = addLayer('terra-aod', {}, layers, config.layers, 0);
  layers = addLayer('mask', {}, layers, config.layers, 1);

  let layerList = getLayers(layers, {}, getState(layers)).map(x => x.id);

  expect(layerList).toEqual(['mask', 'terra-cr', 'terra-aod']);
});

test('adds overlay layer', () => {
  let layers = addLayer('terra-cr', {}, [], config.layers, 0);
  layers = addLayer('terra-aod', {}, layers, config.layers, 0);
  layers = addLayer('combo-aod', {}, layers, config.layers, 1);

  let layerList = getLayers(layers, {}, getState(layers)).map(x => x.id);
  expect(layerList).toEqual(['terra-cr', 'combo-aod', 'terra-aod']);
});

test('does not add duplicate layer', () => {
  let layers = addLayer('terra-cr', {}, [], config.layers, 0);
  layers = addLayer('terra-aod', {}, layers, config.layers, 0);
  layers = addLayer('terra-cr', {}, layers, config.layers, 1);

  let layerList = getLayers(layers, {}, getState(layers)).map(x => x.id);
  expect(layerList).toEqual(['terra-cr', 'terra-aod']);
});

test('resets to default layers', () => {
  const layers = resetLayers(
    [
      {
        id: 'terra-cr'
      },
      {
        id: 'terra-aod'
      }
    ],
    config.layers
  );
  let layerList = getLayers(layers, {}, getState(layers)).map(x => x.id);
  expect(layerList).toEqual(['terra-cr', 'terra-aod']);
});
test('no date range for static products', () => {
  let layers = addLayer('mask', {}, [], config.layers, 0);
  expect(dateRange({}, layers, config)).toBeFalsy();
});

test('date range for ongoing layers', () => {
  let layers = addLayer('terra-cr', {}, [], config.layers);
  layers = addLayer('aqua-cr', {}, layers, config.layers);
  layers = addLayer('terra-aod', {}, layers, config.layers);
  layers = addLayer('aqua-aod', {}, layers, config.layers);
  let range = dateRange({}, layers, config);

  expect(range.start).toEqual(new Date(Date.UTC(2000, 0, 1)));
  expect(range.start).toEqual(new Date(Date.UTC(2000, 0, 1)));
});

test('date range for ended layers', () => {
  let layersConfig = {};
  layersConfig.end1 = {
    id: 'end1',
    group: 'overlays',
    projections: {
      geographic: {}
    },
    startDate: '1990-01-01',
    endDate: '2005-01-01',
    inactive: true
  };
  layersConfig.end2 = {
    id: 'end1',
    group: 'overlays',
    projections: {
      geographic: {}
    },
    startDate: '1992-01-01',
    endDate: '2007-01-01',
    inactive: true
  };
  const adjustedConfig = update(config, { layers: { $set: layersConfig } });
  let layers = addLayer('end1', {}, [], layersConfig);
  layers = addLayer('end2', {}, layers, layersConfig);
  let range = dateRange({}, layers, adjustedConfig);

  expect(range.start).toEqual(new Date(Date.UTC(1990, 0, 1)));
  expect(range.end).toEqual(new Date(Date.UTC(2007, 0, 1)));
});

test('gets layers in reverse', () => {
  let layers = addLayer('terra-cr', {}, [], config.layers);
  layers = addLayer('aqua-cr', {}, layers, config.layers);
  layers = addLayer('terra-aod', {}, layers, config.layers);
  layers = addLayer('aqua-aod', {}, layers, config.layers);

  let layerList = getLayers(layers, { reverse: true }, getState(layers)).map(
    x => x.id
  );
  expect(layerList).toEqual(['terra-cr', 'aqua-cr', 'terra-aod', 'aqua-aod']);
});

test('gets base layers', () => {
  let layers = addLayer('terra-cr', {}, [], config.layers);
  layers = addLayer('aqua-cr', {}, layers, config.layers);
  layers = addLayer('terra-aod', {}, layers, config.layers);
  layers = addLayer('aqua-aod', {}, layers, config.layers);
  let layerList = getLayers(
    layers,
    { group: 'baselayers' },
    getState(layers)
  ).map(x => x.id);
  expect(layerList).toEqual(['aqua-cr', 'terra-cr']);
});

test('gets overlay layers', () => {
  let layers = addLayer('terra-cr', {}, [], config.layers);
  layers = addLayer('aqua-cr', {}, layers, config.layers);
  layers = addLayer('terra-aod', {}, layers, config.layers);
  layers = addLayer('aqua-aod', {}, layers, config.layers);
  let layerList = getLayers(
    layers,
    { group: 'overlays' },
    getState(layers)
  ).map(x => x.id);
  expect(layerList).toEqual(['aqua-aod', 'terra-aod']);
});

test('gets all groups', () => {
  let layers = addLayer('terra-cr', {}, [], config.layers);
  layers = addLayer('aqua-cr', {}, layers, config.layers);
  layers = addLayer('terra-aod', {}, layers, config.layers);
  layers = addLayer('aqua-aod', {}, layers, config.layers);

  let layerList = getLayers(layers, { group: 'all' }, getState(layers));
  expect(layerList.baselayers[0].id).toBe('aqua-cr');
  expect(layerList.baselayers[1].id).toBe('terra-cr');
  expect(layerList.overlays[0].id).toBe('aqua-aod');
  expect(layerList.overlays[1].id).toBe('terra-aod');
});

test('gets layers for other projection', () => {
  let layers = addLayer('terra-cr', {}, [], config.layers);
  layers = addLayer('aqua-cr', {}, layers, config.layers);
  layers = addLayer('terra-aod', {}, layers, config.layers);
  layers = addLayer('aqua-aod', {}, layers, config.layers);
  let layerList = getLayers(layers, { proj: 'arctic' }, getState(layers)).map(
    x => x.id
  );
  expect(layerList).toEqual(['aqua-cr', 'terra-cr']);
});

test('obscured base layer is not renderable', () => {
  let layers = addLayer('terra-cr', {}, [], config.layers);
  layers = addLayer('aqua-cr', {}, layers, config.layers);
  layers = addLayer('terra-aod', {}, layers, config.layers);
  layers = addLayer('aqua-aod', {}, layers, config.layers);
  let layerList = getLayers(layers, { renderable: true }, getState(layers)).map(
    x => x.id
  );
  expect(layerList).toEqual(['aqua-cr', 'aqua-aod', 'terra-aod']);
});

test('base layer is not obscured by a hidden layer', () => {
  let layers = addLayer('terra-cr', {}, [], config.layers);
  layers = addLayer('aqua-cr', { visible: false }, layers, config.layers);
  layers = addLayer('terra-aod', {}, layers, config.layers);
  layers = addLayer('aqua-aod', {}, layers, config.layers);

  let layerList = getLayers(layers, { renderable: true }, getState(layers)).map(
    x => x.id
  );
  expect(layerList).toEqual(['terra-cr', 'aqua-aod', 'terra-aod']);
});

test('layer with zero opacity is not renderable', () => {
  let layers = addLayer('terra-cr', {}, [], config.layers);
  layers = addLayer('aqua-cr', {}, layers, config.layers);
  layers = addLayer('terra-aod', {}, layers, config.layers);
  layers = addLayer('aqua-aod', { opacity: 0 }, layers, config.layers);

  let layerList = getLayers(layers, { renderable: true }, getState(layers)).map(
    x => x.id
  );
  expect(layerList).toEqual(['aqua-cr', 'terra-aod']);
});

// test('layer outside date range is not renderable', () => {
//   let { models } = testData();
//   models.layers.add('terra-cr');
//   models.layers.add('aqua-cr');
//   models.layers.add('terra-aod');
//   models.layers.add('aqua-aod');
//   models.date.select(new Date(Date.UTC(2001, 0, 1)));

//   let layerList = models.layers.get({ renderable: true }).map(x => x.id);
//   expect(layerList).toEqual(['terra-cr', 'terra-aod']);
// });

// test('all layers are visible', () => {
//   let { models } = testData();
//   models.layers.add('terra-cr');
//   models.layers.add('aqua-cr');
//   models.layers.add('terra-aod');
//   models.layers.add('aqua-aod');

//   let layerList = models.layers.get({ visible: true }).map(x => x.id);
//   expect(layerList).toEqual(['aqua-cr', 'terra-cr', 'aqua-aod', 'terra-aod']);
// });

// test('only visible layers', () => {
//   let { models } = testData();
//   models.layers.add('terra-cr');
//   models.layers.add('aqua-cr');
//   models.layers.add('terra-aod');
//   models.layers.add('aqua-aod');
//   models.layers.setVisibility('terra-cr', false);
//   models.layers.setVisibility('terra-aod', false);

//   let layerList = models.layers.get({ visible: true }).map(x => x.id);
//   expect(layerList).toEqual(['aqua-cr', 'aqua-aod']);
// });

// test('replace base layer', () => {
//   let { models } = testData();
//   models.layers.add('terra-cr');
//   models.layers.add('aqua-cr');
//   models.layers.add('terra-aod');
//   models.layers.add('aqua-aod');
//   models.layers.replace('aqua-cr', 'mask');

//   let layerList = models.layers.get().map(x => x.id);
//   expect(layerList).toEqual(['mask', 'terra-cr', 'aqua-aod', 'terra-aod']);
// });

// test('replace overlay layer', () => {
//   let { models } = testData();
//   models.layers.add('terra-cr');
//   models.layers.add('aqua-cr');
//   models.layers.add('terra-aod');
//   models.layers.add('aqua-aod');
//   models.layers.replace('aqua-aod', 'combo-aod');

//   let layerList = models.layers.get().map(x => x.id);
//   expect(layerList).toEqual(['aqua-cr', 'terra-cr', 'combo-aod', 'terra-aod']);
// });

// test('push base layer to bottom', () => {
//   let { models } = testData();
//   models.layers.add('terra-cr');
//   models.layers.add('aqua-cr');
//   models.layers.add('terra-aod');
//   models.layers.add('aqua-aod');
//   models.layers.pushToBottom('aqua-cr');

//   let layerList = models.layers.get().map(x => x.id);
//   expect(layerList).toEqual(['terra-cr', 'aqua-cr', 'aqua-aod', 'terra-aod']);
// });

// test('push overlay to bottom', () => {
//   let { models } = testData();
//   models.layers.add('terra-cr');
//   models.layers.add('aqua-cr');
//   models.layers.add('terra-aod');
//   models.layers.add('aqua-aod');
//   models.layers.pushToBottom('aqua-aod');

//   let layerList = models.layers.get().map(x => x.id);
//   expect(layerList).toEqual(['aqua-cr', 'terra-cr', 'terra-aod', 'aqua-aod']);
// });

// test('move base layer before', () => {
//   let { models } = testData();
//   models.layers.add('terra-cr');
//   models.layers.add('aqua-cr');
//   models.layers.add('terra-aod');
//   models.layers.add('aqua-aod');
//   models.layers.moveBefore('terra-cr', 'aqua-cr');

//   let layerList = models.layers.get().map(x => x.id);
//   expect(layerList).toEqual(['terra-cr', 'aqua-cr', 'aqua-aod', 'terra-aod']);
// });

// test('move overlay before', () => {
//   let { models } = testData();
//   models.layers.add('terra-cr');
//   models.layers.add('aqua-cr');
//   models.layers.add('terra-aod');
//   models.layers.add('aqua-aod');
//   models.layers.moveBefore('terra-aod', 'aqua-aod');

//   let layerList = models.layers.get().map(x => x.id);
//   expect(layerList).toEqual(['aqua-cr', 'terra-cr', 'terra-aod', 'aqua-aod']);
// });

// test('saves state', () => {
//   let { models } = testData();
//   models.layers.add('terra-cr');
//   models.layers.add('terra-aod');
//   let state = {};
//   models.layers.save(state);
//   expect(state.l).toEqual([
//     {
//       id: 'terra-cr',
//       attributes: []
//     },
//     {
//       id: 'terra-aod',
//       attributes: []
//     }
//   ]);
// });

// test('Saves state with hidden layer', () => {
//   let { models } = testData();
//   models.layers.add('terra-cr');
//   models.layers.setVisibility('terra-cr', false);
//   let state = {};
//   models.layers.save(state);
//   expect(state.l).toEqual([
//     {
//       id: 'terra-cr',
//       attributes: [
//         {
//           id: 'hidden'
//         }
//       ]
//     }
//   ]);
// });

// test('loads state', () => {
//   let { models } = testData();
//   let errors = [];
//   models.layers.loaded = false;
//   var state = {
//     l: [
//       {
//         id: 'terra-cr',
//         attributes: []
//       },
//       {
//         id: 'terra-aod',
//         attributes: []
//       }
//     ]
//   };
//   models.layers.load(state, errors);
//   let terraAodObj = models.layers.active.find(x => x.id === 'terra-aod');
//   let terraCrObj = models.layers.active.find(x => x.id === 'terra-cr');

//   expect(terraAodObj).toBeTruthy();
//   expect(terraCrObj).toBeTruthy();
//   expect(errors).toHaveLength(0);
// });

// test('loads state with hidden layer', () => {
//   let { models } = testData();
//   let errors = [];
//   models.layers.loaded = false;
//   let state = {
//     l: [
//       {
//         id: 'terra-cr',
//         attributes: [
//           {
//             id: 'hidden',
//             value: true
//           }
//         ]
//       }
//     ]
//   };
//   models.layers.load(state, errors);
//   var def = models.layers.active.find(x => x.id === 'terra-cr');

//   expect(def).toBeTruthy();
//   expect(def.visible).toBe(false);
//   expect(errors).toHaveLength(0);
// });

// test('loads state with opacity', () => {
//   let { models } = testData();
//   let errors = [];
//   let state = {
//     l: [
//       {
//         id: 'terra-cr',
//         attributes: [
//           {
//             id: 'opacity',
//             value: 0.12
//           }
//         ]
//       }
//     ]
//   };
//   models.layers.load(state, errors);
//   let def = models.layers.active.find(x => x.id === 'terra-cr');

//   expect(def.opacity).toBe(0.12);
//   expect(errors).toHaveLength(0);
// });

// test('loads state, opacity clamped at 1', () => {
//   let { models } = testData();
//   let errors = [];
//   let state = {
//     l: [
//       {
//         id: 'terra-cr',
//         attributes: [
//           {
//             id: 'opacity',
//             value: 5
//           }
//         ]
//       }
//     ]
//   };
//   models.layers.load(state, errors);
//   let def = models.layers.active.find(x => x.id === 'terra-cr');

//   expect(def.opacity).toBe(1);
//   expect(errors).toHaveLength(0);
// });

// test('loads state, opacity clamped at 0', () => {
//   let { models } = testData();
//   let errors = [];
//   models.layers.loaded = false;
//   var state = {
//     l: [
//       {
//         id: 'terra-cr',
//         attributes: [
//           {
//             id: 'opacity',
//             value: -5
//           }
//         ]
//       }
//     ]
//   };
//   models.layers.load(state, errors);
//   let def = models.layers.active.find(x => x.id === 'terra-cr');

//   expect(def.opacity).toBe(0);
//   expect(errors).toHaveLength(0);
// });

// test('starts with default layers when no permalink', () => {
//   let { config, models } = testData();
//   config.defaults.startingLayers = [
//     {
//       id: 'terra-cr'
//     }
//   ];
//   models.layers = layersModel(models, config);
//   models.layers.load({});

//   expect(models.layers.active[0].id).toBe('terra-cr');
//   expect(models.layers.active[0].visible).toBe(true);
// });

// test('starts with a default hidden layer', () => {
//   let { config, models } = testData();
//   config.defaults.startingLayers = [
//     {
//       id: 'terra-cr',
//       hidden: true
//     }
//   ];
//   models.layers = layersModel(models, config);
//   models.layers.load({});

//   expect(models.layers.active[0].id).toBe('terra-cr');
//   expect(models.layers.active[0].visible).toBe(false);
// });

// // Date Ranges

// function testDataDateRanges() {
//   let today = new Date(Date.UTC(2010, 0, 1));
//   util.now = () => today;

//   let models = {};
//   models.proj = projectionModel({
//     defaults: {
//       projection: 'geographic'
//     },
//     projections: {
//       geographic: {
//         id: 'geographic'
//       }
//     }
//   });

//   models.layers = layersModel(models, {
//     layers: {
//       historical_1: {
//         id: 'historical_1',
//         startDate: '2000-01-01',
//         endDate: '2002-01-01',
//         group: 'baselayers',
//         projections: {
//           geographic: {}
//         }
//       },
//       historical_2: {
//         id: 'historical_2',
//         startDate: '2001-01-01',
//         endDate: '2003-01-01',
//         group: 'overlays',
//         projections: {
//           geographic: {}
//         }
//       },
//       active_1: {
//         id: 'active_1',
//         startDate: '2005-01-01',
//         group: 'overlays',
//         projections: {
//           geographic: {}
//         }
//       },
//       static: {
//         id: 'static',
//         group: 'overlays',
//         projections: {
//           geographic: {}
//         }
//       }
//     }
//   });
//   return { models };
// }

// test('date range with one layer', () => {
//   let { models } = testDataDateRanges();
//   models.layers.add('historical_1');

//   let range = models.layers.dateRange();
//   expect(range.start.getTime()).toEqual(
//     new Date(Date.UTC(2000, 0, 1)).getTime()
//   );
//   expect(range.end.getTime()).toEqual(new Date(Date.UTC(2010, 0, 1)).getTime());
// });

// test('date range with two layers', () => {
//   let { models } = testDataDateRanges();
//   models.layers.add('historical_1');
//   models.layers.add('historical_2');

//   var range = models.layers.dateRange();
//   expect(range.start.getTime()).toEqual(
//     new Date(Date.UTC(2000, 0, 1)).getTime()
//   );
//   expect(range.end.getTime()).toEqual(new Date(Date.UTC(2010, 0, 1)).getTime());
// });

// test('end of date range is today if no end date', () => {
//   let { models } = testDataDateRanges();
//   models.layers.add('active_1');

//   let range = models.layers.dateRange();
//   expect(range.start.getTime()).toEqual(
//     new Date(Date.UTC(2005, 0, 1)).getTime()
//   );
//   expect(range.end.getTime()).toEqual(new Date(Date.UTC(2010, 0, 1)).getTime());
// });

// test('no date range with static', () => {
//   let { models } = testDataDateRanges();
//   models.layers.add('static');
//   expect(models.layers.dateRange()).toBeFalsy();
// });

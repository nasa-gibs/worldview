import { projectionModel } from '../projection/model';
import { layersModel } from './model';
import util from '../util/util';
import fixtures from '../fixtures';

let unmocked = {};

beforeAll(() => {
  unmocked.now = util.now;
});

afterAll(() => {
  util.now = unmocked.now;
});

function testData() {
  let today = new Date(Date.UTC(2014, 0, 1));
  util.now = () => today;
  let config = fixtures.config();
  let models = fixtures.models(config);
  return {
    config,
    models
  };
}

test('adds base layer', () => {
  let { models } = testData();
  models.layers.add('terra-cr');
  models.layers.add('terra-aod');
  models.layers.add('mask');

  let layerList = models.layers.get().map(x => x.id);
  expect(layerList).toEqual([
    'mask',
    'terra-cr',
    'terra-aod'
  ]);
});

test('adds overlay layer', () => {
  let { models } = testData();
  models.layers.add('terra-cr');
  models.layers.add('terra-aod');
  models.layers.add('combo-aod');

  let layerList = models.layers.get().map(x => x.id);
  expect(layerList).toEqual([
    'terra-cr',
    'combo-aod',
    'terra-aod'
  ]);
});

test('does not add duplicate layer', () => {
  let { models } = testData();
  models.layers.add('terra-cr');
  models.layers.add('terra-aod');
  models.layers.add('terra-cr');

  let layerList = models.layers.get().map(x => x.id);
  expect(layerList).toEqual([
    'terra-cr',
    'terra-aod'
  ]);
});

test('fires add/change events', () => {
  let { models } = testData();
  let add = jest.fn();
  let change = jest.fn();
  models.layers.events.on('add', add);
  models.layers.events.on('change', change);

  models.layers.add('terra-cr');
  expect(add).toBeCalled();
  expect(change).toBeCalled();
});

test('removes base layer', () => {
  let { models } = testData();
  models.layers.add('terra-cr');
  models.layers.add('aqua-cr');
  models.layers.add('terra-aod');
  models.layers.add('aqua-aod');

  models.layers.remove('terra-cr');
  let layerList = models.layers.get().map(x => x.id);
  expect(layerList).toEqual([
    'aqua-cr',
    'aqua-aod',
    'terra-aod'
  ]);
});

test('fires remove/change events', () => {
  let { models } = testData();
  models.layers.add('terra-cr');

  let remove = jest.fn();
  let change = jest.fn();
  models.layers.events.on('remove', remove);
  models.layers.events.on('change', change);
  models.layers.remove('terra-cr');

  expect(remove).toBeCalled();
  expect(change).toBeCalled();
});

test('do nothing on removing a non-existant layer', () => {
  let { models } = testData();
  models.layers.add('terra-cr');
  models.layers.add('terra-aod');

  models.layers.remove('x');
  let layerList = models.layers.get().map(x => x.id);
  expect(layerList).toEqual([
    'terra-cr',
    'terra-aod'
  ]);
});

test('clears all layers', () => {
  let { models } = testData();
  models.layers.add('terra-cr');
  models.layers.add('terra-aod');
  models.layers.clear();
  expect(models.layers.get()).toHaveLength(0);
});

test('clears layers for projection', () => {
  let { models } = testData();
  models.layers.add('terra-cr');
  models.layers.add('aqua-cr');
  models.layers.add('terra-aod');
  models.layers.add('aqua-aod');
  models.proj.select('arctic');
  models.layers.clear();
  models.proj.select('geographic');

  let layerList = models.layers.get().map(x => x.id);
  expect(layerList).toEqual(['aqua-aod', 'terra-aod']);
});

test('resets to default layers', () => {
  let { config } = testData();
  config.defaults.startingLayers = [
    {
      id: 'terra-cr'
    },
    {
      id: 'terra-aod'
    }
  ];
  let models = fixtures.models(config);
  models.layers.add('terra-cr');
  models.layers.add('aqua-cr');
  models.layers.add('terra-aod');
  models.layers.add('aqua-aod');
  models.layers.reset();

  let layerList = models.layers.get().map(x => x.id);
  expect(layerList).toEqual(['terra-cr', 'terra-aod']);
});

test('no date range for static products', () => {
  let { models } = testData();
  models.layers.clear();
  models.layers.add('mask');
  expect(models.layers.dateRange()).toBeFalsy();
});

test('date range for ongoing layers', () => {
  let { models } = testData();
  models.layers.add('terra-cr');
  models.layers.add('aqua-cr');
  models.layers.add('terra-aod');
  models.layers.add('aqua-aod');
  let range = models.layers.dateRange();

  expect(range.start).toEqual(new Date(Date.UTC(2000, 0, 1)));
  expect(range.start).toEqual(new Date(Date.UTC(2000, 0, 1)));
});

test('date range for ended layers', () => {
  let { config } = testData();
  config.layers.end1 = {
    id: 'end1',
    group: 'overlays',
    projections: {
      geographic: {}
    },
    startDate: '1990-01-01',
    endDate: '2005-01-01',
    inactive: true
  };
  config.layers.end2 = {
    id: 'end1',
    group: 'overlays',
    projections: {
      geographic: {}
    },
    startDate: '1992-01-01',
    endDate: '2007-01-01',
    inactive: true
  };

  let models = fixtures.models(config);
  models.layers.add('end1');
  models.layers.add('end2');
  let range = models.layers.dateRange();

  expect(range.start).toEqual(new Date(Date.UTC(1990, 0, 1)));
  expect(range.end).toEqual(new Date(Date.UTC(2007, 0, 1)));
});

test('gets layers in reverse', () => {
  let { models } = testData();
  models.layers.add('terra-cr');
  models.layers.add('aqua-cr');
  models.layers.add('terra-aod');
  models.layers.add('aqua-aod');

  let layerList = models.layers.get({ reverse: true }).map(x => x.id);
  expect(layerList).toEqual([
    'terra-cr',
    'aqua-cr',
    'terra-aod',
    'aqua-aod'
  ]);
});

test('gets base layers', () => {
  let { models } = testData();
  models.layers.add('terra-cr');
  models.layers.add('aqua-cr');
  models.layers.add('terra-aod');
  models.layers.add('aqua-aod');

  let layerList = models.layers.get({ group: 'baselayers' }).map(x => x.id);
  expect(layerList).toEqual([
    'aqua-cr',
    'terra-cr'
  ]);
});

test('gets overlay layers', () => {
  let { models } = testData();
  models.layers.add('terra-cr');
  models.layers.add('aqua-cr');
  models.layers.add('terra-aod');
  models.layers.add('aqua-aod');

  let layerList = models.layers.get({ group: 'overlays' }).map(x => x.id);
  expect(layerList).toEqual([
    'aqua-aod',
    'terra-aod'
  ]);
});

test('gets all groups', () => {
  let { models } = testData();
  models.layers.add('terra-cr');
  models.layers.add('aqua-cr');
  models.layers.add('terra-aod');
  models.layers.add('aqua-aod');

  let layerList = models.layers.get({ group: 'all' });
  expect(layerList.baselayers[0].id).toBe('aqua-cr');
  expect(layerList.baselayers[1].id).toBe('terra-cr');
  expect(layerList.overlays[0].id).toBe('aqua-aod');
  expect(layerList.overlays[1].id).toBe('terra-aod');
});

test('gets layers for other projection', () => {
  let { models } = testData();
  models.layers.add('terra-cr');
  models.layers.add('aqua-cr');
  models.layers.add('terra-aod');
  models.layers.add('aqua-aod');

  let layerList = models.layers.get({ proj: 'arctic' }).map(x => x.id);
  expect(layerList).toEqual([
    'aqua-cr',
    'terra-cr'
  ]);
});

test('obscured base layer is not renderable', () => {
  let { models } = testData();
  models.layers.add('terra-cr');
  models.layers.add('aqua-cr');
  models.layers.add('terra-aod');
  models.layers.add('aqua-aod');

  let layerList = models.layers.get({ renderable: true }).map(x => x.id);
  expect(layerList).toEqual([
    'aqua-cr',
    'aqua-aod',
    'terra-aod'
  ]);
});

test('base layer is not obscured by a hidden layer', () => {
  let { models } = testData();
  models.layers.add('terra-cr');
  models.layers.add('aqua-cr');
  models.layers.add('terra-aod');
  models.layers.add('aqua-aod');
  models.layers.setVisibility('aqua-cr', false);

  let layerList = models.layers.get({ renderable: true }).map(x => x.id);
  expect(layerList).toEqual([
    'terra-cr',
    'aqua-aod',
    'terra-aod'
  ]);
});

test('layer with zero opacity is not renderable', () => {
  let { models } = testData();
  models.layers.add('terra-cr');
  models.layers.add('aqua-cr');
  models.layers.add('terra-aod');
  models.layers.add('aqua-aod');
  models.layers.setOpacity('aqua-aod', 0);

  let layerList = models.layers.get({ renderable: true }).map(x => x.id);
  expect(layerList).toEqual([
    'aqua-cr',
    'terra-aod'
  ]);
});

test('layer outside date range is not renderable', () => {
  let { models } = testData();
  models.layers.add('terra-cr');
  models.layers.add('aqua-cr');
  models.layers.add('terra-aod');
  models.layers.add('aqua-aod');
  models.date.select(new Date(Date.UTC(2001, 0, 1)));

  let layerList = models.layers.get({ renderable: true }).map(x => x.id);
  expect(layerList).toEqual([
    'terra-cr',
    'terra-aod'
  ]);
});

test('all layers are visible', () => {
  let { models } = testData();
  models.layers.add('terra-cr');
  models.layers.add('aqua-cr');
  models.layers.add('terra-aod');
  models.layers.add('aqua-aod');

  let layerList = models.layers.get({ visible: true }).map(x => x.id);
  expect(layerList).toEqual([
    'aqua-cr',
    'terra-cr',
    'aqua-aod',
    'terra-aod'
  ]);
});

test('only visible layers', () => {
  let { models } = testData();
  models.layers.add('terra-cr');
  models.layers.add('aqua-cr');
  models.layers.add('terra-aod');
  models.layers.add('aqua-aod');
  models.layers.setVisibility('terra-cr', false);
  models.layers.setVisibility('terra-aod', false);

  let layerList = models.layers.get({ visible: true }).map(x => x.id);
  expect(layerList).toEqual([
    'aqua-cr',
    'aqua-aod'
  ]);
});

test('replace base layer', () => {
  let { models } = testData();
  models.layers.add('terra-cr');
  models.layers.add('aqua-cr');
  models.layers.add('terra-aod');
  models.layers.add('aqua-aod');
  models.layers.replace('aqua-cr', 'mask');

  let layerList = models.layers.get().map(x => x.id);
  expect(layerList).toEqual([
    'mask',
    'terra-cr',
    'aqua-aod',
    'terra-aod'
  ]);
});

test('replace overlay layer', () => {
  let { models } = testData();
  models.layers.add('terra-cr');
  models.layers.add('aqua-cr');
  models.layers.add('terra-aod');
  models.layers.add('aqua-aod');
  models.layers.replace('aqua-aod', 'combo-aod');

  let layerList = models.layers.get().map(x => x.id);
  expect(layerList).toEqual([
    'aqua-cr',
    'terra-cr',
    'combo-aod',
    'terra-aod'
  ]);
});

test('push base layer to bottom', () => {
  let { models } = testData();
  models.layers.add('terra-cr');
  models.layers.add('aqua-cr');
  models.layers.add('terra-aod');
  models.layers.add('aqua-aod');
  models.layers.pushToBottom('aqua-cr');

  let layerList = models.layers.get().map(x => x.id);
  expect(layerList).toEqual([
    'terra-cr',
    'aqua-cr',
    'aqua-aod',
    'terra-aod'
  ]);
});

test('push overlay to bottom', () => {
  let { models } = testData();
  models.layers.add('terra-cr');
  models.layers.add('aqua-cr');
  models.layers.add('terra-aod');
  models.layers.add('aqua-aod');
  models.layers.pushToBottom('aqua-aod');

  let layerList = models.layers.get().map(x => x.id);
  expect(layerList).toEqual([
    'aqua-cr',
    'terra-cr',
    'terra-aod',
    'aqua-aod'
  ]);
});

test('move base layer before', () => {
  let { models } = testData();
  models.layers.add('terra-cr');
  models.layers.add('aqua-cr');
  models.layers.add('terra-aod');
  models.layers.add('aqua-aod');
  models.layers.moveBefore('terra-cr', 'aqua-cr');

  let layerList = models.layers.get().map(x => x.id);
  expect(layerList).toEqual([
    'terra-cr',
    'aqua-cr',
    'aqua-aod',
    'terra-aod'
  ]);
});

test('move overlay before', () => {
  let { models } = testData();
  models.layers.add('terra-cr');
  models.layers.add('aqua-cr');
  models.layers.add('terra-aod');
  models.layers.add('aqua-aod');
  models.layers.moveBefore('terra-aod', 'aqua-aod');

  let layerList = models.layers.get().map(x => x.id);
  expect(layerList).toEqual([
    'aqua-cr',
    'terra-cr',
    'terra-aod',
    'aqua-aod'
  ]);
});

test('saves state', () => {
  let { models } = testData();
  models.layers.add('terra-cr');
  models.layers.add('terra-aod');
  let state = {};
  models.layers.save(state);
  expect(state.l).toEqual([
    {
      id: 'terra-cr',
      attributes: []
    },
    {
      id: 'terra-aod',
      attributes: []
    }
  ]);
});

test('Saves state with hidden layer', () => {
  let { models } = testData();
  models.layers.add('terra-cr');
  models.layers.setVisibility('terra-cr', false);
  let state = {};
  models.layers.save(state);
  expect(state.l).toEqual([
    {
      id: 'terra-cr',
      attributes: [
        {
          id: 'hidden'
        }
      ]
    }
  ]);
});

test('loads state', () => {
  let { models } = testData();
  let errors = [];
  models.layers.loaded = false;
  var state = {
    l: [
      {
        id: 'terra-cr',
        attributes: []
      },
      {
        id: 'terra-aod',
        attributes: []
      }
    ]
  };
  models.layers.load(state, errors);
  let terraAodObj = models.layers.active.find(x => x.id === 'terra-aod');
  let terraCrObj = models.layers.active.find(x => x.id === 'terra-cr');

  expect(terraAodObj).toBeTruthy();
  expect(terraCrObj).toBeTruthy();
  expect(errors).toHaveLength(0);
});

test('loads state with hidden layer', () => {
  let { models } = testData();
  let errors = [];
  models.layers.loaded = false;
  let state = {
    l: [
      {
        id: 'terra-cr',
        attributes: [
          {
            id: 'hidden',
            value: true
          }
        ]
      }
    ]
  };
  models.layers.load(state, errors);
  var def = models.layers.active.find(x => x.id === 'terra-cr');

  expect(def).toBeTruthy();
  expect(def.visible).toBe(false);
  expect(errors).toHaveLength(0);
});

test('loads state with opacity', () => {
  let { models } = testData();
  let errors = [];
  let state = {
    l: [
      {
        id: 'terra-cr',
        attributes: [
          {
            id: 'opacity',
            value: 0.12
          }
        ]
      }
    ]
  };
  models.layers.load(state, errors);
  let def = models.layers.active.find(x => x.id === 'terra-cr');

  expect(def.opacity).toBe(0.12);
  expect(errors).toHaveLength(0);
});

test('loads state, opacity clamped at 1', () => {
  let { models } = testData();
  let errors = [];
  let state = {
    l: [
      {
        id: 'terra-cr',
        attributes: [
          {
            id: 'opacity',
            value: 5
          }
        ]
      }
    ]
  };
  models.layers.load(state, errors);
  let def = models.layers.active.find(x => x.id === 'terra-cr');

  expect(def.opacity).toBe(1);
  expect(errors).toHaveLength(0);
});

test('loads state, opacity clamped at 0', () => {
  let { models } = testData();
  let errors = [];
  models.layers.loaded = false;
  var state = {
    l: [
      {
        id: 'terra-cr',
        attributes: [
          {
            id: 'opacity',
            value: -5
          }
        ]
      }
    ]
  };
  models.layers.load(state, errors);
  let def = models.layers.active.find(x => x.id === 'terra-cr');

  expect(def.opacity).toBe(0);
  expect(errors).toHaveLength(0);
});

test('starts with default layers when no permalink', () => {
  let { config, models } = testData();
  config.defaults.startingLayers = [
    {
      id: 'terra-cr'
    }
  ];
  models.layers = layersModel(models, config);
  models.layers.load({});

  expect(models.layers.active[0].id).toBe('terra-cr');
  expect(models.layers.active[0].visible).toBe(true);
});

test('starts with a default hidden layer', () => {
  let { config, models } = testData();
  config.defaults.startingLayers = [
    {
      id: 'terra-cr',
      hidden: true
    }
  ];
  models.layers = layersModel(models, config);
  models.layers.load({});

  expect(models.layers.active[0].id).toBe('terra-cr');
  expect(models.layers.active[0].visible).toBe(false);
});

// Date Ranges

function testDataDateRanges() {
  let today = new Date(Date.UTC(2010, 0, 1));
  util.now = () => today;

  let models = {};
  models.proj = projectionModel({
    defaults: {
      projection: 'geographic'
    },
    projections: {
      geographic: {
        id: 'geographic'
      }
    }
  });

  models.layers = layersModel(models, {
    layers: {
      'historical_1': {
        id: 'historical_1',
        startDate: '2000-01-01',
        endDate: '2002-01-01',
        group: 'baselayers',
        projections: {
          geographic: {}
        }
      },
      'historical_2': {
        id: 'historical_2',
        startDate: '2001-01-01',
        endDate: '2003-01-01',
        group: 'overlays',
        projections: {
          geographic: {}
        }
      },
      'active_1': {
        id: 'active_1',
        startDate: '2005-01-01',
        group: 'overlays',
        projections: {
          geographic: {}
        }
      },
      'static': {
        id: 'static',
        group: 'overlays',
        projections: {
          geographic: {}
        }
      }
    }
  });
  return { models };
};

test('date range with one layer', () => {
  let { models } = testDataDateRanges();
  models.layers.add('historical_1');

  let range = models.layers.dateRange();
  expect(range.start.getTime()).toEqual(
    new Date(Date.UTC(2000, 0, 1))
      .getTime());
  expect(range.end.getTime()).toEqual(
    new Date(Date.UTC(2010, 0, 1))
      .getTime());
});

test('date range with two layers', () => {
  let { models } = testDataDateRanges();
  models.layers.add('historical_1');
  models.layers.add('historical_2');

  var range = models.layers.dateRange();
  expect(range.start.getTime()).toEqual(
    new Date(Date.UTC(2000, 0, 1))
      .getTime());
  expect(range.end.getTime()).toEqual(
    new Date(Date.UTC(2010, 0, 1))
      .getTime());
});

test('end of date range is today if no end date', () => {
  let { models } = testDataDateRanges();
  models.layers.add('active_1');

  let range = models.layers.dateRange();
  expect(range.start.getTime()).toEqual(
    new Date(Date.UTC(2005, 0, 1))
      .getTime());
  expect(range.end.getTime()).toEqual(
    new Date(Date.UTC(2010, 0, 1))
      .getTime());
});

test('no date range with static', () => {
  let { models } = testDataDateRanges();
  models.layers.add('static');
  expect(models.layers.dateRange()).toBeFalsy();
});

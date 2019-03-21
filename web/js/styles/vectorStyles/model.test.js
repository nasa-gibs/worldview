import jQuery from 'jquery';
import vectorStyles from './vectorStyles';
import fixtures from '../fixtures';

var unmocked = {};

beforeAll(() => {
  unmocked.getJSON = jQuery.getJSON;
  unmocked.supported = vectorStyles.supported;
});

beforeEach(() => { vectorStyles.supported = true; });

afterEach(() => {
  jQuery.getJSON = unmocked.getJSON;
  vectorStyles.supported = unmocked.supported;
});

function testData() {
  let config = fixtures.config();
  let models = fixtures.models(config);
  return { config, models };
};

test('set a custom vectorStyle', (done) => {
  let { models } = testData();
  models.vectorStyles.events.on('set-custom', function (layerId) {
    var vectorStyle = models.vectorStyles.get(layerId);
    var colors = vectorStyle.legend.colors;
    var labels = vectorStyle.legend.tooltips;

    expect(colors).toEqual([
      fixtures.light_blue,
      fixtures.blue,
      fixtures.dark_blue
    ]);
    expect(labels).toEqual(['0', '1', '2']);
    done();
  });
  models.layers.add('terra-aod');
  models.vectorStyles.setCustom('terra-aod', 'blue-1');
});

test('palettte compresses color range', () => {
  let { models, config } = testData();
  config.vectorStyles.custom['blue-1'].colors = ['1', '2', '3', '4', '5', '6'];
  models = fixtures.models(config);
  models.layers.add('terra-aod');
  models.vectorStyles.setCustom('terra-aod', 'blue-1');
  var vectorStyle = models.vectorStyles.get('terra-aod');

  expect(vectorStyle.legend.colors).toEqual(['1', '3', '5']);
});

test('vectorStyle expands color range', () => {
  let { models, config } = testData();
  config.vectorStyles.rendered['terra-aod'].maps[0].entries.colors = [
    '1',
    '2',
    '3',
    '4',
    '5',
    '6'
  ];
  models = fixtures.models(config);
  models.layers.add('terra-aod');
  models.vectorStyles.setCustom('terra-aod', 'blue-1');
  let vectorStyle = models.vectorStyles.get('terra-aod');
  let colors = vectorStyle.legend.colors;

  expect(colors).toEqual([
    fixtures.light_blue,
    fixtures.light_blue,
    fixtures.blue,
    fixtures.blue,
    fixtures.dark_blue,
    fixtures.dark_blue
  ]);
});

test('exception setting a custom vectorStyle when no layer exists', () => {
  let { models } = testData();
  expect(() => models.vectorStyles.setCustom('no-layer', 'blue-1')).toThrow();
});

test('exception setting an unvakud custom vectorStyle', () => {
  let { models } = testData();
  expect(() => models.vectorStyles.setCustom('terra-aod', 'no-vectorStyle')).toThrow();
});

test('exception setting a custom vectorStyle on a imagery layer', () => {
  let { models } = testData();
  expect(() => models.vectorStyles.setCustom('terra0cr', 'blue-1')).toThrow();
});

test('clear a custom vectorStyle', () => {
  let { models } = testData();
  let trigger = jest.fn();
  models.vectorStyles.events.trigger = trigger;

  models.layers.add('aqua-aod');
  models.vectorStyles.setCustom('terra-aod', 'blue-1');
  models.vectorStyles.clearCustom('terra-aod');
  let vectorStyle = models.vectorStyles.get('terra-aod');

  expect(vectorStyle.entries.colors[0]).toBe(fixtures.green);
  expect(vectorStyle.legend.tooltips[0]).toBe('0');

  expect(trigger).toBeCalledWith('clear-custom', 'terra-aod', 'active');
  expect(trigger).toBeCalledWith('change');
});

test('set a minimum threshold', () => {
  let { models } = testData();
  let trigger = jest.fn();
  models.vectorStyles.events.trigger = trigger;

  models.layers.add('terra-aod');
  models.vectorStyles.setRange('terra-aod', 1, 2);
  let vectorStyle = models.vectorStyles.get('terra-aod');

  expect(vectorStyle.min).toBe(1);
  expect(vectorStyle.max).not.toBeDefined();
  expect(vectorStyle.legend.colors).toEqual([
    '00000000',
    fixtures.yellow,
    fixtures.red
  ]);

  expect(trigger).toBeCalledWith('range', 'terra-aod', 1, undefined, 'active');
  expect(trigger).toBeCalledWith('change');
});

test('set a maximum threshold', () => {
  let { models } = testData();
  let trigger = jest.fn();
  models.vectorStyles.events.trigger = trigger;

  models.layers.add('terra-aod');
  models.vectorStyles.setRange('terra-aod', 0, 1);
  let vectorStyle = models.vectorStyles.get('terra-aod');

  expect(vectorStyle.max).toBe(1);
  expect(vectorStyle.min).not.toBeDefined();
  expect(vectorStyle.legend.colors).toEqual([
    fixtures.green,
    fixtures.yellow,
    '00000000'
  ]);

  expect(trigger).toBeCalledWith('range', 'terra-aod', undefined, 1, 'active');
  expect(trigger).toBeCalledWith('change');
});

test('save custom vectorStyle', () => {
  let { models } = testData();
  models.layers.add('aqua-aod');
  models.layers.add('terra-aod');
  models.vectorStyles.setCustom('terra-aod', 'blue-1');
  models.vectorStyles.setCustom('aqua-aod', 'red-1');

  let state = {};
  models.layers.save(state);
  models.vectorStyles.save(state);
  expect(state.l).toEqual([
    {
      id: 'terra-aod',
      attributes: [
        {
          id: 'vectorStyle',
          value: 'blue-1'
        }
      ]
    },
    {
      id: 'aqua-aod',
      attributes: [
        {
          id: 'vectorStyle',
          value: 'red-1'
        }
      ]
    }
  ]);
});

test('save threshold minimum', () => {
  let { models } = testData();
  models.layers.add('terra-aod');
  models.vectorStyles.setRange('terra-aod', 1, 2);

  var state = {};
  models.layers.save(state);
  models.vectorStyles.save(state);
  expect(state.l).toEqual([
    {
      id: 'terra-aod',
      attributes: [
        {
          id: 'min',
          value: 1
        }
      ]
    }
  ]);
});

test('save threshold maximum', () => {
  let { models } = testData();
  models.layers.add('terra-aod');
  models.vectorStyles.setRange('terra-aod', 0, 1);

  var state = {};
  models.layers.save(state);
  models.vectorStyles.save(state);
  expect(state.l).toEqual([
    {
      id: 'terra-aod',
      attributes: [
        {
          id: 'max',
          value: 1
        }
      ]
    }
  ]);
});

test('save threshold range', () => {
  let { models } = testData();
  models.layers.add('terra-aod');
  models.vectorStyles.setRange('terra-aod', 1, 1);

  var state = {};
  models.layers.save(state);
  models.vectorStyles.save(state);
  expect(state.l).toEqual([
    {
      id: 'terra-aod',
      attributes: [
        {
          id: 'min',
          value: 1
        },
        {
          id: 'max',
          value: 1
        }
      ]
    }
  ]);
});

test('no save when not active', () => {
  let { models } = testData();
  models.layers.add('terra-aod');

  var state = {};
  models.layers.save(state);
  models.vectorStyles.save(state);
  expect(state.l).toEqual([
    {
      id: 'terra-aod',
      attributes: []
    }
  ]);
});

test('load state', () => {
  let { models } = testData();
  let state = {
    l: [
      {
        id: 'terra-aod',
        attributes: [
          {
            id: 'vectorStyle',
            value: 'blue-1'
          },
          {
            id: 'min',
            value: '1'
          },
          {
            id: 'max',
            value: '1'
          }
        ]
      }
    ]
  };
  let errors = [];
  models.layers.load(state, errors);
  models.vectorStyles.load(state, errors);
  let vectorStyle = models.vectorStyles.get('terra-aod');

  expect(vectorStyle.custom).toBe('blue-1');
  expect(vectorStyle.min).toBe(1);
  expect(vectorStyle.max).toBe(1);
  expect(errors).toHaveLength(0);
});

test('error loading invalid minimum', () => {
  let { models } = testData();
  let state = {
    l: [
      {
        id: 'terra-aod',
        attributes: [
          {
            id: 'min',
            value: 'x'
          }
        ]
      }
    ]
  };
  let errors = [];
  models.layers.load(state, errors);
  models.vectorStyles.load(state, errors);

  expect(errors).toHaveLength(1);
});

test('error loading invalid maximum', () => {
  let { models } = testData();
  let state = {
    l: [
      {
        id: 'terra-aod',
        attributes: [
          {
            id: 'max',
            value: 'x'
          }
        ]
      }
    ]
  };
  let errors = [];
  models.layers.load(state, errors);
  models.vectorStyles.load(state, errors);

  expect(errors).toHaveLength(1);
});

test('canvas not in use', () => {
  let { models } = testData();
  expect(models.vectorStyles.inUse()).toBe(false);
});

test('canvas in use with custom vectorStyle', () => {
  let { models } = testData();
  models.layers.add('terra-aod');
  models.vectorStyles.setCustom('terra-aod', 'blue-1');
  expect(models.vectorStyles.inUse()).toBe(true);
});

test('canvas in use with threshold ranges', () => {
  let { models } = testData();
  models.layers.add('terra-aod');
  models.vectorStyles.setRange('terra-aod', 1);
  expect(models.vectorStyles.inUse()).toBe(true);
});

test('canvas not in use when not active layers have a vectorStyle', () => {
  let { models } = testData();
  models.layers.add('terra-aod');
  models.vectorStyles.setCustom('terra-aod', 'blue-1');
  models.layers.remove('terra-aod');
  expect(models.vectorStyles.inUse()).toBe(false);
});

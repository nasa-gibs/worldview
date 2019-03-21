import jQuery from 'jquery';
import styles from '../styles';
import fixtures from '../../fixtures';

var unmocked = {};

beforeAll(() => {
  unmocked.getJSON = jQuery.getJSON;
  unmocked.supported = styles.supported;
});

beforeEach(() => { styles.supported = true; });

afterEach(() => {
  jQuery.getJSON = unmocked.getJSON;
  styles.supported = unmocked.supported;
});

function testData() {
  let config = fixtures.config();
  let models = fixtures.models(config);
  return { config, models };
};

test('set a custom palette', (done) => {
  let { models } = testData();
  models.palettes.events.on('set-custom', function (layerId) {
    var palette = models.palettes.get(layerId);
    var colors = palette.legend.colors;
    var labels = palette.legend.tooltips;

    expect(colors).toEqual([
      fixtures.light_blue,
      fixtures.blue,
      fixtures.dark_blue
    ]);
    expect(labels).toEqual(['0', '1', '2']);
    done();
  });
  models.layers.add('terra-aod');
  models.palettes.setCustom('terra-aod', 'blue-1');
});

test('palettte compresses color range', () => {
  let { models, config } = testData();
  config.palettes.custom['blue-1'].colors = ['1', '2', '3', '4', '5', '6'];
  models = fixtures.models(config);
  models.layers.add('terra-aod');
  models.palettes.setCustom('terra-aod', 'blue-1');
  var palette = models.palettes.get('terra-aod');

  expect(palette.legend.colors).toEqual(['1', '3', '5']);
});

test('palette expands color range', () => {
  let { models, config } = testData();
  config.palettes.rendered['terra-aod'].maps[0].entries.colors = [
    '1',
    '2',
    '3',
    '4',
    '5',
    '6'
  ];
  models = fixtures.models(config);
  models.layers.add('terra-aod');
  models.palettes.setCustom('terra-aod', 'blue-1');
  let palette = models.palettes.get('terra-aod');
  let colors = palette.legend.colors;

  expect(colors).toEqual([
    fixtures.light_blue,
    fixtures.light_blue,
    fixtures.blue,
    fixtures.blue,
    fixtures.dark_blue,
    fixtures.dark_blue
  ]);
});

test('exception setting a custom palette when no layer exists', () => {
  let { models } = testData();
  expect(() => models.palettes.setCustom('no-layer', 'blue-1')).toThrow();
});

test('exception setting an unvakud custom palette', () => {
  let { models } = testData();
  expect(() => models.palettes.setCustom('terra-aod', 'no-palette')).toThrow();
});

test('exception setting a custom palette on a imagery layer', () => {
  let { models } = testData();
  expect(() => models.palettes.setCustom('terra0cr', 'blue-1')).toThrow();
});

test('clear a custom palette', () => {
  let { models } = testData();
  let trigger = jest.fn();
  models.palettes.events.trigger = trigger;

  models.layers.add('aqua-aod');
  models.palettes.setCustom('terra-aod', 'blue-1');
  models.palettes.clearCustom('terra-aod');
  let palette = models.palettes.get('terra-aod');

  expect(palette.entries.colors[0]).toBe(fixtures.green);
  expect(palette.legend.tooltips[0]).toBe('0');

  expect(trigger).toBeCalledWith('clear-custom', 'terra-aod', 'active');
  expect(trigger).toBeCalledWith('change');
});

test('set a minimum threshold', () => {
  let { models } = testData();
  let trigger = jest.fn();
  models.palettes.events.trigger = trigger;

  models.layers.add('terra-aod');
  models.palettes.setRange('terra-aod', 1, 2);
  let palette = models.palettes.get('terra-aod');

  expect(palette.min).toBe(1);
  expect(palette.max).not.toBeDefined();
  expect(palette.legend.colors).toEqual([
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
  models.palettes.events.trigger = trigger;

  models.layers.add('terra-aod');
  models.palettes.setRange('terra-aod', 0, 1);
  let palette = models.palettes.get('terra-aod');

  expect(palette.max).toBe(1);
  expect(palette.min).not.toBeDefined();
  expect(palette.legend.colors).toEqual([
    fixtures.green,
    fixtures.yellow,
    '00000000'
  ]);

  expect(trigger).toBeCalledWith('range', 'terra-aod', undefined, 1, 'active');
  expect(trigger).toBeCalledWith('change');
});

test('save custom palette', () => {
  let { models } = testData();
  models.layers.add('aqua-aod');
  models.layers.add('terra-aod');
  models.palettes.setCustom('terra-aod', 'blue-1');
  models.palettes.setCustom('aqua-aod', 'red-1');

  let state = {};
  models.layers.save(state);
  models.palettes.save(state);
  expect(state.l).toEqual([
    {
      id: 'terra-aod',
      attributes: [
        {
          id: 'palette',
          value: 'blue-1'
        }
      ]
    },
    {
      id: 'aqua-aod',
      attributes: [
        {
          id: 'palette',
          value: 'red-1'
        }
      ]
    }
  ]);
});

test('save threshold minimum', () => {
  let { models } = testData();
  models.layers.add('terra-aod');
  models.palettes.setRange('terra-aod', 1, 2);

  var state = {};
  models.layers.save(state);
  models.palettes.save(state);
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
  models.palettes.setRange('terra-aod', 0, 1);

  var state = {};
  models.layers.save(state);
  models.palettes.save(state);
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
  models.palettes.setRange('terra-aod', 1, 1);

  var state = {};
  models.layers.save(state);
  models.palettes.save(state);
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
  models.palettes.save(state);
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
            id: 'palette',
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
  models.palettes.load(state, errors);
  let palette = models.palettes.get('terra-aod');

  expect(palette.custom).toBe('blue-1');
  expect(palette.min).toBe(1);
  expect(palette.max).toBe(1);
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
  models.palettes.load(state, errors);

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
  models.palettes.load(state, errors);

  expect(errors).toHaveLength(1);
});

test('canvas not in use', () => {
  let { models } = testData();
  expect(models.palettes.inUse()).toBe(false);
});

test('canvas in use with custom palette', () => {
  let { models } = testData();
  models.layers.add('terra-aod');
  models.palettes.setCustom('terra-aod', 'blue-1');
  expect(models.palettes.inUse()).toBe(true);
});

test('canvas in use with threshold ranges', () => {
  let { models } = testData();
  models.layers.add('terra-aod');
  models.palettes.setRange('terra-aod', 1);
  expect(models.palettes.inUse()).toBe(true);
});

test('canvas not in use when not active layers have a palette', () => {
  let { models } = testData();
  models.layers.add('terra-aod');
  models.palettes.setCustom('terra-aod', 'blue-1');
  models.layers.remove('terra-aod');
  expect(models.palettes.inUse()).toBe(false);
});

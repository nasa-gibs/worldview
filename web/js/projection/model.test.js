import { projectionModel } from './model';

function testConfig() {
  return {
    defaults: {
      projection: 'geographic'
    },
    projections: {
      'geographic': {
        id: 'geographic',
        epsg: '4326',
        crs: 'EPSG:4326'
      },
      'arctic': {
        id: 'arctic',
        epsg: '3413',
        crs: 'EPSG:3413'
      }
    }
  };
};

test('initializes with default', () => {
  let model = projectionModel(testConfig());
  expect(model.selected.id).toBe('geographic');
  expect(model.selected.crs).toBe('EPSG:4326');
});

test('throws exception with an invalid default', () => {
  let config = testConfig();
  config.defaults.projection = 'invalid';
  expect(() => projectionModel(config)).toThrow();
});

test('selects projection', () => {
  let model = projectionModel(testConfig());
  let listener = jest.fn();
  model.events.on('select', listener);
  model.select('arctic');
  expect(model.selected.id).toBe('arctic');
  expect(model.selected.crs).toBe('EPSG:3413');
  expect(listener).toBeCalled();
});

test('event not fired if selection does not change', () => {
  let model = projectionModel(testConfig());
  let listener = jest.fn();
  model.events.on('select', listener);
  model.select('geographic');
  expect(listener).toHaveBeenCalledTimes(0);
});

test('saves state', () => {
  let model = projectionModel(testConfig());
  let state = {};
  model.save(state);
  expect(state.p).toBe('geographic');
});

test('loads state', () => {
  let model = projectionModel(testConfig());
  let state = {
    'p': 'arctic'
  };
  model.load(state);
  expect(model.selected.id).toBe('arctic');
});

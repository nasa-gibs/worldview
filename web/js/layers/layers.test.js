import { parse } from './layers';
import { layersModel } from './model';
import fixtures from '../fixtures';

function testData() {
  let config = fixtures.config();
  let models = fixtures.models(config);
  return { config, models };
}

describe('permalink 1.0', () => {
  test('supports old style period delimiters', () => {
    let { config } = testData();
    let errors = [];
    let state = {
      products: 'baselayers.terra-cr~overlays.terra-aod.aqua-aod'
    };
    parse(state, errors, config);

    expect(state.l.find(x => x.id === 'terra-cr')).toBeTruthy();
    expect(state.l.find(x => x.id === 'terra-aod')).toBeTruthy();
    expect(state.l.find(x => x.id === 'aqua-aod')).toBeTruthy();
    expect(errors).toHaveLength(0);
  });
});

describe('permalink 1.1', () => {
  test('parses only one baselayer', () => {
    let { config } = testData();
    let errors = [];
    let state = {
      products: 'baselayers,terra-cr'
    };
    parse(state, errors, config);

    expect(state.l[0].id).toBe('terra-cr');
    expect(errors).toHaveLength(0);
  });

  test('parses only one overlay', () => {
    let { config } = testData();
    let errors = [];
    let state = {
      products: 'overlays,terra-aod'
    };
    parse(state, errors, config);

    expect(state.l[0].id).toBe('terra-aod');
    expect(errors).toHaveLength(0);
  });

  test('parses multiple layers', () => {
    let { config } = testData();
    let errors = [];
    let state = {
      products: 'baselayers,terra-cr~overlays,terra-aod,aqua-aod'
    };
    parse(state, errors, config);

    expect(state.l.find(x => x.id === 'terra-cr')).toBeTruthy();
    expect(state.l.find(x => x.id === 'terra-aod')).toBeTruthy();
    expect(state.l.find(x => x.id === 'aqua-aod')).toBeTruthy();
    expect(errors).toHaveLength(0);
  });

  test('empty layer list', () => {
    let { config } = testData();
    let errors = [];
    let state = {
      products: 'baselayers~overlays'
    };
    parse(state, errors, config);

    expect(state.l).toHaveLength(0);
    expect(errors).toHaveLength(0);
  });

  test('skips invalid layers and records an error', () => {
    let { config } = testData();
    let errors = [];
    let state = {
      products: 'baselayers,terra-cr~overlays,layerx,aqua-aod'
    };
    parse(state, errors, config);

    expect(state.l.find(x => x.id === 'terra-cr')).toBeTruthy();
    expect(state.l.find(x => x.id === 'aqua-aod')).toBeTruthy();
    expect(errors).toHaveLength(1);
  });

  test('no layers if no groups found', () => {
    let { config } = testData();
    let errors = [];
    let state = {
      products: 'layerx,layery'
    };

    parse(state, errors, config);
    expect(state.l).toHaveLength(0);
    expect(errors).toHaveLength(2);
  });

  test('hidden layers', () => {
    let { config } = testData();
    let errors = [];
    let state = {
      products: 'baselayers,!terra-cr'
    };
    parse(state, errors, config);

    expect(state.l[0].id).toBe('terra-cr');
    expect(state.l[0].attributes[0].id).toBe('hidden');
    expect(errors).toHaveLength(0);
  });

  test('layer redirects', () => {
    let { config, models } = testData();
    let errors = [];
    config.redirects = {
      layers: {
        'terra-cr': 'aqua-cr'
      }
    };
    models.layers = layersModel(models, config);
    let state = {
      products: 'baselayers,terra-cr'
    };
    parse(state, errors, config);

    expect(state.l[0].id).toBe('aqua-cr');
    expect(errors).toHaveLength(0);
  });
});

describe('permalink 1.2', () => {
  test('parses one layer', () => {
    let { config } = testData();
    let errors = [];
    let state = {
      l: 'terra-cr'
    };
    parse(state, errors, config);

    expect(state.l[0].id).toBe('terra-cr');
    expect(errors).toHaveLength(0);
  });

  test('parses multiple layers', () => {
    let { config } = testData();
    let errors = [];
    let state = {
      l: 'terra-cr,terra-aod,aqua-aod'
    };
    parse(state, errors, config);

    expect(state.l.find(x => x.id === 'terra-cr')).toBeTruthy();
    expect(state.l.find(x => x.id === 'terra-aod')).toBeTruthy();
    expect(state.l.find(x => x.id === 'aqua-aod')).toBeTruthy();
    expect(errors).toHaveLength(0);
  });

  test('empty layer list', () => {
    let { config } = testData();
    let errors = [];
    let state = {
      l: ''
    };
    parse(state, errors, config);

    expect(state.l).toHaveLength(0);
    expect(errors).toHaveLength(0);
  });

  test('skips invalid layers and records an error', () => {
    let { config } = testData();
    let errors = [];
    let state = {
      products: 'terra-cr,layerx,aqua-aod'
    };
    parse(state, errors, config);

    expect(state.l.find(x => x.id === 'terra-cr')).toBeTruthy();
    expect(state.l.find(x => x.id === 'aqua-aod')).toBeTruthy();
    expect(errors).toHaveLength(1);
  });

  test('hidden layers', () => {
    let { config } = testData();
    let errors = [];
    let state = {
      l: 'terra-cr(hidden)'
    };

    parse(state, errors, config);
    expect(state.l[0].id).toBe('terra-cr');
    expect(state.l[0].attributes[0].id).toBe('hidden');
    expect(errors).toHaveLength(0);
  });

  test('opacity', () => {
    let { config } = testData();
    let errors = [];
    let state = {
      l: 'terra-cr(opacity=0.5)'
    };
    parse(state, errors, config);
    let attr = state.l[0].attributes[0];

    expect(state.l[0].id).toBe('terra-cr');
    expect(attr.id).toBe('opacity');
    expect(attr.value).toBe('0.5');
    expect(errors).toHaveLength(0);
  });

  test('minimum threshold', () => {
    let { config } = testData();
    let errors = [];
    let state = {
      l: 'terra-cr(min=0.5)'
    };
    parse(state, errors, config);

    var attr = state.l[0].attributes[0];
    expect(state.l[0].id).toBe('terra-cr');
    expect(attr.id).toBe('min');
    expect(attr.value).toBe('0.5');
    expect(errors).toHaveLength(0);
  });

  test('maximum threshold', () => {
    let { config } = testData();
    let errors = [];
    let state = {
      l: 'terra-cr(max=0.5)'
    };
    parse(state, errors, config);

    var attr = state.l[0].attributes[0];
    expect(state.l[0].id).toBe('terra-cr');
    expect(attr.id).toBe('max');
    expect(attr.value).toBe('0.5');
    expect(errors).toHaveLength(0);
  });

  test('layer redirects', () => {
    let { config, models } = testData();
    let errors = [];
    config.redirects = {
      layers: {
        'terra-cr': 'aqua-cr'
      }
    };
    models.layers = layersModel(models, config);
    let state = {
      l: 'terra-cr'
    };
    parse(state, errors, config);

    expect(state.l[0].id).toBe('aqua-cr');
    expect(errors).toHaveLength(0);
  });
});

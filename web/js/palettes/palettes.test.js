import fixtures from '../fixtures';
import { parse as layersParse } from '../layers/layers';
import palettes from './palettes';

var unmocked = {};

beforeAll(() => {
  unmocked.supported = palettes.supported;
});

beforeEach(() => { palettes.supported = true; });

afterEach(() => {
  palettes.supported = unmocked.supported;
});

function testData() {
  let config = fixtures.config();
  return { config };
};

describe('permalink 1.2', () => {
  test('parses palette for valid layer', () => {
    let { config } = testData();
    let errors = [];
    let state = {
      l: 'terra-aod(palette=blue-1)'
    };
    layersParse(state, errors, config);
    let attr = state.l[0].attributes[0];

    expect(attr.id).toBe('palette');
    expect(attr.value).toBe('blue-1');
    expect(errors).toHaveLength(0);
  });
});

describe('permalink 1.1', () => {
  test('parses palette for valid layer', () => {
    let { config } = testData();
    let errors = [];
    let state = {
      l: 'terra-aod',
      palettes: 'terra-aod,blue-1'
    };
    layersParse(state, errors, config);
    palettes.parse(state, errors, config);
    var attr = state.l[0].attributes[0];

    expect(attr.id).toBe('palette');
    expect(attr.value).toBe('blue-1');
    expect(errors).toHaveLength(0);
  });

  test('parses palette for two valid layers', () => {
    let { config } = testData();
    let errors = [];
    let state = {
      l: 'terra-aod,aqua-aod',
      palettes: 'terra-aod,blue-1~aqua-aod,red-1'
    };
    layersParse(state, errors, config);
    palettes.parse(state, errors, config);

    let attr1 = state.l[0].attributes[0];
    expect(attr1.id).toBe('palette');
    expect(attr1.value).toBe('blue-1');

    let attr2 = state.l[1].attributes[0];
    expect(attr2.id).toBe('palette');
    expect(attr2.value).toBe('red-1');

    expect(errors).toHaveLength(0);
  });

  test('error if palette assigned to a layer that is not active', () => {
    let { config } = testData();
    let errors = [];
    var state = {
      l: 'terra-aod',
      palettes: 'aqua-aod,red-1'
    };
    layersParse(state, errors, config);
    palettes.parse(state, errors, config);
    expect(errors).toHaveLength(1);
  });
});

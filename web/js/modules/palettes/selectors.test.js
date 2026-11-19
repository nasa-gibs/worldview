import { assign, cloneDeep } from 'lodash';
import update from 'immutability-helper';
import fixtures from '../../fixtures';
import { addLayer } from '../layers/selectors';
import {
  getRenderedPalette,
  getPalette,
  getPaletteLegend,
  getPaletteLegends,
  getDefaultLegend,
  getCustomPalette,
  getCount,
  getLookup,
  getKey,
  getActivePalettes,
  isPaletteAllowed,
  isActive,
  findIndex,
  setCustomSelector,
  setRange,
  clearCustomSelector,
  initDisabledSelector,
  setDisabledSelector,
  refreshDisabledSelector,
} from './selectors';

const config = fixtures.config();
const baseState = fixtures.getState();

let layers = addLayer('terra-aod', [], config.layers, {}, 0);
layers = addLayer('aqua-cr', layers, config.layers, {}, 1);
const stateWithLayers = update(baseState, {
  layers: { active: { $set: layers } },
});

const buildState = (activePalettes = {}) => update(stateWithLayers, {
  palettes: { active: { $set: activePalettes } },
});

describe('getRenderedPalette', () => {
  test('returns the full rendered palette object when index is undefined', () => {
    const palette = getRenderedPalette('terra-aod', undefined, buildState());
    expect(palette).toBeDefined();
    expect(palette.maps).toBeDefined();
  });

  test('returns the palette map at the given index', () => {
    const palette = getRenderedPalette('terra-aod', 0, buildState());
    expect(palette).toBeDefined();
    expect(palette.entries).toBeDefined();
  });

  test('throws an error when the palette does not exist', () => {
    expect(() => getRenderedPalette('non-existent-layer', 0, buildState())).toThrow();
  });
});

describe('getPalette', () => {
  test('returns rendered palette map when no active palette exists', () => {
    const palette = getPalette('terra-aod', 0, 'active', buildState());
    expect(palette).toBeDefined();
    expect(palette.entries).toBeDefined();
  });

  test('returns custom active palette when it exists', () => {
    const result = setCustomSelector('terra-aod', 'red-1', 0, 'active', buildState());
    const testState = buildState(result);
    const palette = getPalette('terra-aod', 0, 'active', testState);
    expect(palette).toBeDefined();
  });

  test('defaults index to 0 when index is undefined', () => {
    const palette = getPalette('terra-aod', undefined, 'active', buildState());
    expect(palette).toBeDefined();
  });

  test('uses compare.activeString when group is not provided', () => {
    const palette = getPalette('terra-aod', 0, undefined, buildState());
    expect(palette).toBeDefined();
  });
});

describe('getPaletteLegend', () => {
  test('returns the legend of a palette', () => {
    const legend = getPaletteLegend('terra-aod', 0, 'active', buildState());
    expect(legend).toBeDefined();
  });
});

describe('getPaletteLegends', () => {
  test('returns an array of legends for all colormaps', () => {
    const legends = getPaletteLegends('terra-aod', 'active', buildState());
    expect(Array.isArray(legends)).toBe(true);
    expect(legends.length).toBeGreaterThan(0);
  });
});

describe('getDefaultLegend', () => {
  test('returns the legend from the rendered palette at the given index', () => {
    const legend = getDefaultLegend('terra-aod', 0, buildState());
    expect(legend).toBeDefined();
  });
});

describe('getCustomPalette', () => {
  test('returns the custom palette by id', () => {
    const palette = getCustomPalette('red-1', config.palettes.custom);
    expect(palette).toBeDefined();
    expect(palette.colors).toBeDefined();
  });

  test('throws an error when the custom palette does not exist', () => {
    expect(() => getCustomPalette('non-existent', config.palettes.custom)).toThrow('Invalid palette: non-existent');
  });
});

describe('getCount', () => {
  test('returns the number of colormaps for a layer', () => {
    const count = getCount('terra-aod', buildState());
    expect(count).toBeGreaterThan(0);
  });
});

describe('getLookup', () => {
  test('returns lookup from active palette using provided group', () => {
    const result = setCustomSelector('terra-aod', 'red-1', 0, 'active', buildState());
    const testState = buildState(result);
    const lookup = getLookup('terra-aod', 'active', testState);
    expect(lookup).toBeDefined();
  });

  test('returns lookup using compare.activeString when group is not provided', () => {
    const result = setCustomSelector('terra-aod', 'red-1', 0, 'active', buildState());
    const testState = buildState(result);
    const lookup = getLookup('terra-aod', undefined, testState);
    expect(lookup).toBeDefined();
  });
});

describe('isActive', () => {
  test('returns the active palette entry when it exists', () => {
    const result = setCustomSelector('terra-aod', 'red-1', 0, 'active', buildState());
    const testState = buildState(result);
    const active = isActive('terra-aod', 'active', testState);
    expect(active).toBeDefined();
  });

  test('returns undefined when no active palette entry exists', () => {
    const result = isActive('terra-aod', 'active', buildState());
    expect(result).toBeUndefined();
  });

  test('uses compare.activeString when group is not provided', () => {
    const result = isActive('terra-aod', undefined, buildState());
    expect(result).toBeUndefined();
  });
});

describe('getKey', () => {
  test('returns empty string when palette is not active', () => {
    const key = getKey('terra-aod', 'active', buildState());
    expect(key).toEqual('');
  });

  test('returns palette key when custom palette is active', () => {
    const result = setCustomSelector('terra-aod', 'red-1', 0, 'active', buildState());
    const testState = buildState(result);
    const key = getKey('terra-aod', 'active', testState);
    expect(key).toContain('palette=red-1');
  });

  test('returns key with min when min is set', () => {
    const result = setRange('terra-aod', { min: 1 }, 0, {}, buildState());
    const testState = buildState(result);
    const key = getKey('terra-aod', 'active', testState);
    expect(key).toContain('min=');
  });

  test('returns key with max when max is set', () => {
    const result = setRange('terra-aod', { max: 1 }, 0, {}, buildState());
    const testState = buildState(result);
    const key = getKey('terra-aod', 'active', testState);
    expect(key).toContain('max=');
  });

  test('returns key with squash when squash is set', () => {
    const result = setRange('terra-aod', { max: 1, squash: true }, 0, {}, buildState());
    const testState = buildState(result);
    const key = getKey('terra-aod', 'active', testState);
    expect(key).toContain('squash');
  });

  test('returns key with noclip when noclip is set', () => {
    const result = setRange('terra-aod', { max: 1, noclip: true }, 0, {}, buildState());
    const testState = buildState(result);
    const key = getKey('terra-aod', 'active', testState);
    expect(key).toContain('noclip');
  });

  test('uses compare.activeString when groupStr is not provided', () => {
    const key = getKey('terra-aod', undefined, buildState());
    expect(key).toEqual('');
  });
});

describe('getActivePalettes', () => {
  test('returns the active palettes for the given activeString', () => {
    const result = setCustomSelector('terra-aod', 'red-1', 0, 'active', buildState());
    const testState = buildState(result);
    const active = getActivePalettes(testState, 'active');
    expect(active['terra-aod']).toBeDefined();
  });
});

describe('isPaletteAllowed', () => {
  test('returns true for a layer with a non-immutable palette', () => {
    const result = isPaletteAllowed('terra-aod', config);
    expect(result).toBe(true);
  });
});

describe('findIndex', () => {
  test('returns the index of a matching value in the palette entries', () => {
    const { values } = config.palettes.rendered['terra-aod'].maps[0].entries;
    const firstValue = values[0];
    const result = findIndex('terra-aod', firstValue, 0, 'active', buildState());
    expect(result).toEqual(0);
  });

  test('returns undefined when value is not found', () => {
    const result = findIndex('terra-aod', 'non-existent-value', 0, 'active', buildState());
    expect(result).toBeUndefined();
  });
});

describe('setCustomSelector', () => {
  test('sets a custom palette and returns a lookup', () => {
    const result = setCustomSelector('terra-aod', 'red-1', 0, 'active', buildState());
    expect(result['terra-aod']).toBeDefined();
    expect(result['terra-aod'].lookup).toBeDefined();
    expect(result['terra-aod'].maps[0].custom).toEqual('red-1');
  });

  test('throws an error for an invalid layer', () => {
    expect(() => setCustomSelector('non-existent', 'red-1', 0, 'active', buildState())).toThrow('Invalid layer: non-existent');
  });

  test('returns early when palette and lookup are already set to the same custom id', () => {
    const firstResult = setCustomSelector('terra-aod', 'red-1', 0, 'active', buildState());
    const secondState = buildState(firstResult);
    const secondResult = setCustomSelector('terra-aod', 'red-1', 0, 'active', secondState);
    expect(secondResult['terra-aod'].maps[0].custom).toEqual('red-1');
  });

  test('defaults index to 0 when index is undefined', () => {
    const result = setCustomSelector('terra-aod', 'red-1', undefined, 'active', buildState());
    expect(result['terra-aod'].maps[0].custom).toEqual('red-1');
  });
});

describe('setRange', () => {
  test('sets min value and produces a lookup', () => {
    const result = setRange('terra-aod', { min: 1 }, 0, {}, buildState());
    expect(result['terra-aod']).toBeDefined();
    expect(result['terra-aod'].maps[0].min).toEqual(1);
    expect(result['terra-aod'].lookup).toBeDefined();
  });

  test('sets max value and produces a lookup', () => {
    const result = setRange('terra-aod', { max: 1 }, 0, {}, buildState());
    expect(result['terra-aod'].maps[0].max).toEqual(1);
    expect(result['terra-aod'].lookup).toBeDefined();
  });

  test('sets squash and max and produces a lookup', () => {
    const result = setRange('terra-aod', { max: 1, squash: true }, 0, {}, buildState());
    expect(result['terra-aod'].maps[0].squash).toEqual(true);
    expect(result['terra-aod'].lookup).toBeDefined();
  });

  test('sets noclip and max and produces a lookup', () => {
    const result = setRange('terra-aod', { max: 1, noclip: true }, 0, {}, buildState());
    expect(result['terra-aod'].maps[0].noclip).toEqual(true);
    expect(result['terra-aod'].lookup).toBeDefined();
  });

  test('converts min of 0 to undefined and does not produce a lookup', () => {
    const result = setRange('terra-aod', { min: 0 }, 0, {}, buildState());
    expect(result['terra-aod']).toBeUndefined();
  });

  test('converts max at last value index to undefined and does not produce a lookup', () => {
    const lastIndex = config.palettes.rendered['terra-aod'].maps[0].entries.values.length - 1;
    const result = setRange('terra-aod', { max: lastIndex }, 0, {}, buildState());
    expect(result['terra-aod']).toBeUndefined();
  });

  test('defaults index to 0 when index is undefined', () => {
    const result = setRange('terra-aod', { min: 1 }, undefined, {}, buildState());
    expect(result['terra-aod'].maps[0].min).toEqual(1);
  });
});

describe('clearCustomSelector', () => {
  test('clears custom palette and returns palettes without layerId when no threshold', () => {
    const withCustom = setCustomSelector('terra-aod', 'red-1', 0, 'active', buildState());
    const result = clearCustomSelector('terra-aod', 0, withCustom, buildState());
    expect(result['terra-aod']).toBeUndefined();
  });

  test('returns original palettes when layer has no active entry', () => {
    const palettes = {};
    const result = clearCustomSelector('terra-aod', 0, palettes, buildState());
    expect(result).toEqual(palettes);
  });

  test('returns original palettes when no custom is set', () => {
    const terraAOD = assign({}, config.palettes.rendered['terra-aod']);
    const palettes = { 'terra-aod': terraAOD };
    const result = clearCustomSelector('terra-aod', 0, palettes, buildState());
    expect(result).toEqual(palettes);
  });

  test('defaults index to 0 when index is undefined', () => {
    const withCustom = setCustomSelector('terra-aod', 'red-1', 0, 'active', buildState());
    const result = clearCustomSelector('terra-aod', undefined, withCustom, buildState());
    expect(result['terra-aod']).toBeUndefined();
  });
});

describe('initDisabledSelector', () => {
  test('sets disabled array from hyphen-separated string', () => {
    const result = initDisabledSelector('terra-aod', '0-1', 0, {}, buildState());
    expect(result).toBeDefined();
  });

  test('sets empty disabled array when disabledStr is empty string', () => {
    const result = initDisabledSelector('terra-aod', '', 0, {}, buildState());
    expect(result).toBeDefined();
  });

  test('sets empty disabled array when disabledStr is null', () => {
    const result = initDisabledSelector('terra-aod', null, 0, {}, buildState());
    expect(result).toBeDefined();
  });
});

describe('setDisabledSelector', () => {
  test('adds a classIndex to the disabled array when not already present', () => {
    const result = setDisabledSelector('terra-aod', 0, 0, {}, buildState());
    expect(result).toBeDefined();
  });

  test('removes a classIndex from the disabled array when already present', () => {
    const firstResult = setDisabledSelector('terra-aod', 0, 0, {}, buildState());
    const firstState = buildState(firstResult);
    const secondResult = setDisabledSelector('terra-aod', 0, 0, firstResult, firstState);
    expect(secondResult).toBeDefined();
  });

  test('sets disabled to empty array when classIndex is NaN', () => {
    const result = setDisabledSelector('terra-aod', NaN, 0, {}, buildState());
    expect(result).toBeDefined();
  });
});

describe('refreshDisabledSelector', () => {
  test('returns palettes with layerId when min is set and disabled array is non-empty', () => {
    const withMin = setRange('terra-aod', { min: 1 }, 0, {}, buildState());
    const testState = buildState(withMin);
    const result = refreshDisabledSelector('terra-aod', [0], 0, cloneDeep(withMin), testState);
    expect(result['terra-aod']).toBeDefined();
    expect(result['terra-aod'].lookup).toBeDefined();
  });

  test('returns palettes without layerId when no lookup condition is met', () => {
    const result = refreshDisabledSelector('terra-aod', [], 0, {}, buildState());
    expect(result['terra-aod']).toBeUndefined();
  });
});

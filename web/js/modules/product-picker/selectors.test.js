import {
  getLayersForProjection,
  getSourcesForProjection,
  getCategoryConfig,
} from './selectors';
import buildLayerFacetProps from './format-config';
import { getSelectedDate } from '../date/selectors';
import util from '../../util/util';

jest.mock('./format-config');
jest.mock('../date/selectors', () => ({
  getSelectedDate: jest.fn(),
}));
jest.mock('../../util/util', () => ({
  __esModule: true,
  default: {
    decodeHTML: jest.fn((val) => val.replace('&amp;', '&')),
  },
}));

const selectedDate = new Date('2024-01-01');

const makeState = (overrides = {}) => ({
  config: {
    layerOrder: [],
    layers: {},
    measurements: {},
    categories: {},
    categoryGroupOrder: [],
    ...overrides.config,
  },
  proj: { id: 'geographic', ...overrides.proj },
  productPicker: {
    selectedMeasurement: null,
    categoryType: 'science',
    ...overrides.productPicker,
  },
  ...overrides,
});

describe('getLayersForProjection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getSelectedDate.mockReturnValue(selectedDate);
  });

  it('returns only layers that have the active projection', () => {
    buildLayerFacetProps.mockReturnValue([
      { id: 'layer1', projections: { geographic: {} } },
      { id: 'layer2', projections: { arctic: {} } },
    ]);
    const state = makeState({ config: { layerOrder: ['layer1', 'layer2'] } });
    const result = getLayersForProjection(state);
    expect(result.map((l) => l.id)).toEqual(['layer1']);
  });

  it('returns empty array when no layers match the active projection', () => {
    buildLayerFacetProps.mockReturnValue([
      { id: 'layer1', projections: { arctic: {} } },
    ]);
    const state = makeState({ config: { layerOrder: ['layer1'] } });
    const result = getLayersForProjection(state);
    expect(result).toEqual([]);
  });

  it('filters out layers without a projections property', () => {
    buildLayerFacetProps.mockReturnValue([
      { id: 'layer1' },
      { id: 'layer2', projections: { geographic: {} } },
    ]);
    const state = makeState({ config: { layerOrder: ['layer1', 'layer2'] } });
    const result = getLayersForProjection(state);
    expect(result.map((l) => l.id)).toEqual(['layer2']);
  });

  it('sorts layers by their position in layerOrder', () => {
    buildLayerFacetProps.mockReturnValue([
      { id: 'layer3', projections: { geographic: {} } },
      { id: 'layer1', projections: { geographic: {} } },
      { id: 'layer2', projections: { geographic: {} } },
    ]);
    const state = makeState({ config: { layerOrder: ['layer1', 'layer2', 'layer3'] } });
    const result = getLayersForProjection(state);
    expect(result.map((l) => l.id)).toEqual(['layer1', 'layer2', 'layer3']);
  });

  it('uses projection-specific title when available', () => {
    buildLayerFacetProps.mockReturnValue([
      {
        id: 'layer1',
        title: 'Default Title',
        projections: { geographic: { title: 'Geo Title' } },
      },
    ]);
    const state = makeState({ config: { layerOrder: ['layer1'] } });
    const result = getLayersForProjection(state);
    expect(result[0].title).toBe('Geo Title');
  });

  it('keeps original title when projection metadata has no title', () => {
    buildLayerFacetProps.mockReturnValue([
      {
        id: 'layer1',
        title: 'Default Title',
        projections: { geographic: {} },
      },
    ]);
    const state = makeState({ config: { layerOrder: ['layer1'] } });
    const result = getLayersForProjection(state);
    expect(result[0].title).toBe('Default Title');
  });

  it('uses projection-specific subtitle when available', () => {
    buildLayerFacetProps.mockReturnValue([
      {
        id: 'layer1',
        subtitle: 'Default Subtitle',
        projections: { geographic: { subtitle: 'Geo Subtitle' } },
      },
    ]);
    const state = makeState({ config: { layerOrder: ['layer1'] } });
    const result = getLayersForProjection(state);
    expect(result[0].subtitle).toBe('Geo Subtitle');
  });

  it('keeps original subtitle when projection metadata has no subtitle', () => {
    buildLayerFacetProps.mockReturnValue([
      {
        id: 'layer1',
        subtitle: 'Default Subtitle',
        projections: { geographic: {} },
      },
    ]);
    const state = makeState({ config: { layerOrder: ['layer1'] } });
    const result = getLayersForProjection(state);
    expect(result[0].subtitle).toBe('Default Subtitle');
  });

  it('decodes HTML entities in subtitle', () => {
    util.decodeHTML.mockReturnValue('NASA & GSFC');
    buildLayerFacetProps.mockReturnValue([
      {
        id: 'layer1',
        subtitle: 'NASA &amp; GSFC',
        projections: { geographic: {} },
      },
    ]);
    const state = makeState({ config: { layerOrder: ['layer1'] } });
    const result = getLayersForProjection(state);
    expect(util.decodeHTML).toHaveBeenCalledWith('NASA &amp; GSFC');
    expect(result[0].subtitle).toBe('NASA & GSFC');
  });

  it('does not call decodeHTML when subtitle has no HTML entities', () => {
    buildLayerFacetProps.mockReturnValue([
      {
        id: 'layer1',
        subtitle: 'Plain Subtitle',
        projections: { geographic: {} },
      },
    ]);
    const state = makeState({ config: { layerOrder: ['layer1'] } });
    getLayersForProjection(state);
    expect(util.decodeHTML).not.toHaveBeenCalled();
  });

  it('handles null proj gracefully by returning empty array', () => {
    buildLayerFacetProps.mockReturnValue([
      { id: 'layer1', projections: { geographic: {} } },
    ]);
    const state = makeState({ proj: null });
    const result = getLayersForProjection(state);
    expect(result).toEqual([]);
  });

  it('passes config and selectedDate to buildLayerFacetProps', () => {
    buildLayerFacetProps.mockReturnValue([]);
    const state = makeState();
    getLayersForProjection(state);
    expect(buildLayerFacetProps).toHaveBeenCalledWith(state.config, selectedDate);
  });
});

describe('getSourcesForProjection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns undefined when no measurement matches selectedMeasurement', () => {
    const state = makeState({
      config: {
        measurements: { m1: { id: 'measure-1', sources: {} } },
        layers: {},
      },
      productPicker: { selectedMeasurement: 'non-existent' },
    });
    const result = getSourcesForProjection(state);
    expect(result).toBeUndefined();
  });

  it('returns sources sorted by title for the active projection', () => {
    const state = makeState({
      config: {
        measurements: {
          m1: {
            id: 'measure-1',
            sources: {
              s1: { title: 'Zebra Source', settings: ['layer1'] },
              s2: { title: 'Alpha Source', settings: ['layer2'] },
            },
          },
        },
        layers: {
          layer1: { projections: { geographic: {} }, layergroup: 'Some Group' },
          layer2: { projections: { geographic: {} }, layergroup: 'Some Group' },
        },
      },
      productPicker: { selectedMeasurement: 'measure-1' },
    });
    const result = getSourcesForProjection(state);
    expect(result[0].title).toBe('Alpha Source');
    expect(result[1].title).toBe('Zebra Source');
  });

  it('excludes sources with no layers in the active projection', () => {
    const state = makeState({
      config: {
        measurements: {
          m1: {
            id: 'measure-1',
            sources: {
              s1: { title: 'Arctic Only', settings: ['layer1'] },
            },
          },
        },
        layers: {
          layer1: { projections: { arctic: {} }, layergroup: 'Some Group' },
        },
      },
      productPicker: { selectedMeasurement: 'measure-1' },
    });
    const result = getSourcesForProjection(state);
    expect(result).toEqual([]);
  });

  it('excludes orbital track layers for non-track measurement groups', () => {
    const state = makeState({
      config: {
        measurements: {
          m1: {
            id: 'measure-1',
            sources: {
              s1: { title: 'Orbit Source', settings: ['orbitLayer'] },
            },
          },
        },
        layers: {
          orbitLayer: { projections: { geographic: {} }, layergroup: 'Orbital Track' },
        },
      },
      productPicker: { selectedMeasurement: 'measure-1' },
    });
    const result = getSourcesForProjection(state);
    expect(result).toEqual([]);
  });

  it('includes orbital track layers when measurement is the orbital-track group', () => {
    const state = makeState({
      config: {
        measurements: {
          m1: {
            id: 'orbital-track',
            sources: {
              s1: { title: 'Orbit Source', settings: ['orbitLayer'] },
            },
          },
        },
        layers: {
          orbitLayer: { projections: { geographic: {} }, layergroup: 'Orbital Track' },
        },
      },
      productPicker: { selectedMeasurement: 'orbital-track' },
    });
    const result = getSourcesForProjection(state);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Orbit Source');
  });

  it('returns undefined when sources is falsy (no current measurement)', () => {
    const state = makeState({
      config: {
        measurements: {},
        layers: {},
      },
      productPicker: { selectedMeasurement: 'measure-1' },
    });
    const result = getSourcesForProjection(state);
    expect(result).toBeUndefined();
  });

  it('skips layers that are missing from config.layers', () => {
    const state = makeState({
      config: {
        measurements: {
          m1: {
            id: 'measure-1',
            sources: {
              s1: { title: 'Source A', settings: ['missingLayer', 'layer1'] },
            },
          },
        },
        layers: {
          layer1: { projections: { geographic: {} }, layergroup: 'Some Group' },
        },
      },
      productPicker: { selectedMeasurement: 'measure-1' },
    });
    const result = getSourcesForProjection(state);
    expect(result).toHaveLength(1);
  });

  it('skips layers that have no projections property', () => {
    const state = makeState({
      config: {
        measurements: {
          m1: {
            id: 'measure-1',
            sources: {
              s1: { title: 'Source A', settings: ['layer1'] },
            },
          },
        },
        layers: {
          layer1: { layergroup: 'Some Group' },
        },
      },
      productPicker: { selectedMeasurement: 'measure-1' },
    });
    const result = getSourcesForProjection(state);
    expect(result).toEqual([]);
  });

  it('includes non-orbital-track layers in geographic projection', () => {
    const state = makeState({
      config: {
        measurements: {
          m1: {
            id: 'measure-1',
            sources: {
              s1: { title: 'Normal Source', settings: ['layer1'] },
            },
          },
        },
        layers: {
          layer1: { projections: { geographic: {} }, layergroup: 'Science' },
        },
      },
      productPicker: { selectedMeasurement: 'measure-1' },
    });
    const result = getSourcesForProjection(state);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Normal Source');
  });
});

describe('getCategoryConfig', () => {
  it('returns categories[firstTab] when categoryType is "measurements"', () => {
    const scienceCategory = { measurements: ['m1'] };
    const state = makeState({
      config: {
        categories: { science: scienceCategory, hazards: {} },
        categoryGroupOrder: ['science', 'hazards'],
      },
      productPicker: { categoryType: 'measurements' },
    });
    const result = getCategoryConfig(state);
    expect(result).toBe(scienceCategory);
  });

  it('returns categories[categoryType] when categoryType is not "measurements"', () => {
    const hazardsCategory = { measurements: ['m2'] };
    const state = makeState({
      config: {
        categories: { science: {}, hazards: hazardsCategory },
        categoryGroupOrder: ['science', 'hazards'],
      },
      productPicker: { categoryType: 'hazards' },
    });
    const result = getCategoryConfig(state);
    expect(result).toBe(hazardsCategory);
  });

  it('returns undefined when categoryType does not match any category key', () => {
    const state = makeState({
      config: {
        categories: { science: {}, hazards: {} },
        categoryGroupOrder: ['science', 'hazards'],
      },
      productPicker: { categoryType: 'nonexistent' },
    });
    const result = getCategoryConfig(state);
    expect(result).toBeUndefined();
  });

  it('returns featured category when categoryType is "featured"', () => {
    const featuredCategory = { All: { measurements: ['m1'] } };
    const state = makeState({
      config: {
        categories: { science: {}, featured: featuredCategory },
        categoryGroupOrder: ['science', 'featured'],
      },
      productPicker: { categoryType: 'featured' },
    });
    const result = getCategoryConfig(state);
    expect(result).toBe(featuredCategory);
  });

  it('uses the first entry of categoryGroupOrder as firstTab', () => {
    const firstTabCategory = { measurements: ['m1'] };
    const state = makeState({
      config: {
        categories: { land: firstTabCategory, ocean: {} },
        categoryGroupOrder: ['land', 'ocean'],
      },
      productPicker: { categoryType: 'measurements' },
    });
    const result = getCategoryConfig(state);
    expect(result).toBe(firstTabCategory);
  });
});

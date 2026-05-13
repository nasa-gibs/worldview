import buildLayerFacetProps from './format-config';
import { available } from '../layers/selectors';
import { formatDisplayDate } from '../date/util';

jest.mock('../layers/selectors', () => ({
  available: jest.fn(),
}));

jest.mock('../../util/util', () => ({
  __esModule: true,
  default: {
    decodeHTML: jest.fn((val) => val.replace('&amp;', '&')),
  },
}));

jest.mock('../date/util', () => ({
  formatDisplayDate: jest.fn(() => '2024-01-01'),
}));

const selectedDate = new Date('2024-01-01');

function buildConfig(layerOverrides = {}, extra = {}) {
  const layers = {
    layer1: {
      id: 'layer1',
      type: 'wmts',
      subtitle: 'Source A',
      ...layerOverrides,
    },
  };
  return {
    layers,
    measurements: {
      'Aerosol Optical Depth': {
        sources: {
          MODIS: { settings: ['layer1'] },
        },
      },
    },
    categories: {
      atmosphere: {
        Aerosols: {
          measurements: ['Aerosol Optical Depth'],
        },
      },
    },
    ...extra,
  };
}

describe('buildLayerFacetProps', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    available.mockReturnValue(false);
  });

  describe('setTypeProp - raster types', () => {
    it.each(['wms', 'wmts', 'xyz', 'composite:wmts', 'esriMapServer'])(
      'sets type to "Raster (Mosaicked)" for type "%s"',
      (type) => {
        const config = buildConfig({ type });
        const result = buildLayerFacetProps(config, selectedDate);
        expect(result[0].type).toBe('Raster (Mosaicked)');
      },
    );

    it('sets type to "Raster (Granule)" for granule type', () => {
      const config = buildConfig({ type: 'granule' });
      const result = buildLayerFacetProps(config, selectedDate);
      expect(result[0].type).toBe('Raster (Granule)');
    });

    it('sets type to "Dynamically-rendered" for titiler type', () => {
      const config = buildConfig({ type: 'titiler' });
      const result = buildLayerFacetProps(config, selectedDate);
      expect(result[0].type).toBe('Dynamically-rendered');
    });

    it('sets type to "Vector" for vector type', () => {
      const config = buildConfig({ type: 'vector' });
      const result = buildLayerFacetProps(config, selectedDate);
      expect(result[0].type).toBe('Vector');
    });

    it('sets type to "Vector" for indexedVector type', () => {
      const config = buildConfig({ type: 'indexedVector' });
      const result = buildLayerFacetProps(config, selectedDate);
      expect(result[0].type).toBe('Vector');
    });

    it('capitalizes an unknown type', () => {
      const config = buildConfig({ type: 'custom' });
      const result = buildLayerFacetProps(config, selectedDate);
      expect(result[0].type).toBe('Custom');
    });
  });

  describe('setChartableProp', () => {
    it('sets analysis to Chartable when all conditions are met', () => {
      const config = buildConfig({
        type: 'wmts',
        palette: { id: 'palette1' },
        colormapType: 'continuous',
        layerPeriod: 'Daily',
      });
      const result = buildLayerFacetProps(config, selectedDate);
      expect(result[0].analysis).toEqual(['Chartable (Raster-based)']);
    });

    it('does not set analysis when palette is missing', () => {
      const config = buildConfig({
        type: 'wmts',
        colormapType: 'continuous',
        layerPeriod: 'Daily',
      });
      const result = buildLayerFacetProps(config, selectedDate);
      expect(result[0].analysis).toBeUndefined();
    });

    it('does not set analysis when colormapType is not continuous', () => {
      const config = buildConfig({
        type: 'wmts',
        palette: { id: 'palette1' },
        colormapType: 'classification',
        layerPeriod: 'Daily',
      });
      const result = buildLayerFacetProps(config, selectedDate);
      expect(result[0].analysis).toBeUndefined();
    });

    it('does not set analysis when layerPeriod is not Daily', () => {
      const config = buildConfig({
        type: 'wmts',
        palette: { id: 'palette1' },
        colormapType: 'continuous',
        layerPeriod: 'Monthly',
      });
      const result = buildLayerFacetProps(config, selectedDate);
      expect(result[0].analysis).toBeUndefined();
    });

    it('does not set analysis when disableCharting is true', () => {
      const config = buildConfig({
        type: 'wmts',
        palette: { id: 'palette1' },
        colormapType: 'continuous',
        layerPeriod: 'Daily',
        disableCharting: true,
      });
      const result = buildLayerFacetProps(config, selectedDate);
      expect(result[0].analysis).toBeUndefined();
    });
  });

  describe('setCoverageFacetProp', () => {
    it('sets coverage to "Always Available" when no date info is present', () => {
      const config = buildConfig({ type: 'wmts' });
      const result = buildLayerFacetProps(config, selectedDate);
      expect(result[0].coverage).toEqual(['Always Available']);
    });

    it('sets coverage to available date string when layer is available on selectedDate', () => {
      available.mockReturnValue(true);
      formatDisplayDate.mockReturnValue('Jan 01, 2024');
      const config = buildConfig({
        type: 'wmts',
        startDate: '2020-01-01',
      });
      const result = buildLayerFacetProps(config, selectedDate);
      expect(result[0].coverage).toEqual(['Available Jan 01, 2024']);
    });

    it('does not set coverage when layer has date info but is not available', () => {
      available.mockReturnValue(false);
      const config = buildConfig({
        type: 'wmts',
        startDate: '2020-01-01',
      });
      const result = buildLayerFacetProps(config, selectedDate);
      expect(result[0].coverage).toBeUndefined();
    });

    it('deletes existing coverage prop and sets Always Available when no date info present', () => {
      const config = buildConfig({
        type: 'wmts',
        coverage: ['stale coverage'],
      });
      available.mockReturnValue(false);
      const result = buildLayerFacetProps(config, selectedDate);
      expect(result[0].coverage).toEqual(['Always Available']);
    });

    it('deletes existing coverage and leaves undefined when has dates but not available', () => {
      available.mockReturnValue(false);
      const config = buildConfig({
        type: 'wmts',
        startDate: '2020-01-01',
        coverage: ['stale coverage'],
      });
      const result = buildLayerFacetProps(config, selectedDate);
      expect(result[0].coverage).toBeUndefined();
    });
  });

  describe('setLayerProp - sources via subtitle', () => {
    it('sets sources from subtitle', () => {
      const config = buildConfig({ type: 'wmts', subtitle: 'NASA / GSFC' });
      const result = buildLayerFacetProps(config, selectedDate);
      expect(result[0].sources).toEqual(['NASA / GSFC']);
    });

    it('decodes HTML entities in subtitle', () => {
      const config = buildConfig({ type: 'wmts', subtitle: 'NASA &amp; GSFC' });
      const result = buildLayerFacetProps(config, selectedDate);
      expect(result[0].sources).toEqual(['NASA & GSFC']);
    });

    it('does not set sources when subtitle is absent', () => {
      const config = buildConfig({ type: 'wmts', subtitle: undefined });
      const result = buildLayerFacetProps(config, selectedDate);
      expect(result[0].sources).toBeUndefined();
    });

    it('does not duplicate existing source value', () => {
      const config = {
        layers: {
          layer1: {
            id: 'layer1',
            type: 'wmts',
            subtitle: 'Source A',
            sources: ['Source A'],
          },
        },
        measurements: {},
        categories: {},
      };
      const result = buildLayerFacetProps(config, selectedDate);
      expect(result[0].sources).toEqual(['Source A']);
    });
  });

  describe('setMeasurementSourceFacetProps', () => {
    it('sets measurements from measurement config', () => {
      const config = buildConfig({ type: 'wmts' });
      const result = buildLayerFacetProps(config, selectedDate);
      expect(result[0].measurements).toContain('Aerosol Optical Depth');
    });

    it('does not set measurement if key includes "Featured"', () => {
      const config = {
        layers: { layer1: { id: 'layer1', type: 'wmts' } },
        measurements: {
          'Featured Aerosol': {
            sources: {
              MODIS: { settings: ['layer1'] },
            },
          },
        },
        categories: {},
      };
      const result = buildLayerFacetProps(config, selectedDate);
      expect(result[0].measurements).toBeUndefined();
    });

    it('handles measurement sources with empty settings gracefully', () => {
      const config = {
        layers: { layer1: { id: 'layer1', type: 'wmts' } },
        measurements: {
          'Sea Surface Temp': {
            sources: {
              MODIS: { settings: [] },
            },
          },
        },
        categories: {},
      };
      expect(() => buildLayerFacetProps(config, selectedDate)).not.toThrow();
    });
  });

  describe('setCategoryFacetProps', () => {
    it('sets categories on layer from category config', () => {
      const config = buildConfig({ type: 'wmts' });
      const result = buildLayerFacetProps(config, selectedDate);
      expect(result[0].categories).toContain('Aerosols');
    });

    it('skips the "featured" category key', () => {
      const config = {
        layers: { layer1: { id: 'layer1', type: 'wmts' } },
        measurements: {
          'Aerosol Optical Depth': {
            sources: { MODIS: { settings: ['layer1'] } },
          },
        },
        categories: {
          featured: {
            Aerosols: { measurements: ['Aerosol Optical Depth'] },
          },
        },
      };
      const result = buildLayerFacetProps(config, selectedDate);
      expect(result[0].categories).toBeUndefined();
    });

    it('skips sub-categories keyed "All"', () => {
      const config = {
        layers: { layer1: { id: 'layer1', type: 'wmts' } },
        measurements: {
          'Aerosol Optical Depth': {
            sources: { MODIS: { settings: ['layer1'] } },
          },
        },
        categories: {
          atmosphere: {
            All: { measurements: ['Aerosol Optical Depth'] },
          },
        },
      };
      const result = buildLayerFacetProps(config, selectedDate);
      expect(result[0].categories).toBeUndefined();
    });

    it('throws when a measurement key has no config entry', () => {
      const config = {
        layers: { layer1: { id: 'layer1', type: 'wmts' } },
        measurements: {},
        categories: {
          atmosphere: {
            Aerosols: { measurements: ['NonExistentMeasurement'] },
          },
        },
      };
      expect(() => buildLayerFacetProps(config, selectedDate)).toThrow(
        'No measurement config entry for "NonExistentMeasurement".',
      );
    });
  });

  describe('daynight handling', () => {
    it('capitalizes a daynight string value into an array', () => {
      const config = buildConfig({ type: 'wmts', daynight: 'day' });
      const result = buildLayerFacetProps(config, selectedDate);
      expect(result[0].daynight).toEqual(['Day']);
    });

    it('capitalizes daynight array values', () => {
      const config = buildConfig({ type: 'wmts', daynight: ['day', 'night'] });
      const result = buildLayerFacetProps(config, selectedDate);
      expect(result[0].daynight).toEqual(['Day', 'Night']);
    });

    it('does not transform daynight when it is an empty array', () => {
      const config = buildConfig({ type: 'wmts', daynight: [] });
      const result = buildLayerFacetProps(config, selectedDate);
      expect(result[0].daynight).toEqual([]);
    });

    it('does not set daynight when not present on layer', () => {
      const config = buildConfig({ type: 'wmts' });
      const result = buildLayerFacetProps(config, selectedDate);
      expect(result[0].daynight).toBeUndefined();
    });
  });

  describe('general behaviour', () => {
    it('does not mutate the original config layers', () => {
      const config = buildConfig({ type: 'wmts' });
      const originalType = config.layers.layer1.type;
      buildLayerFacetProps(config, selectedDate);
      expect(config.layers.layer1.type).toBe(originalType);
    });

    it('returns an array with one entry per layer', () => {
      const config = {
        layers: {
          layer1: { id: 'layer1', type: 'wmts' },
          layer2: { id: 'layer2', type: 'vector' },
        },
        measurements: {},
        categories: {},
      };
      const result = buildLayerFacetProps(config, selectedDate);
      expect(result).toHaveLength(2);
    });
  });
});

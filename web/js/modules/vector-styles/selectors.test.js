import {
  getVectorLayers,
  getAllVectorStyles,
  getVectorStyle,
  findIndex,
  setRange,
  setStyleFunction,
  isActive,
  getKey,
  clearStyleFunction,
  applyStyle,
} from './selectors';
import {
  getMinValue,
  getMaxValue,
} from './util';
import {
  isActive as isPaletteActive,
  getLookup as getPaletteLookup,
} from '../palettes/selectors';
import { stylefunction } from 'ol-mapbox-style';
import util from '../../util/util';

jest.mock('./util', () => ({
  getMinValue: jest.fn(),
  getMaxValue: jest.fn(),
  selectedStyleFunction: jest.fn(),
}));

jest.mock('../palettes/selectors', () => ({
  isActive: jest.fn(),
  getLookup: jest.fn(),
}));

jest.mock('ol-mapbox-style', () => ({
  stylefunction: jest.fn(),
}));

jest.mock('ol/extent', () => ({
  containsCoordinate: jest.fn(),
}));

jest.mock('../../util/util', () => ({
  __esModule: true,
  default: {
    hexToRGBA: jest.fn(),
  },
}));

jest.mock('immutability-helper', () => jest.fn((obj) => obj));

const makeLayer = (overrides = {}) => ({
  isWMS: false,
  getLayers: null,
  setStyle: jest.fn(),
  getExtent: jest.fn().mockReturnValue([0, -90, 180, 90]),
  ...overrides,
});

const makeBaseOpts = (overrides = {}) => ({
  def: {
    id: 'layer-1',
    vectorStyle: { id: 'style-1' },
    custom: null,
    disabled: null,
    vectorData: { id: 'data-1' },
  },
  vectorStyleId: 'style-1',
  vectorStyles: {
    'style-1': {
      layers: [{ paint: { 'circle-color': [] } }],
    },
  },
  options: { group: 'active' },
  state: {
    map: { ui: { selected: {} } },
    proj: { id: 'geographic', selected: { resolutions: [1, 2, 4] } },
    vectorStyles: {
      selected: {},
      customDefault: { 'style-1': undefined },
    },
    palettes: {},
    config: { vectorData: { 'data-1': { mvt_properties: [] } } },
  },
  layer: makeLayer(),
  ...overrides,
});

describe('selectors.js', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getVectorLayers', () => {
    it('should return only vector type layer groups flattened via getLayersArray', () => {
      const vectorLayer = { isVector: true };
      const vectorLayerGroup = {
        wv: { def: { type: 'vector' } },
        getLayersArray: jest.fn().mockReturnValue([vectorLayer]),
      };
      const nonVectorLayerGroup = { wv: { def: { type: 'wms' } } };
      const state = {
        map: {
          ui: {
            selected: {
              getLayers: jest.fn().mockReturnValue({
                getArray: jest.fn().mockReturnValue([vectorLayerGroup, nonVectorLayerGroup]),
              }),
            },
          },
        },
      };
      expect(getVectorLayers(state)).toEqual([vectorLayer]);
    });

    it('should return an empty array when no vector layers exist', () => {
      const state = {
        map: {
          ui: {
            selected: {
              getLayers: jest.fn().mockReturnValue({
                getArray: jest.fn().mockReturnValue([{ wv: { def: { type: 'wms' } } }]),
              }),
            },
          },
        },
      };
      expect(getVectorLayers(state)).toEqual([]);
    });

    it('should accumulate layers from multiple vector layer groups', () => {
      const layerA = { isVector: true, id: 'a' };
      const layerB = { isVector: true, id: 'b' };
      const groupA = { wv: { def: { type: 'vector' } }, getLayersArray: () => [layerA] };
      const groupB = { wv: { def: { type: 'vector' } }, getLayersArray: () => [layerB] };
      const state = {
        map: {
          ui: {
            selected: {
              getLayers: jest.fn().mockReturnValue({
                getArray: jest.fn().mockReturnValue([groupA, groupB]),
              }),
            },
          },
        },
      };
      expect(getVectorLayers(state)).toEqual([layerA, layerB]);
    });
  });

  describe('getAllVectorStyles', () => {
    it('should return the vectorStyle matching the layerId', () => {
      const style = { color: 'red' };
      const state = {
        config: { layers: { 'layer-1': { vectorStyle: { id: 'style-1' } } } },
        vectorStyles: { custom: { 'style-1': style } },
      };
      expect(getAllVectorStyles('layer-1', undefined, state)).toBe(style);
    });

    it('should throw when the vectorStyle name is not found in custom', () => {
      const state = {
        config: { layers: { 'layer-1': { vectorStyle: { id: 'missing' } } } },
        vectorStyles: { custom: {} },
      };
      expect(() => getAllVectorStyles('layer-1', undefined, state)).toThrow(
        'missing Is not a rendered vectorStyle',
      );
    });

    it('should return a sub-layer by index when vectorStyle has a layers array', () => {
      const subLayer = { id: 'sub-0' };
      const style = { layers: [subLayer] };
      const state = {
        config: { layers: { 'layer-1': { vectorStyle: { id: 'style-1' } } } },
        vectorStyles: { custom: { 'style-1': style } },
      };
      expect(getAllVectorStyles('layer-1', 0, state)).toBe(subLayer);
    });

    it('should return the top-level style when index is undefined and no layers array exists', () => {
      const style = { color: 'blue' };
      const state = {
        config: { layers: { 'layer-1': { vectorStyle: { id: 'style-1' } } } },
        vectorStyles: { custom: { 'style-1': style } },
      };
      expect(getAllVectorStyles('layer-1', undefined, state)).toBe(style);
    });

    it('should return the top-level style without descending when layers array is absent for a given index', () => {
      const style = { color: 'green' };
      const state = {
        config: { layers: { 'layer-1': { vectorStyle: { id: 'style-1' } } } },
        vectorStyles: { custom: { 'style-1': style } },
      };
      expect(getAllVectorStyles('layer-1', 0, state)).toBe(style);
    });
  });

  describe('getVectorStyle', () => {
    it('should return the rendered vectorStyle from state when present', () => {
      const renderedStyle = { rendered: true };
      const state = {
        vectorStyles: { 'layer-1': { layers: [renderedStyle] }, custom: {} },
        config: { layers: {} },
      };
      expect(getVectorStyle('layer-1', 0, state)).toBe(renderedStyle);
    });

    it('should fall back to getAllVectorStyles when no rendered style is found', () => {
      const style = { color: 'green' };
      const state = {
        vectorStyles: { custom: { 'style-1': style } },
        config: { layers: { 'layer-1': { vectorStyle: { id: 'style-1' } } } },
      };
      expect(getVectorStyle('layer-1', 0, state)).toBe(style);
    });

    it('should default index to 0 when indexInt is undefined', () => {
      const renderedStyle = { rendered: true };
      const state = {
        vectorStyles: { 'layer-1': { layers: [renderedStyle] }, custom: {} },
        config: { layers: {} },
      };
      expect(getVectorStyle('layer-1', undefined, state)).toBe(renderedStyle);
    });

    it('should use the provided index to select the correct rendered layer', () => {
      const style0 = { idx: 0 };
      const style1 = { idx: 1 };
      const state = {
        vectorStyles: { 'layer-1': { layers: [style0, style1] }, custom: {} },
        config: { layers: {} },
      };
      expect(getVectorStyle('layer-1', 1, state)).toBe(style1);
    });
  });

  describe('findIndex', () => {
    const buildState = (values) => ({
      vectorStyles: {
        'layer-1': { layers: [{ entries: { values } }] },
        custom: {},
      },
      config: { layers: {} },
    });

    beforeEach(() => {
      getMinValue.mockImplementation((v) => v.min);
      getMaxValue.mockImplementation((v) => v.max);
    });

    it('should find the index for a matching min value', () => {
      const state = buildState([{ min: 1, max: 10 }, { min: 20, max: 30 }]);
      expect(findIndex('layer-1', 'min', 20, 0, state)).toBe(1);
    });

    it('should find the index for a matching max value', () => {
      const state = buildState([{ min: 0, max: 10 }, { min: 20, max: 30 }]);
      expect(findIndex('layer-1', 'max', 10, 0, state)).toBe(0);
    });

    it('should return undefined when no match is found', () => {
      const state = buildState([{ min: 1, max: 10 }]);
      expect(findIndex('layer-1', 'min', 99, 0, state)).toBeUndefined();
    });

    it('should default index to 0 when indexInt is not provided', () => {
      const state = buildState([{ min: 5, max: 15 }]);
      expect(findIndex('layer-1', 'min', 5, undefined, state)).toBe(0);
    });

    it('should return the first matching index and stop iterating', () => {
      const state = buildState([{ min: 5, max: 10 }, { min: 5, max: 20 }]);
      expect(findIndex('layer-1', 'min', 5, 0, state)).toBe(0);
    });
  });

  describe('setRange', () => {
    it('should return an object with all provided arguments', () => {
      const layerId = 'layer-1';
      const props = { min: 0, max: 100 };
      const index = 0;
      const palettes = { some: 'palette' };
      const state = { some: 'state' };
      expect(setRange(layerId, props, index, palettes, state)).toEqual({
        layerId, props, index, palettes, state,
      });
    });

    it('should handle undefined index and palettes', () => {
      const result = setRange('layer-1', {}, undefined, undefined, {});
      expect(result.index).toBeUndefined();
      expect(result.palettes).toBeUndefined();
    });
  });

  describe('isActive', () => {
    it('should return the vectorStyle for the layer when custom entry exists', () => {
      const state = {
        compare: { activeString: 'active' },
        vectorStyles: {
          custom: { 'layer-1': true },
          active: { 'layer-1': { styleId: 'style-1' } },
        },
      };
      expect(isActive('layer-1', 'active', state)).toEqual({ styleId: 'style-1' });
    });

    it('should return undefined when layer is not in custom', () => {
      const state = {
        compare: { activeString: 'active' },
        vectorStyles: { custom: {}, active: {} },
      };
      expect(isActive('layer-1', 'active', state)).toBeUndefined();
    });

    it('should fall back to compare.activeString when groupObj is falsy', () => {
      const state = {
        compare: { activeString: 'activeB' },
        vectorStyles: {
          custom: { 'layer-1': true },
          activeB: { 'layer-1': { styleId: 'style-B' } },
        },
      };
      expect(isActive('layer-1', null, state)).toEqual({ styleId: 'style-B' });
    });

    it('should return undefined when group entry for layer does not exist', () => {
      const state = {
        compare: { activeString: 'active' },
        vectorStyles: {
          custom: { 'layer-1': true },
          active: {},
        },
      };
      expect(isActive('layer-1', 'active', state)).toBeUndefined();
    });
  });

  describe('getKey', () => {
    it('should return an empty string when isActive returns falsy', () => {
      const state = {
        compare: { activeString: 'active' },
        vectorStyles: { custom: {}, active: {} },
      };
      expect(getKey('layer-1', 'active', state)).toBe('');
    });

    it('should return a style key when def.custom is set', () => {
      const state = {
        compare: { activeString: 'active' },
        vectorStyles: {
          'layer-1': { layers: [{ custom: 'palette-1', entries: {} }] },
          custom: { 'layer-1': true },
          active: { 'layer-1': {} },
        },
        config: { layers: { 'layer-1': { vectorStyle: { id: 'style-1' } } } },
      };
      expect(getKey('layer-1', 'active', state)).toContain('style=palette-1');
    });

    it('should return a min key when def.min is a non-zero truthy value', () => {
      const state = {
        compare: { activeString: 'active' },
        vectorStyles: {
          'layer-1': { layers: [{ min: 5, entries: {} }] },
          custom: { 'layer-1': true },
          active: { 'layer-1': {} },
        },
        config: { layers: { 'layer-1': { vectorStyle: { id: 'style-1' } } } },
      };
      expect(getKey('layer-1', 'active', state)).toContain('min=5');
    });

    it('should return a max key when def.max is set', () => {
      const state = {
        compare: { activeString: 'active' },
        vectorStyles: {
          'layer-1': { layers: [{ max: 100, entries: {} }] },
          custom: { 'layer-1': true },
          active: { 'layer-1': {} },
        },
        config: { layers: { 'layer-1': { vectorStyle: { id: 'style-1' } } } },
      };
      expect(getKey('layer-1', 'active', state)).toContain('max=100');
    });

    it('should return comma-joined keys for all matching fields', () => {
      const state = {
        compare: { activeString: 'active' },
        vectorStyles: {
          'layer-1': { layers: [{ custom: 'palette-1', min: 5, max: 50, entries: {} }] },
          custom: { 'layer-1': true },
          active: { 'layer-1': {} },
        },
        config: { layers: { 'layer-1': { vectorStyle: { id: 'style-1' } } } },
      };
      expect(getKey('layer-1', 'active', state)).toBe('style=palette-1,min=5,max=50');
    });

    it('should use compare.activeString when group is not provided', () => {
      const state = {
        compare: { activeString: 'active' },
        vectorStyles: { custom: {}, active: {} },
      };
      expect(getKey('layer-1', null, state)).toBe('');
    });

    it('should return an empty string when no key fields are present on def', () => {
      const state = {
        compare: { activeString: 'active' },
        vectorStyles: {
          'layer-1': { layers: [{ entries: {} }] },
          custom: { 'layer-1': true },
          active: { 'layer-1': {} },
        },
        config: { layers: { 'layer-1': { vectorStyle: { id: 'style-1' } } } },
      };
      expect(getKey('layer-1', 'active', state)).toBe('');
    });
  });

  describe('setStyleFunction', () => {
    beforeEach(() => {
      stylefunction.mockReturnValue(jest.fn());
      isPaletteActive.mockReturnValue(false);
    });

    it('should return undefined when map is not present in state', () => {
      const opts = makeBaseOpts();
      opts.state.map.ui.selected = null;
      expect(setStyleFunction(opts)).toBeUndefined();
    });

    it('should return undefined when layer is null', () => {
      expect(setStyleFunction(makeBaseOpts({ layer: null }))).toBeUndefined();
    });

    it('should return undefined when layer.isWMS is true', () => {
      const opts = makeBaseOpts({ layer: makeLayer({ isWMS: true }) });
      expect(setStyleFunction(opts)).toBeUndefined();
    });

    it('should return undefined when glStyle is undefined for the resolved styleId', () => {
      const opts = makeBaseOpts({ vectorStyles: {} });
      expect(setStyleFunction(opts)).toBeUndefined();
    });

    it('should call stylefunction and return vectorStyleId on a successful run', () => {
      const opts = makeBaseOpts();
      expect(setStyleFunction(opts)).toBe('style-1');
      expect(stylefunction).toHaveBeenCalled();
    });

    it('should use resolutions from opts when provided', () => {
      const opts = makeBaseOpts({ resolutions: [8, 16, 32] });
      setStyleFunction(opts);
      expect(stylefunction).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        [8, 16, 32],
      );
    });

    it('should fall back to proj.selected.resolutions when opts.resolutions is absent', () => {
      const opts = makeBaseOpts();
      setStyleFunction(opts);
      expect(stylefunction).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        [1, 2, 4],
      );
    });

    it('should use vectorStyleSource as source when provided', () => {
      const opts = makeBaseOpts({ vectorStyleSource: 'custom-source' });
      setStyleFunction(opts);
      expect(stylefunction).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        'custom-source',
        expect.anything(),
      );
    });

    it('should use layerId as source when vectorStyleSource is not provided', () => {
      const opts = makeBaseOpts();
      setStyleFunction(opts);
      expect(stylefunction).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        'layer-1',
        expect.anything(),
      );
    });

    it('should use a proj-specific vectorStyle id when available on def', () => {
      const opts = makeBaseOpts();
      opts.def.vectorStyle = { id: 'fallback', geographic: { id: 'geo-style' } };
      opts.vectorStyles['geo-style'] = { layers: [{ paint: {} }] };
      setStyleFunction(opts);
      expect(stylefunction).toHaveBeenCalled();
    });

    it('should apply customDefault style when no customPalette and styleSelection is false', () => {
      const customDefaultStyle = { layers: [{ paint: {} }] };
      const opts = makeBaseOpts();
      opts.state.vectorStyles.customDefault = { 'style-1': customDefaultStyle };
      setStyleFunction(opts);
      expect(stylefunction).toHaveBeenCalled();
    });

    it('should not replace glStyle with customDefault when styleSelection is true', () => {
      const customDefaultStyle = { layers: [{ paint: { replaced: true } }] };
      const opts = makeBaseOpts({ styleSelection: true });
      opts.state.vectorStyles.customDefault = { 'style-1': customDefaultStyle };
      setStyleFunction(opts);
      expect(stylefunction).toHaveBeenCalled();
    });

    it('should apply a custom palette when customPalette is set and palettes state exists', () => {
      const opts = makeBaseOpts();
      opts.def.custom = 'custom-palette';
      opts.state.palettes = { custom: { 'custom-palette': { colors: ['#ff0000'] } } };
      util.hexToRGBA.mockReturnValue([255, 0, 0, 1]);
      setStyleFunction(opts);
      expect(util.hexToRGBA).toHaveBeenCalledWith('#ff0000');
    });

    it('should resolve the inner isVector layer when layer has getLayers', () => {
      const innerLayer = { isVector: true };
      const opts = makeBaseOpts({
        layer: makeLayer({
          getLayers: jest.fn().mockReturnValue({
            getArray: jest.fn().mockReturnValue([innerLayer]),
          }),
        }),
      });
      setStyleFunction(opts);
      expect(stylefunction).toHaveBeenCalledWith(
        innerLayer,
        expect.anything(),
        expect.anything(),
        expect.anything(),
      );
    });

    it('should call layer.setStyle when selectedFeatures exist and glStyle name is not Orbit Tracks', () => {
      const opts = makeBaseOpts();
      opts.state.vectorStyles.selected = { 'layer-1': ['feature-1'] };
      setStyleFunction(opts);
      expect(opts.layer.setStyle).toHaveBeenCalled();
    });

    it('should not call layer.setStyle when selectedFeatures is empty', () => {
      const opts = makeBaseOpts();
      opts.state.vectorStyles.selected = {};
      setStyleFunction(opts);
      expect(opts.layer.setStyle).not.toHaveBeenCalled();
    });

    it('should not call layer.setStyle when glStyle name is Orbit Tracks even with selected features', () => {
      const opts = makeBaseOpts();
      opts.vectorStyles['style-1'] = { name: 'Orbit Tracks', layers: [{ paint: {} }] };
      opts.state.vectorStyles.selected = { 'layer-1': ['feature-1'] };
      setStyleFunction(opts);
      expect(opts.layer.setStyle).not.toHaveBeenCalled();
    });

    it('should delete glStyle.id before calling stylefunction', () => {
      const opts = makeBaseOpts();
      opts.vectorStyles['style-1'] = { id: 'should-be-deleted', layers: [{ paint: {} }] };
      setStyleFunction(opts);
      expect(stylefunction).toHaveBeenCalled();
    });

    it('should apply lookup via getPaletteLookup when isPaletteActive returns true', () => {
      const opts = makeBaseOpts();
      opts.def.disabled = true;
      opts.vectorStyles['style-1'] = {
        layers: [{ paint: { 'circle-color': [] } }],
      };
      isPaletteActive.mockReturnValue(true);
      getPaletteLookup.mockReturnValue({});
      setStyleFunction(opts);
      expect(getPaletteLookup).toHaveBeenCalled();
    });

    it('should handle extentStartX === 180 producing the western acceptable extent', () => {
      const opts = makeBaseOpts({
        layer: makeLayer({ getExtent: jest.fn().mockReturnValue([180, -90, 360, 90]) }),
      });
      opts.state.vectorStyles.selected = { 'layer-1': ['feature-1'] };
      setStyleFunction(opts);
      expect(opts.layer.setStyle).toHaveBeenCalled();
    });

    it('should handle extentStartX === -250 producing the eastern acceptable extent', () => {
      const opts = makeBaseOpts({
        layer: makeLayer({ getExtent: jest.fn().mockReturnValue([-250, -90, -110, 90]) }),
      });
      opts.state.vectorStyles.selected = { 'layer-1': ['feature-1'] };
      setStyleFunction(opts);
      expect(opts.layer.setStyle).toHaveBeenCalled();
    });
  });

  describe('clearStyleFunction', () => {
    beforeEach(() => {
      stylefunction.mockReturnValue(jest.fn());
    });

    const makeClearArgs = () => {
      const mockLayer = { setStyle: jest.fn() };
      const def = { id: 'layer-1' };
      const vectorStyleId = 'style-1';
      const vectorStyles = { 'layer-1': { name: 'Some Style', layers: [] } };
      const state = {};
      return {
        def, vectorStyleId, vectorStyles, mockLayer, state,
      };
    };

    it('should call stylefunction with layer, glStyle, and vectorStyleId', () => {
      const {
        def, vectorStyleId, vectorStyles, mockLayer, state,
      } = makeClearArgs();
      clearStyleFunction(def, vectorStyleId, vectorStyles, mockLayer, state);
      expect(stylefunction).toHaveBeenCalledWith(
        mockLayer,
        vectorStyles['layer-1'],
        vectorStyleId,
      );
    });

    it('should not call layer.setStyle for non-Orbit-Tracks layers', () => {
      const {
        def, vectorStyleId, vectorStyles, mockLayer, state,
      } = makeClearArgs();
      clearStyleFunction(def, vectorStyleId, vectorStyles, mockLayer, state);
      expect(mockLayer.setStyle).not.toHaveBeenCalled();
    });

    it('should call layer.setStyle for Orbit Tracks layers', () => {
      const { def, vectorStyleId, mockLayer, state } = makeClearArgs();
      const orbitVectorStyles = { 'layer-1': { name: 'Orbit Tracks' } };
      clearStyleFunction(def, vectorStyleId, orbitVectorStyles, mockLayer, state);
      expect(mockLayer.setStyle).toHaveBeenCalled();
    });

    it('should find and reassign layer from olMap when a matching subLayer exists', () => {
      const { def, vectorStyleId, vectorStyles } = makeClearArgs();
      const matchingSubLayer = { wv: { id: 'layer-1' }, setStyle: jest.fn() };
      const state = {
        legacy: {
          map: {
            ui: {
              selected: {
                getLayers: jest.fn().mockReturnValue({
                  getArray: jest.fn().mockReturnValue([matchingSubLayer]),
                }),
              },
            },
          },
        },
      };
      clearStyleFunction(def, vectorStyleId, vectorStyles, null, state);
      expect(stylefunction).toHaveBeenCalledWith(
        matchingSubLayer,
        expect.anything(),
        expect.anything(),
      );
    });

    it('should not reassign layer when no subLayer id matches', () => {
      const { def, vectorStyleId, vectorStyles, mockLayer } = makeClearArgs();
      const nonMatchingSubLayer = { wv: { id: 'other-layer' } };
      const state = {
        legacy: {
          map: {
            ui: {
              selected: {
                getLayers: jest.fn().mockReturnValue({
                  getArray: jest.fn().mockReturnValue([nonMatchingSubLayer]),
                }),
              },
            },
          },
        },
      };
      clearStyleFunction(def, vectorStyleId, vectorStyles, mockLayer, state);
      expect(stylefunction).toHaveBeenCalledWith(
        mockLayer,
        expect.anything(),
        expect.anything(),
      );
    });

    it('should return an updated vectorStyles object', () => {
      const {
        def, vectorStyleId, vectorStyles, mockLayer, state,
      } = makeClearArgs();
      const result = clearStyleFunction(def, vectorStyleId, vectorStyles, mockLayer, state);
      expect(result).toBeDefined();
    });
  });

  describe('applyStyle', () => {
    beforeEach(() => {
      stylefunction.mockReturnValue(jest.fn());
      isPaletteActive.mockReturnValue(false);
    });

    const makeApplyState = (vectorStyles = { 'style-1': { layers: [{ paint: {} }] } }) => ({
      map: { ui: { selected: {} } },
      proj: { id: 'geographic', selected: { resolutions: [1, 2, 4] } },
      vectorStyles: {
        selected: {},
        customDefault: { 'style-1': undefined },
      },
      palettes: {},
      config: {
        vectorStyles,
        vectorData: {},
      },
    });

    it('should call setStyleFunction when vectorStyles and vectorStyleId are present', () => {
      const def = { id: 'layer-1', vectorStyle: { id: 'style-1', source: 'src-1' }, custom: null, disabled: null };
      const olVectorLayer = makeLayer();
      const state = makeApplyState();
      const options = { group: 'active' };
      applyStyle(def, olVectorLayer, state, options);
      expect(stylefunction).toHaveBeenCalled();
    });

    it('should return early when config.vectorStyles is falsy', () => {
      const def = { id: 'layer-1', vectorStyle: { id: 'style-1', source: 'src-1' } };
      const olVectorLayer = makeLayer();
      const state = makeApplyState(null);
      state.config.vectorStyles = null;
      applyStyle(def, olVectorLayer, state, {});
      expect(stylefunction).not.toHaveBeenCalled();
    });

    it('should return early when vectorStyleId is falsy', () => {
      const def = { id: 'layer-1', vectorStyle: { id: '', source: 'src-1' } };
      const olVectorLayer = makeLayer();
      const state = makeApplyState();
      applyStyle(def, olVectorLayer, state, {});
      expect(stylefunction).not.toHaveBeenCalled();
    });

    it('should forward resolutions to setStyleFunction when provided', () => {
      const def = { id: 'layer-1', vectorStyle: { id: 'style-1', source: 'src-1' }, custom: null, disabled: null };
      const olVectorLayer = makeLayer();
      const state = makeApplyState();
      applyStyle(def, olVectorLayer, state, { group: 'active' }, [2, 4, 8]);
      expect(stylefunction).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        [2, 4, 8],
      );
    });

    it('should not spread resolutions into opts when resolutions is falsy', () => {
      const def = { id: 'layer-1', vectorStyle: { id: 'style-1', source: 'src-1' }, custom: null, disabled: null };
      const olVectorLayer = makeLayer();
      const state = makeApplyState();
      applyStyle(def, olVectorLayer, state, { group: 'active' }, null);
      expect(stylefunction).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        [1, 2, 4],
      );
    });
  });
});

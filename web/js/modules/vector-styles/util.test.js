/* eslint-disable new-cap */
import {
  getVectorStyleAttributeArray,
  getMinValue,
  getMaxValue,
  isConditional,
  adjustCircleRadius,
  selectedCircleStyle,
  selectedPolygonStyle,
  offsetLineStringStyle,
  selectedStyleFunction,
  getConditionalColors,
  getPaletteForStyle,
  isFeatureInRenderableArea,
  onMapClickGetVectorFeatures,
  updateVectorSelection,
} from './util';
import { getVectorLayers, setStyleFunction } from './selectors';
import { isFromActiveCompareRegion } from '../compare/util';
import { Style, Circle } from 'ol/style';

jest.mock('./selectors', () => ({
  getVectorLayers: jest.fn(),
  setStyleFunction: jest.fn(),
}));

jest.mock('../compare/util', () => ({
  isFromActiveCompareRegion: jest.fn(),
}));

jest.mock('ol/style', () => {
  const mockStroke = jest.fn().mockImplementation(function () {
    this.setColor = jest.fn(); this.setWidth = jest.fn();
  });
  const mockFill = jest.fn().mockImplementation(function () {
    this.getColor = jest.fn().mockReturnValue('rgba(255,0,0,1)'); this.setColor = jest.fn();
  });
  const mockCircle = jest.fn().mockImplementation(function () {
    this.getRadius = jest.fn().mockReturnValue(5);
    this.getFill = jest.fn().mockReturnValue(new mockFill());
  });
  const mockStyle = jest.fn().mockImplementation(function (opts) {
    this.opts = opts;
    this.getImage = jest.fn().mockReturnValue(new mockCircle());
    this.getFill = jest.fn().mockReturnValue(new mockFill());
    this.getStroke = jest.fn().mockReturnValue(new mockStroke());
    this.getText = jest.fn().mockReturnValue(null);
  });
  return {
    Stroke: mockStroke,
    Fill: mockFill,
    Circle: mockCircle,
    Style: mockStyle,
  };
});

describe('util.js', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getVectorStyleAttributeArray', () => {
    it('should return an empty array when no attributes are set', () => {
      expect(getVectorStyleAttributeArray({})).toEqual([]);
    });

    it('should include a style entry when custom is set', () => {
      const result = getVectorStyleAttributeArray({ custom: 'my-palette' });
      expect(result).toContainEqual({ id: 'style', value: 'my-palette' });
    });

    it('should include a min entry when min is set to a truthy value', () => {
      const result = getVectorStyleAttributeArray({ min: 5 });
      expect(result).toContainEqual({ id: 'min', value: 5 });
    });

    it('should include a max entry when max is set', () => {
      const result = getVectorStyleAttributeArray({ max: 100 });
      expect(result).toContainEqual({ id: 'max', value: 100 });
    });

    it('should include all three entries when all attributes are set', () => {
      const result = getVectorStyleAttributeArray({ custom: 'pal', min: 1, max: 99 });
      expect(result).toHaveLength(3);
      expect(result).toContainEqual({ id: 'style', value: 'pal' });
      expect(result).toContainEqual({ id: 'min', value: 1 });
      expect(result).toContainEqual({ id: 'max', value: 99 });
    });

    it('should not include min when min is 0 (falsy)', () => {
      const result = getVectorStyleAttributeArray({ min: 0 });
      expect(result.find((e) => e.id === 'min')).toBeUndefined();
    });

    it('should use id "style" for the custom key entry', () => {
      const result = getVectorStyleAttributeArray({ custom: 'x' });
      expect(result[0].id).toBe('style');
    });
  });

  describe('getMinValue', () => {
    it('should return the first element of an array', () => {
      expect(getMinValue([10, 20, 30])).toBe(10);
    });

    it('should return the value directly when not an array', () => {
      expect(getMinValue(42)).toBe(42);
    });

    it('should return the first element of a single-element array', () => {
      expect(getMinValue([7])).toBe(7);
    });

    it('should return the value when it is 0', () => {
      expect(getMinValue(0)).toBe(0);
    });
  });

  describe('getMaxValue', () => {
    it('should return the last element of an array', () => {
      expect(getMaxValue([10, 20, 30])).toBe(30);
    });

    it('should return the value directly when not an array', () => {
      expect(getMaxValue(99)).toBe(99);
    });

    it('should return the only element of a single-element array', () => {
      expect(getMaxValue([5])).toBe(5);
    });

    it('should return the value when it is 0', () => {
      expect(getMaxValue(0)).toBe(0);
    });
  });

  describe('isConditional', () => {
    it('should return true when the first element is "case"', () => {
      expect(isConditional(['case', 'a', 'b'])).toBe(true);
    });

    it('should return false when the first element is not "case"', () => {
      expect(isConditional(['match', 'a', 'b'])).toBe(false);
    });

    it('should return false when the item is not an array', () => {
      expect(isConditional('case')).toBe(false);
    });

    it('should return false for an empty array', () => {
      expect(isConditional([])).toBe(false);
    });

    it('should return false for null', () => {
      expect(isConditional(null)).toBe(false);
    });
  });

  describe('adjustCircleRadius', () => {
    it('should return a new Style with radius scaled by 0.6', () => {
      const mockImage = { getRadius: jest.fn().mockReturnValue(10), getFill: jest.fn().mockReturnValue('fill') };
      const style = { getImage: jest.fn().mockReturnValue(mockImage) };
      const result = adjustCircleRadius(style);
      expect(Circle).toHaveBeenCalledWith(expect.objectContaining({ radius: 6 }));
      expect(Style).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('selectedCircleStyle', () => {
    it('should return a new Style when fill is present', () => {
      const mockFillInstance = { getColor: jest.fn().mockReturnValue('rgba(255,0,0,1)') };
      const mockImage = {
        getRadius: jest.fn().mockReturnValue(5),
        getFill: jest.fn().mockReturnValue(mockFillInstance),
      };
      const style = { getImage: jest.fn().mockReturnValue(mockImage) };
      const result = selectedCircleStyle(style, 3);
      expect(Circle).toHaveBeenCalledWith(expect.objectContaining({ radius: 15 }));
      expect(result).toBeDefined();
    });

    it('should return the original style when fill is null', () => {
      const mockImage = {
        getRadius: jest.fn().mockReturnValue(5),
        getFill: jest.fn().mockReturnValue(null),
      };
      const style = { getImage: jest.fn().mockReturnValue(mockImage) };
      const result = selectedCircleStyle(style);
      expect(result).toBe(style);
    });

    it('should use default size of 2 when size is not provided', () => {
      const mockFillInstance = { getColor: jest.fn().mockReturnValue('rgba(0,0,255,1)') };
      const mockImage = {
        getRadius: jest.fn().mockReturnValue(4),
        getFill: jest.fn().mockReturnValue(mockFillInstance),
      };
      const style = { getImage: jest.fn().mockReturnValue(mockImage) };
      selectedCircleStyle(style);
      expect(Circle).toHaveBeenCalledWith(expect.objectContaining({ radius: 8 }));
    });
  });

  describe('selectedPolygonStyle', () => {
    it('should set stroke color to white and width to 0.5 and return the style', () => {
      const mockStrokeInstance = { setColor: jest.fn(), setWidth: jest.fn() };
      const mockFillInstance = { getColor: jest.fn().mockReturnValue('rgba(0,0,0,1)'), setColor: jest.fn() };
      const style = {
        getFill: jest.fn().mockReturnValue(mockFillInstance),
        getStroke: jest.fn().mockReturnValue(mockStrokeInstance),
      };
      const result = selectedPolygonStyle(style);
      expect(mockStrokeInstance.setColor).toHaveBeenCalledWith('white');
      expect(mockStrokeInstance.setWidth).toHaveBeenCalledWith(0.5);
      expect(result).toBe(style);
    });

    it('should update the fill color with 0.5 opacity', () => {
      const mockStrokeInstance = { setColor: jest.fn(), setWidth: jest.fn() };
      const mockFillInstance = { getColor: jest.fn().mockReturnValue('rgba(10,20,30,1)'), setColor: jest.fn() };
      const style = {
        getFill: jest.fn().mockReturnValue(mockFillInstance),
        getStroke: jest.fn().mockReturnValue(mockStrokeInstance),
      };
      selectedPolygonStyle(style);
      expect(mockFillInstance.setColor).toHaveBeenCalledWith('rgba(10,20,30,0.5)');
    });
  });

  describe('offsetLineStringStyle', () => {
    it('should call setOffsetX(25) on text when present', () => {
      const mockText = { setOffsetX: jest.fn() };
      const style = { getText: jest.fn().mockReturnValue(mockText) };
      offsetLineStringStyle({}, [style]);
      expect(mockText.setOffsetX).toHaveBeenCalledWith(25);
    });

    it('should not throw when style has no text', () => {
      const style = { getText: jest.fn().mockReturnValue(null) };
      expect(() => offsetLineStringStyle({}, [style])).not.toThrow();
    });

    it('should return the mapped array of styles', () => {
      const style = { getText: jest.fn().mockReturnValue(null) };
      const result = offsetLineStringStyle({}, [style]);
      expect(result).toEqual([style]);
    });

    it('should process multiple styles', () => {
      const mockText = { setOffsetX: jest.fn() };
      const styleA = { getText: jest.fn().mockReturnValue(mockText) };
      const styleB = { getText: jest.fn().mockReturnValue(null) };
      offsetLineStringStyle({}, [styleA, styleB]);
      expect(mockText.setOffsetX).toHaveBeenCalledTimes(1);
    });
  });

  describe('selectedStyleFunction', () => {
    it('should return the styleArray unchanged when its length is not 1', () => {
      const styleArray = ['a', 'b'];
      expect(selectedStyleFunction({}, styleArray)).toBe(styleArray);
    });

    it('should call selectedCircleStyle path for Point geometry', () => {
      const mockFillInstance = { getColor: jest.fn().mockReturnValue('rgba(0,0,0,1)') };
      const mockImage = {
        getRadius: jest.fn().mockReturnValue(5),
        getFill: jest.fn().mockReturnValue(mockFillInstance),
      };
      const style = { getImage: jest.fn().mockReturnValue(mockImage) };
      const feature = { getGeometry: jest.fn().mockReturnValue({ getType: jest.fn().mockReturnValue('Point') }) };
      const result = selectedStyleFunction(feature, [style], 2);
      expect(result).toHaveLength(1);
    });

    it('should call selectedPolygonStyle path for Polygon geometry', () => {
      const mockStrokeInstance = { setColor: jest.fn(), setWidth: jest.fn() };
      const mockFillInstance = { getColor: jest.fn().mockReturnValue('rgba(0,0,0,1)'), setColor: jest.fn() };
      const style = {
        getFill: jest.fn().mockReturnValue(mockFillInstance),
        getStroke: jest.fn().mockReturnValue(mockStrokeInstance),
        getImage: jest.fn().mockReturnValue(null),
      };
      const feature = { getGeometry: jest.fn().mockReturnValue({ getType: jest.fn().mockReturnValue('Polygon') }) };
      const result = selectedStyleFunction(feature, [style]);
      expect(result).toHaveLength(1);
    });

    it('should return the style unchanged for unsupported geometry types', () => {
      const style = { getImage: jest.fn() };
      const feature = { getGeometry: jest.fn().mockReturnValue({ getType: jest.fn().mockReturnValue('LineString') }) };
      const result = selectedStyleFunction(feature, [style]);
      expect(result[0]).toBe(style);
    });
  });

  describe('getConditionalColors', () => {
    it('should extract colors and labels from a valid conditional expression', () => {
      const properColor = ['case', [null, null, 'Label A'], '#ff0000'];
      const result = getConditionalColors(properColor);
      expect(result.colors).toContain('#ff0000');
      expect(result.labels).toContain('Label A');
    });

    it('should add a Default label for an odd trailing element', () => {
      const input = ['case', [null, null, 'Cat'], '#aabbcc', '#ffffff'];
      const result = getConditionalColors(input);
      expect(result.labels).toContain('Default');
      expect(result.colors).toContain('#ffffff');
    });

    it('should warn for an irregular pair (non-string second)', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const input = ['case', 42, 43];
      getConditionalColors(input);
      expect(consoleSpy).toHaveBeenCalledWith('Irregular conditional');
      consoleSpy.mockRestore();
    });

    it('should return empty arrays for an input with only the case keyword removed', () => {
      const input = ['case'];
      const result = getConditionalColors(input);
      expect(result.colors).toEqual([]);
      expect(result.labels).toEqual([]);
    });
  });

  describe('getPaletteForStyle', () => {
    it('should return a classification palette for a non-conditional line-color', () => {
      const layer = { id: 'layer-1', title: 'My Layer' };
      const styleObj = { layers: [{ paint: { 'line-color': '#ff0000' } }] };
      const result = getPaletteForStyle(layer, styleObj);
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('classification');
      expect(result[0].colors).toContain('#ff0000');
      expect(result[0].tooltips).toContain('My Layer');
      expect(result[0].id).toBe('layer-10_legend');
    });

    it('should use circle-color when line-color is absent', () => {
      const layer = { id: 'layer-2', title: 'Circle Layer' };
      const styleObj = { layers: [{ paint: { 'circle-color': '#00ff00' } }] };
      const result = getPaletteForStyle(layer, styleObj);
      expect(result[0].colors).toContain('#00ff00');
    });

    it('should use fill-color when line-color and circle-color are absent', () => {
      const layer = { id: 'layer-3', title: 'Fill Layer' };
      const styleObj = { layers: [{ paint: { 'fill-color': '#0000ff' } }] };
      const result = getPaletteForStyle(layer, styleObj);
      expect(result[0].colors).toContain('#0000ff');
    });

    it('should extract conditional colors when the color is a conditional expression', () => {
      const layer = { id: 'layer-4', title: 'Cond Layer' };
      const color = ['case', [null, null, 'Cat A'], '#aabbcc', '#ffffff'];
      const styleObj = { layers: [{ paint: { 'line-color': color } }] };
      const result = getPaletteForStyle(layer, styleObj);
      expect(result[0].colors.length).toBeGreaterThan(0);
    });

    it('should include the layer title and id in the result', () => {
      const layer = { id: 'abc', title: 'ABC Layer' };
      const styleObj = { layers: [{ paint: { 'line-color': '#123456' } }] };
      const result = getPaletteForStyle(layer, styleObj);
      expect(result[0].title).toBe('ABC Layer');
      expect(result[0].id).toBe('abc0_legend');
    });
  });

  describe('isFeatureInRenderableArea', () => {
    it('should use acceptableExtent bounds when provided', () => {
      expect(isFeatureInRenderableArea(10, 0, [-180, -90, 180, 90])).toBe(true);
    });

    it('should return false when lon is outside acceptableExtent', () => {
      expect(isFeatureInRenderableArea(200, 0, [-180, -90, 180, 90])).toBe(false);
    });

    it('should return true for wrap=-1 when lon is between 180 and 250', () => {
      expect(isFeatureInRenderableArea(200, -1, null)).toBe(true);
    });

    it('should return false for wrap=-1 when lon is not in range', () => {
      expect(isFeatureInRenderableArea(100, -1, null)).toBe(false);
    });

    it('should return true for wrap=1 when lon is between -250 and -180', () => {
      expect(isFeatureInRenderableArea(-200, 1, null)).toBe(true);
    });

    it('should return false for wrap=1 when lon is not in range', () => {
      expect(isFeatureInRenderableArea(-100, 1, null)).toBe(false);
    });

    it('should return false when wrap is 0 and no acceptableExtent', () => {
      expect(isFeatureInRenderableArea(10, 0, null)).toBe(false);
    });
  });

  describe('onMapClickGetVectorFeatures', () => {
    const makeState = (overrides = {}) => ({
      config: {},
      compare: { activeString: 'active' },
      screenSize: { screenWidth: 1200, screenHeight: 800, isMobileDevice: false },
      ...overrides,
    });

    const makeMap = (features = []) => ({
      forEachFeatureAtPixel: jest.fn((pixels, cb) => {
        features.forEach((pair) => cb(pair[0], pair[1]));
      }),
    });

    it('should return all required keys in the result object', () => {
      const map = makeMap();
      const result = onMapClickGetVectorFeatures([100, 200], map, makeState(), 0, 445);
      expect(result).toHaveProperty('selected');
      expect(result).toHaveProperty('metaArray');
      expect(result).toHaveProperty('offsetLeft');
      expect(result).toHaveProperty('offsetTop');
      expect(result).toHaveProperty('isCoordinatesMarker');
      expect(result).toHaveProperty('modalShouldFollowClicks');
      expect(result).toHaveProperty('exceededLengthLimit');
    });

    it('should return isCoordinatesMarker true when the coordinates marker feature is clicked', () => {
      const markerFeature = { getId: jest.fn().mockReturnValue('coordinates-map-marker') };
      const map = makeMap([[markerFeature, {}]]);
      const result = onMapClickGetVectorFeatures([100, 200], map, makeState(), 0, 445);
      expect(result.isCoordinatesMarker).toBe(true);
    });

    it('should set exceededLengthLimit when more than desktop limit features are at pixel', () => {
      const makeFeat = () => ({
        getId: jest.fn().mockReturnValue(null),
        getGeometry: jest.fn().mockReturnValue({ getType: jest.fn().mockReturnValue('Point') }),
        getProperties: jest.fn().mockReturnValue({}),
      });
      const makeLayerWv = (id) => ({
        wv: {
          def: {
            id,
            title: `Layer ${id}`,
            vectorData: { id: 'vd1' },
            clickDisabledFeatures: [],
            modalShouldFollowClicks: false,
          },
          group: 'active',
        },
      });
      isFromActiveCompareRegion.mockReturnValue(true);
      const featurePairs = Array.from({ length: 13 }, (_, i) => {
        const f = makeFeat();
        f.getId.mockReturnValue(`feature-${i}`);
        return [f, makeLayerWv(`layer-${i}`)];
      });
      const map = makeMap(featurePairs);
      const state = makeState({
        config: {
          vectorData: { vd1: { mvt_properties: [] } },
        },
      });
      const result = onMapClickGetVectorFeatures([100, 200], map, state, 0, 445);
      expect(result.exceededLengthLimit).toBe(true);
    });

    it('should compute offsetLeft and offsetTop from pixel position', () => {
      const map = makeMap();
      const result = onMapClickGetVectorFeatures([600, 400], map, makeState(), 0, 445);
      expect(typeof result.offsetLeft).toBe('number');
      expect(typeof result.offsetTop).toBe('number');
    });

    it('should use mobile limits when isMobileDevice is true', () => {
      const map = makeMap();
      const result = onMapClickGetVectorFeatures(
        [100, 200],
        map,
        makeState({ screenSize: { screenWidth: 400, screenHeight: 700, isMobileDevice: true } }),
        0,
        250,
      );
      expect(result).toHaveProperty('exceededLengthLimit');
    });
  });

  describe('updateVectorSelection', () => {
    const makeState = (layers = []) => ({
      config: {
        vectorStyles: {},
        layers: layers.reduce((acc, l) => ({ ...acc, [l.id]: l }), {}),
      },
      map: {
        ui: {
          selected: {
            getLayers: jest.fn().mockReturnValue({ getArray: jest.fn().mockReturnValue([]) }),
          },
        },
      },
    });

    beforeEach(() => {
      getVectorLayers.mockReturnValue([]);
    });

    it('should call setStyleFunction for each key in selectionObj', () => {
      const layerDef = { id: 'layer-1', vectorStyle: { id: 'style-1' } };
      const state = makeState([layerDef]);
      const olLayer = { wv: { id: 'layer-1' } };
      getVectorLayers.mockReturnValue([olLayer]);
      updateVectorSelection({ 'layer-1': ['f1'] }, {}, [layerDef], 'select', state);
      expect(setStyleFunction).toHaveBeenCalled();
    });

    it('should call setStyleFunction for each key in lastSelectionObj', () => {
      const layerDef = { id: 'layer-1', vectorStyle: { id: 'style-1' } };
      const state = makeState([layerDef]);
      const olLayer = { wv: { id: 'layer-1' } };
      getVectorLayers.mockReturnValue([olLayer]);
      updateVectorSelection({}, { 'layer-1': ['f1'] }, [layerDef], 'deselect', state);
      expect(setStyleFunction).toHaveBeenCalled();
    });

    it('should not call setStyleFunction when def is not found in layers', () => {
      const state = makeState([]);
      updateVectorSelection({ 'missing-layer': ['f1'] }, {}, [], 'select', state);
      expect(setStyleFunction).not.toHaveBeenCalled();
    });

    it('should delete matching keys from lastSelection when they appear in selectionObj', () => {
      const layerDef = { id: 'layer-1', vectorStyle: { id: 'style-1' } };
      const state = makeState([layerDef]);
      const olLayer = { wv: { id: 'layer-1' } };
      getVectorLayers.mockReturnValue([olLayer]);
      const lastSelection = { 'layer-1': ['f1'] };
      updateVectorSelection({ 'layer-1': ['f2'] }, lastSelection, [layerDef], 'select', state);
      expect(lastSelection['layer-1']).toBeUndefined();
    });
  });
});

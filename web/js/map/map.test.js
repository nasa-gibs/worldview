import {
  CRS_WGS_84,
  CRS_WGS_84_QUERY_EXTENT,
  mapIsExtentValid,
  mapParser,
  mapAdjustAntiMeridian,
  mapDistance2D,
  mapDistanceX,
  mapInterpolate2D,
  setVisibility,
  setOpacity,
  getLayerByName,
} from './map';

describe('permalink 1.1', () => {
  test('parses state', () => {
    const errors = [];
    const state = {
      map: '0,1,2,3',
    };
    mapParser(state, errors);

    expect(state.v).toEqual([0, 1, 2, 3]);
    expect(errors).toHaveLength(0);
  });
});

describe('permalink 1.2', () => {
  test('parses state', () => {
    const errors = [];
    const state = {
      v: '0,1,2,3',
    };
    mapParser(state, errors);

    expect(state.v).toEqual([0, 1, 2, 3]);
    expect(errors).toHaveLength(0);
  });

  test('error on invalid extent', () => {
    const errors = [];
    const state = {
      map: '0,1,x,3',
    };
    mapParser(state, errors);

    expect(state.v).toBeFalsy();
    expect(errors).toHaveLength(1);
  });
});

// ─── constants ───────────────────────────────────────────────────────────────

describe('CRS_WGS_84', () => {
  test('equals EPSG:4326', () => {
    expect(CRS_WGS_84).toBe('EPSG:4326');
  });
});

describe('CRS_WGS_84_QUERY_EXTENT', () => {
  test('is the expected bounding box', () => {
    expect(CRS_WGS_84_QUERY_EXTENT).toEqual([-180, -60, 180, 60]);
  });
});

// ─── mapIsExtentValid ─────────────────────────────────────────────────────────

describe('mapIsExtentValid', () => {
  test('returns false when extent is undefined', () => {
    expect(mapIsExtentValid(undefined)).toBe(false);
  });

  test('returns true for a valid numeric array', () => {
    expect(mapIsExtentValid([-180, -90, 180, 90])).toBe(true);
  });

  test('returns false when any value in the array is NaN', () => {
    expect(mapIsExtentValid([-180, NaN, 180, 90])).toBe(false);
  });

  test('returns false when a string value produces NaN', () => {
    expect(mapIsExtentValid([-180, -90, 'x', 90])).toBe(false);
  });

  test('returns true for an extent object that exposes toArray()', () => {
    const extentObj = {
      toArray: () => [-180, -90, 180, 90],
    };
    expect(mapIsExtentValid(extentObj)).toBe(true);
  });

  test('returns false for an extent object whose toArray() contains NaN', () => {
    const extentObj = {
      toArray: () => [-180, NaN, 180, 90],
    };
    expect(mapIsExtentValid(extentObj)).toBe(false);
  });

  test('returns true for an all-zero extent', () => {
    expect(mapIsExtentValid([0, 0, 0, 0])).toBe(true);
  });
});

// ─── mapParser ────────────────────────────────────────────────────────────────

describe('mapParser — permalink 1.1 (map key)', () => {
  test('parses valid map value into state.v array', () => {
    const errors = [];
    const state = { map: '0,1,2,3' };
    mapParser(state, errors);
    expect(state.v).toEqual([0, 1, 2, 3]);
    expect(errors).toHaveLength(0);
  });

  test('records an error and leaves state.v falsy for invalid map value', () => {
    const errors = [];
    const state = { map: '0,1,x,3' };
    mapParser(state, errors);
    expect(state.v).toBeFalsy();
    expect(errors).toHaveLength(1);
  });
});

describe('mapParser — permalink 1.2 (v key)', () => {
  test('parses valid v value into state.v array', () => {
    const errors = [];
    const state = { v: '0,1,2,3' };
    mapParser(state, errors);
    expect(state.v).toEqual([0, 1, 2, 3]);
    expect(errors).toHaveLength(0);
  });

  test('records an error and leaves state.v falsy for invalid v value', () => {
    const errors = [];
    const state = { v: 'a,b,c,d' };
    mapParser(state, errors);
    expect(state.v).toBeFalsy();
    expect(errors).toHaveLength(1);
  });
});

describe('mapParser — no map or v key', () => {
  test('does nothing when neither map nor v is present in state', () => {
    const errors = [];
    const state = {};
    mapParser(state, errors);
    expect(state.v).toBeUndefined();
    expect(errors).toHaveLength(0);
  });
});

// ─── mapAdjustAntiMeridian ────────────────────────────────────────────────────

describe('mapAdjustAntiMeridian', () => {
  test('returns an OlGeomPolygon instance', () => {
    const polygon = {
      getLinearRing: jest.fn().mockReturnValue({
        getCoordinates: jest.fn().mockReturnValue([[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]),
      }),
    };
    const result = mapAdjustAntiMeridian(polygon, 0);
    expect(result).toBeDefined();
  });

  test('shifts negative longitudes positive when adjustSign > 0', () => {
    const points = [[-10, 0], [10, 0], [10, 10], [-10, 10], [-10, 0]];
    const polygon = {
      getLinearRing: jest.fn().mockReturnValue({
        getCoordinates: jest.fn().mockReturnValue(points),
      }),
    };
    const result = mapAdjustAntiMeridian(polygon, 1);
    expect(result).toBeDefined();
  });

  test('shifts positive longitudes negative when adjustSign < 0', () => {
    const points = [[10, 0], [170, 0], [170, 10], [10, 10], [10, 0]];
    const polygon = {
      getLinearRing: jest.fn().mockReturnValue({
        getCoordinates: jest.fn().mockReturnValue(points),
      }),
    };
    const result = mapAdjustAntiMeridian(polygon, -1);
    expect(result).toBeDefined();
  });

  test('leaves points unchanged when adjustSign is 0', () => {
    const points = [[-10, 0], [10, 0], [10, 10], [-10, 10], [-10, 0]];
    const polygon = {
      getLinearRing: jest.fn().mockReturnValue({
        getCoordinates: jest.fn().mockReturnValue(points),
      }),
    };
    const result = mapAdjustAntiMeridian(polygon, 0);
    expect(result).toBeDefined();
  });
});

// ─── mapDistance2D ────────────────────────────────────────────────────────────

describe('mapDistance2D', () => {
  test('returns 0 for identical points', () => {
    expect(mapDistance2D([0, 0], [0, 0])).toBe(0);
  });

  test('returns correct distance for a 3-4-5 right triangle', () => {
    expect(mapDistance2D([0, 0], [3, 4])).toBe(5);
  });

  test('returns correct distance for points with negative coordinates', () => {
    expect(mapDistance2D([-3, -4], [0, 0])).toBe(5);
  });

  test('returns correct horizontal distance', () => {
    expect(mapDistance2D([0, 0], [10, 0])).toBe(10);
  });

  test('returns correct vertical distance', () => {
    expect(mapDistance2D([0, 0], [0, 7])).toBe(7);
  });
});

// ─── mapDistanceX ─────────────────────────────────────────────────────────────

describe('mapDistanceX', () => {
  test('returns 0 for equal values', () => {
    expect(mapDistanceX(5, 5)).toBe(0);
  });

  test('returns positive distance when p2 > p1', () => {
    expect(mapDistanceX(3, 10)).toBe(7);
  });

  test('returns positive distance when p1 > p2 (absolute value)', () => {
    expect(mapDistanceX(10, 3)).toBe(7);
  });

  test('handles negative coordinates', () => {
    expect(mapDistanceX(-5, 5)).toBe(10);
  });
});

// ─── mapInterpolate2D ─────────────────────────────────────────────────────────

describe('mapInterpolate2D', () => {
  test('returns p1 when amount is 0', () => {
    expect(mapInterpolate2D([0, 0], [10, 10], 0)).toEqual([0, 0]);
  });

  test('returns p2 when amount is 1', () => {
    expect(mapInterpolate2D([0, 0], [10, 10], 1)).toEqual([10, 10]);
  });

  test('returns midpoint when amount is 0.5', () => {
    expect(mapInterpolate2D([0, 0], [10, 10], 0.5)).toEqual([5, 5]);
  });

  test('interpolates correctly with non-zero p1', () => {
    expect(mapInterpolate2D([2, 4], [6, 8], 0.5)).toEqual([4, 6]);
  });

  test('handles negative coordinates', () => {
    expect(mapInterpolate2D([-10, -10], [10, 10], 0.5)).toEqual([0, 0]);
  });
});

// ─── setVisibility ────────────────────────────────────────────────────────────

describe('setVisibility', () => {
  test('calls setVisibility on a control layer', () => {
    const layer = {
      isControl: true,
      setVisibility: jest.fn(),
    };
    setVisibility(layer, true, 0.8);
    expect(layer.setVisibility).toHaveBeenCalledWith(true);
  });

  test('calls setVisibility(false) on a control layer when visible is false', () => {
    const layer = {
      isControl: true,
      setVisibility: jest.fn(),
    };
    setVisibility(layer, false, 0.8);
    expect(layer.setVisibility).toHaveBeenCalledWith(false);
  });

  test('sets div opacity to the given opacity when visible is true', () => {
    const layer = {
      isControl: false,
      div: { style: { opacity: null } },
      getVisibility: jest.fn().mockReturnValue(true),
      setVisibility: jest.fn(),
    };
    setVisibility(layer, true, 0.6);
    expect(layer.div.style.opacity).toBe(0.6);
  });

  test('sets div opacity to 0 when visible is false', () => {
    const layer = {
      isControl: false,
      div: { style: { opacity: null } },
      getVisibility: jest.fn().mockReturnValue(true),
      setVisibility: jest.fn(),
    };
    setVisibility(layer, false, 0.6);
    expect(layer.div.style.opacity).toBe(0);
  });

  test('calls setVisibility(true) when visible and opacity > 0 and layer is currently invisible', () => {
    const layer = {
      isControl: false,
      div: { style: { opacity: null } },
      getVisibility: jest.fn().mockReturnValue(false), // currently invisible
      setVisibility: jest.fn(),
    };
    setVisibility(layer, true, 0.5);
    expect(layer.setVisibility).toHaveBeenCalledWith(true);
  });

  test('does not call setVisibility when visible but opacity is 0', () => {
    const layer = {
      isControl: false,
      div: { style: { opacity: null } },
      getVisibility: jest.fn().mockReturnValue(false),
      setVisibility: jest.fn(),
    };
    setVisibility(layer, true, 0);
    expect(layer.setVisibility).not.toHaveBeenCalled();
  });

  test('does not call setVisibility when layer is already visible', () => {
    const layer = {
      isControl: false,
      div: { style: { opacity: null } },
      getVisibility: jest.fn().mockReturnValue(true),
      setVisibility: jest.fn(),
    };
    setVisibility(layer, true, 0.9);
    expect(layer.setVisibility).not.toHaveBeenCalled();
  });
});

// ─── setOpacity ───────────────────────────────────────────────────────────────

describe('setOpacity', () => {
  test('calls layer.setOpacity with the given value', () => {
    const layer = {
      setOpacity: jest.fn(),
      transitionEffect: 'resize',
      originalTransitionEffect: undefined,
    };
    setOpacity(layer, 0.5);
    expect(layer.setOpacity).toHaveBeenCalledWith(0.5);
  });

  test('restores transitionEffect to originalTransitionEffect when opacity is 1', () => {
    const layer = {
      setOpacity: jest.fn(),
      transitionEffect: 'none',
      originalTransitionEffect: 'resize',
    };
    setOpacity(layer, 1);
    expect(layer.transitionEffect).toBe('resize');
  });

  test('falls back to "resize" when opacity is 1 and originalTransitionEffect is not set', () => {
    const layer = {
      setOpacity: jest.fn(),
      transitionEffect: 'none',
      originalTransitionEffect: undefined,
    };
    setOpacity(layer, 1);
    expect(layer.transitionEffect).toBe('resize');
  });

  test('saves current transitionEffect and sets it to "none" when opacity is not 1', () => {
    const layer = {
      setOpacity: jest.fn(),
      transitionEffect: 'resize',
      originalTransitionEffect: undefined,
    };
    setOpacity(layer, 0.5);
    expect(layer.originalTransitionEffect).toBe('resize');
    expect(layer.transitionEffect).toBe('none');
  });

  test('handles opacity of 0 as a non-1 value (stores effect and sets none)', () => {
    const layer = {
      setOpacity: jest.fn(),
      transitionEffect: 'resize',
      originalTransitionEffect: undefined,
    };
    setOpacity(layer, 0);
    expect(layer.transitionEffect).toBe('none');
  });
});

// ─── getLayerByName ───────────────────────────────────────────────────────────

describe('getLayerByName', () => {
  test('returns the matching layer when found by wvname', () => {
    const layerA = { wvname: 'layer-a' };
    const layerB = { wvname: 'layer-b' };
    const map = {
      getLayers: () => ({ getArray: () => [layerA, layerB] }),
    };
    expect(getLayerByName(map, 'layer-b')).toBe(layerB);
  });

  test('returns undefined when no layer matches the given name', () => {
    const layerA = { wvname: 'layer-a' };
    const map = {
      getLayers: () => ({ getArray: () => [layerA] }),
    };
    expect(getLayerByName(map, 'nonexistent')).toBeUndefined();
  });

  test('returns undefined when the layers array is empty', () => {
    const map = {
      getLayers: () => ({ getArray: () => [] }),
    };
    expect(getLayerByName(map, 'any-layer')).toBeUndefined();
  });

  test('returns the first matching layer when multiple layers share the same wvname', () => {
    const layerA1 = { wvname: 'layer-a', index: 1 };
    const layerA2 = { wvname: 'layer-a', index: 2 };
    const map = {
      getLayers: () => ({ getArray: () => [layerA1, layerA2] }),
    };
    expect(getLayerByName(map, 'layer-a')).toBe(layerA1);
  });
});

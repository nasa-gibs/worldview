import {
  CRS_WGS_84,
  CRS_WGS_84_QUERY_EXTENT,
  mapIsExtentValid,
  mapParser,
  mapIsPolygonValid,
  mapAdjustAntiMeridian,
  mapDistance2D,
  mapDistanceX,
  mapInterpolate2D,
  mapToPolys,
  setVisibility,
  setOpacity,
  getLayerByName,
} from './map';

// ─── Mock OlGeomPolygon so it never touches real OL geometry ─────────────────
jest.mock('ol/geom/Polygon', () =>
  jest.fn().mockImplementation((coords) => ({ coords, type: 'Polygon' })),
);

// =============================================================================
// Constants
// =============================================================================

describe('CRS_WGS_84', () => {
  test('is EPSG:4326', () => {
    expect(CRS_WGS_84).toBe('EPSG:4326');
  });
});

describe('CRS_WGS_84_QUERY_EXTENT', () => {
  test('is the correct bounding box', () => {
    expect(CRS_WGS_84_QUERY_EXTENT).toEqual([-180, -60, 180, 60]);
  });
});

// =============================================================================
// mapIsExtentValid
// =============================================================================

describe('mapIsExtentValid', () => {
  test('returns false when extent is undefined', () => {
    expect(mapIsExtentValid(undefined)).toBe(false);
  });

  test('returns true for a valid numeric array extent', () => {
    expect(mapIsExtentValid([-180, -90, 180, 90])).toBe(true);
  });

  test('returns true for an all-zero extent', () => {
    expect(mapIsExtentValid([0, 0, 0, 0])).toBe(true);
  });

  test('returns false when one value in the array is NaN', () => {
    expect(mapIsExtentValid([-180, NaN, 180, 90])).toBe(false);
  });

  test('returns false when a non-numeric string is in the array (parses as NaN)', () => {
    expect(mapIsExtentValid([-180, -90, 'x', 90])).toBe(false);
  });

  test('returns true for an extent object that has a toArray() method returning valid values', () => {
    const extentObj = { toArray: () => [-180, -90, 180, 90] };
    expect(mapIsExtentValid(extentObj)).toBe(true);
  });

  test('returns false for an extent object whose toArray() returns a NaN value', () => {
    const extentObj = { toArray: () => [-180, NaN, 180, 90] };
    expect(mapIsExtentValid(extentObj)).toBe(false);
  });
});

// =============================================================================
// mapParser
// =============================================================================

describe('mapParser', () => {
  describe('permalink 1.1 — map key', () => {
    test('moves map value to v, parses into numeric array, no errors', () => {
      const errors = [];
      const state = { map: '0,1,2,3' };
      mapParser(state, errors);
      expect(state.v).toEqual([0, 1, 2, 3]);
      expect(state.map).toBeUndefined();
      expect(errors).toHaveLength(0);
    });

    test('pushes an error and deletes v when map value contains a non-numeric token', () => {
      const errors = [];
      const state = { map: '0,1,x,3' };
      mapParser(state, errors);
      expect(state.v).toBeUndefined();
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toMatch(/Invalid extent/);
    });
  });

  describe('permalink 1.2 — v key', () => {
    test('parses valid v string into numeric array, no errors', () => {
      const errors = [];
      const state = { v: '0,1,2,3' };
      mapParser(state, errors);
      expect(state.v).toEqual([0, 1, 2, 3]);
      expect(errors).toHaveLength(0);
    });

    test('pushes an error and deletes v when v value contains a non-numeric token', () => {
      const errors = [];
      const state = { v: 'a,b,c,d' };
      mapParser(state, errors);
      expect(state.v).toBeUndefined();
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toMatch(/Invalid extent/);
    });

    test('parses negative coordinates correctly', () => {
      const errors = [];
      const state = { v: '-180,-90,180,90' };
      mapParser(state, errors);
      expect(state.v).toEqual([-180, -90, 180, 90]);
      expect(errors).toHaveLength(0);
    });
  });

  describe('no map or v key present', () => {
    test('does nothing when state has neither map nor v', () => {
      const errors = [];
      const state = {};
      mapParser(state, errors);
      expect(state.v).toBeUndefined();
      expect(errors).toHaveLength(0);
    });
  });
});

// =============================================================================
// mapIsPolygonValid
// =============================================================================

describe('mapIsPolygonValid', () => {
  // Helper to build a mock OL polygon whose outer ring has the given coordinates
  const buildPolygon = (coords) => ({
    getLinearRing: () => ({
      getCoordinates: () => coords,
    }),
  });

  test('returns true when no consecutive points exceed maxDistance', () => {
    const polygon = buildPolygon([[0, 0], [5, 0], [5, 5], [0, 5], [0, 0]]);
    expect(mapIsPolygonValid(polygon, 10)).toBe(true);
  });

  test('returns false when a consecutive x-distance exceeds maxDistance', () => {
    // jump of 15 in x between first and second point
    const polygon = buildPolygon([[0, 0], [15, 0], [15, 5], [0, 5], [0, 0]]);
    expect(mapIsPolygonValid(polygon, 10)).toBe(false);
  });

  test('returns true for a single-segment polygon within maxDistance', () => {
    const polygon = buildPolygon([[0, 0], [10, 0]]);
    expect(mapIsPolygonValid(polygon, 10)).toBe(true);
  });

  test('returns false when the distance exactly exceeds maxDistance', () => {
    // Math.abs(11 - 0) = 11 > 10
    const polygon = buildPolygon([[0, 0], [11, 0], [11, 5]]);
    expect(mapIsPolygonValid(polygon, 10)).toBe(false);
  });

  test('handles negative x-direction crossing (abs value compared)', () => {
    // jump from 10 to -5 → abs diff = 15 > 10
    const polygon = buildPolygon([[10, 0], [-5, 0], [-5, 5]]);
    expect(mapIsPolygonValid(polygon, 10)).toBe(false);
  });

  test('returns true for an empty coordinate list', () => {
    const polygon = buildPolygon([]);
    expect(mapIsPolygonValid(polygon, 10)).toBe(true);
  });
});

// =============================================================================
// mapAdjustAntiMeridian
// =============================================================================

describe('mapAdjustAntiMeridian', () => {
  // mapAdjustAntiMeridian takes an OL polygon and an adjustSign value.
  // It reads outer ring coords, adjusts them, and returns a new OlGeomPolygon.
  const buildPolygon = (coords) => ({
    getLinearRing: () => ({
      getCoordinates: () => coords.map((c) => [...c]), // return copies
    }),
  });

  test('returns an OlGeomPolygon object', () => {
    const polygon = buildPolygon([[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]);
    const result = mapAdjustAntiMeridian(polygon, 0);
    expect(result).toBeDefined();
  });

  test('does not shift coordinates when adjustSign is 0', () => {
    const OlGeomPolygon = require('ol/geom/Polygon');
    OlGeomPolygon.mockClear();
    const coords = [[-10, 0], [10, 0], [10, 10], [-10, 10], [-10, 0]];
    const polygon = buildPolygon(coords);
    mapAdjustAntiMeridian(polygon, 0);
    const passedCoords = OlGeomPolygon.mock.calls[0][0][0];
    expect(passedCoords).toEqual([[-10, 0], [10, 0], [10, 10], [-10, 10], [-10, 0]]);
  });

  test('adds 360 to negative x-coordinates when adjustSign is positive (+1)', () => {
    const OlGeomPolygon = require('ol/geom/Polygon');
    OlGeomPolygon.mockClear();
    const coords = [[-10, 0], [10, 0], [10, 10], [-10, 10], [-10, 0]];
    const polygon = buildPolygon(coords);
    mapAdjustAntiMeridian(polygon, 1);
    const passedCoords = OlGeomPolygon.mock.calls[0][0][0];
    // -10 → 350, 10 stays 10
    expect(passedCoords[0][0]).toBe(350);
    expect(passedCoords[1][0]).toBe(10);
    expect(passedCoords[3][0]).toBe(350);
  });

  test('leaves positive x-coordinates unchanged when adjustSign is positive', () => {
    const OlGeomPolygon = require('ol/geom/Polygon');
    OlGeomPolygon.mockClear();
    const coords = [[10, 0], [20, 0], [20, 5], [10, 5], [10, 0]];
    const polygon = buildPolygon(coords);
    mapAdjustAntiMeridian(polygon, 1);
    const passedCoords = OlGeomPolygon.mock.calls[0][0][0];
    expect(passedCoords[0][0]).toBe(10);
    expect(passedCoords[1][0]).toBe(20);
  });

  test('subtracts 360 from positive x-coordinates when adjustSign is negative (-1)', () => {
    const OlGeomPolygon = require('ol/geom/Polygon');
    OlGeomPolygon.mockClear();
    const coords = [[10, 0], [170, 0], [170, 10], [10, 10], [10, 0]];
    const polygon = buildPolygon(coords);
    mapAdjustAntiMeridian(polygon, -1);
    const passedCoords = OlGeomPolygon.mock.calls[0][0][0];
    // 10 → -350, 170 → -190
    expect(passedCoords[0][0]).toBe(10 - 360);
    expect(passedCoords[1][0]).toBe(170 - 360);
  });

  test('leaves negative x-coordinates unchanged when adjustSign is negative', () => {
    const OlGeomPolygon = require('ol/geom/Polygon');
    OlGeomPolygon.mockClear();
    const coords = [[-10, 0], [-20, 0], [-20, 5], [-10, 5], [-10, 0]];
    const polygon = buildPolygon(coords);
    mapAdjustAntiMeridian(polygon, -1);
    const passedCoords = OlGeomPolygon.mock.calls[0][0][0];
    expect(passedCoords[0][0]).toBe(-10);
    expect(passedCoords[1][0]).toBe(-20);
  });
});

// =============================================================================
// mapDistance2D
// =============================================================================

describe('mapDistance2D', () => {
  test('returns 0 for identical points', () => {
    expect(mapDistance2D([0, 0], [0, 0])).toBe(0);
  });

  test('returns 5 for a 3-4-5 right triangle', () => {
    expect(mapDistance2D([0, 0], [3, 4])).toBe(5);
  });

  test('works correctly with negative coordinates', () => {
    expect(mapDistance2D([-3, -4], [0, 0])).toBe(5);
  });

  test('returns the horizontal distance when y values are equal', () => {
    expect(mapDistance2D([0, 0], [10, 0])).toBe(10);
  });

  test('returns the vertical distance when x values are equal', () => {
    expect(mapDistance2D([0, 0], [0, 7])).toBe(7);
  });

  test('is symmetric (order of points does not matter)', () => {
    expect(mapDistance2D([1, 2], [4, 6])).toBeCloseTo(mapDistance2D([4, 6], [1, 2]));
  });
});

// =============================================================================
// mapDistanceX
// =============================================================================

describe('mapDistanceX', () => {
  test('returns 0 when both values are equal', () => {
    expect(mapDistanceX(5, 5)).toBe(0);
  });

  test('returns positive distance when p2 > p1', () => {
    expect(mapDistanceX(3, 10)).toBe(7);
  });

  test('returns positive distance when p1 > p2 (absolute value)', () => {
    expect(mapDistanceX(10, 3)).toBe(7);
  });

  test('handles negative values', () => {
    expect(mapDistanceX(-5, 5)).toBe(10);
  });

  test('handles both negative values', () => {
    expect(mapDistanceX(-10, -3)).toBe(7);
  });
});

// =============================================================================
// mapInterpolate2D
// =============================================================================

describe('mapInterpolate2D', () => {
  test('returns p1 exactly when amount is 0', () => {
    expect(mapInterpolate2D([0, 0], [10, 10], 0)).toEqual([0, 0]);
  });

  test('returns p2 exactly when amount is 1', () => {
    expect(mapInterpolate2D([0, 0], [10, 10], 1)).toEqual([10, 10]);
  });

  test('returns the midpoint when amount is 0.5', () => {
    expect(mapInterpolate2D([0, 0], [10, 10], 0.5)).toEqual([5, 5]);
  });

  test('interpolates correctly with a non-zero starting point', () => {
    expect(mapInterpolate2D([2, 4], [6, 8], 0.5)).toEqual([4, 6]);
  });

  test('handles negative coordinates', () => {
    expect(mapInterpolate2D([-10, -10], [10, 10], 0.5)).toEqual([0, 0]);
  });

  test('handles amount greater than 1 (extrapolation)', () => {
    expect(mapInterpolate2D([0, 0], [10, 10], 2)).toEqual([20, 20]);
  });
});

// =============================================================================
// mapToPolys
// =============================================================================

describe('mapToPolys', () => {
  test('returns getPolygons() result when the geometry has a getPolygons method', () => {
    const polys = [{ type: 'Polygon' }, { type: 'Polygon' }];
    const geom = { getPolygons: () => polys };
    expect(mapToPolys(geom)).toBe(polys);
  });

  test('wraps the geometry in an array when it does not have a getPolygons method', () => {
    const geom = { type: 'Polygon' };
    expect(mapToPolys(geom)).toEqual([geom]);
  });
});

// =============================================================================
// setVisibility
// =============================================================================

describe('setVisibility', () => {
  describe('control layer (isControl = true)', () => {
    test('calls setVisibility(true) when visible is true', () => {
      const layer = { isControl: true, setVisibility: jest.fn() };
      setVisibility(layer, true, 0.8);
      expect(layer.setVisibility).toHaveBeenCalledWith(true);
    });

    test('calls setVisibility(false) when visible is false', () => {
      const layer = { isControl: true, setVisibility: jest.fn() };
      setVisibility(layer, false, 0.8);
      expect(layer.setVisibility).toHaveBeenCalledWith(false);
    });
  });

  describe('non-control layer (isControl = false / undefined)', () => {
    const buildLayer = (isCurrentlyVisible = true) => ({
      isControl: false,
      div: { style: { opacity: null } },
      getVisibility: jest.fn().mockReturnValue(isCurrentlyVisible),
      setVisibility: jest.fn(),
    });

    test('sets div opacity to the given opacity when visible is true', () => {
      const layer = buildLayer(true);
      setVisibility(layer, true, 0.6);
      expect(layer.div.style.opacity).toBe(0.6);
    });

    test('sets div opacity to 0 when visible is false', () => {
      const layer = buildLayer(true);
      setVisibility(layer, false, 0.6);
      expect(layer.div.style.opacity).toBe(0);
    });

    test('calls setVisibility(true) when visible=true, opacity > 0 and layer is currently not visible', () => {
      const layer = buildLayer(false); // currently invisible
      setVisibility(layer, true, 0.5);
      expect(layer.setVisibility).toHaveBeenCalledWith(true);
    });

    test('does not call setVisibility when layer is already visible', () => {
      const layer = buildLayer(true); // already visible
      setVisibility(layer, true, 0.9);
      expect(layer.setVisibility).not.toHaveBeenCalled();
    });

    test('does not call setVisibility when visible is true but opacity is 0', () => {
      const layer = buildLayer(false);
      setVisibility(layer, true, 0);
      expect(layer.setVisibility).not.toHaveBeenCalled();
    });

    test('does not call setVisibility when visible is false', () => {
      const layer = buildLayer(false);
      setVisibility(layer, false, 0.8);
      expect(layer.setVisibility).not.toHaveBeenCalled();
    });
  });
});

// =============================================================================
// setOpacity
// =============================================================================

describe('setOpacity', () => {
  test('always calls layer.setOpacity with the given value', () => {
    const layer = { setOpacity: jest.fn(), transitionEffect: 'resize', originalTransitionEffect: undefined };
    setOpacity(layer, 0.5);
    expect(layer.setOpacity).toHaveBeenCalledWith(0.5);
  });

  describe('when opacity is exactly 1', () => {
    test('restores transitionEffect to originalTransitionEffect', () => {
      const layer = { setOpacity: jest.fn(), transitionEffect: 'none', originalTransitionEffect: 'resize' };
      setOpacity(layer, 1);
      expect(layer.transitionEffect).toBe('resize');
    });

    test('defaults transitionEffect to "resize" when originalTransitionEffect is not set', () => {
      const layer = { setOpacity: jest.fn(), transitionEffect: 'none', originalTransitionEffect: undefined };
      setOpacity(layer, 1);
      expect(layer.transitionEffect).toBe('resize');
    });
  });

  describe('when opacity is not 1', () => {
    test('saves current transitionEffect to originalTransitionEffect', () => {
      const layer = { setOpacity: jest.fn(), transitionEffect: 'resize', originalTransitionEffect: undefined };
      setOpacity(layer, 0.5);
      expect(layer.originalTransitionEffect).toBe('resize');
    });

    test('sets transitionEffect to "none"', () => {
      const layer = { setOpacity: jest.fn(), transitionEffect: 'resize', originalTransitionEffect: undefined };
      setOpacity(layer, 0.5);
      expect(layer.transitionEffect).toBe('none');
    });

    test('also sets transitionEffect to "none" for opacity of 0', () => {
      const layer = { setOpacity: jest.fn(), transitionEffect: 'resize', originalTransitionEffect: undefined };
      setOpacity(layer, 0);
      expect(layer.transitionEffect).toBe('none');
    });
  });
});

// =============================================================================
// getLayerByName
// =============================================================================

describe('getLayerByName', () => {
  const buildMap = (layers) => ({
    getLayers: () => ({ getArray: () => layers }),
  });

  test('returns the matching layer when found by wvname', () => {
    const layerA = { wvname: 'layer-a' };
    const layerB = { wvname: 'layer-b' };
    const map = buildMap([layerA, layerB]);
    expect(getLayerByName(map, 'layer-b')).toBe(layerB);
  });

  test('returns undefined when no layer matches the given name', () => {
    const layerA = { wvname: 'layer-a' };
    const map = buildMap([layerA]);
    expect(getLayerByName(map, 'nonexistent')).toBeUndefined();
  });

  test('returns undefined when the layers array is empty', () => {
    const map = buildMap([]);
    expect(getLayerByName(map, 'any-layer')).toBeUndefined();
  });

  test('returns the first matching layer when multiple layers share the same wvname', () => {
    const layerA1 = { wvname: 'layer-a', index: 1 };
    const layerA2 = { wvname: 'layer-a', index: 2 };
    const map = buildMap([layerA1, layerA2]);
    expect(getLayerByName(map, 'layer-a')).toBe(layerA1);
  });
});

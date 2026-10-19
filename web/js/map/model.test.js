import mapModel from './model';

const mockProj4Defs = jest.fn();
jest.mock('proj4', () => ({
  __esModule: true,
  default: {
    defs: (...args) => mockProj4Defs(...args),
  },
}));

const mockRegister = jest.fn();
jest.mock('ol/proj/proj4', () => ({
  register: (...args) => mockRegister(...args),
}));

const mockSetExtent = jest.fn();
const mockOlProjGet = jest.fn(() => ({ setExtent: mockSetExtent }));
jest.mock('ol/proj', () => ({
  get: (...args) => mockOlProjGet(...args),
}));

const mockIntersects = jest.fn();
jest.mock('ol/extent', () => ({
  intersects: (...args) => mockIntersects(...args),
}));

const geographicDef = {
  id: 'geographic',
  crs: 'EPSG:4326',
  proj4: '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs',
  maxExtent: [-180, -90, 180, 90],
};

const arcticDef = {
  id: 'arctic',
  crs: 'EPSG:3413',
  proj4: '+proj=stere +lat_0=90 +lat_ts=70',
  maxExtent: [-4194304, -4194304, 4194304, 4194304],
};

const buildConfig = (projections) => ({ projections });

const buildModels = (selectedId = 'geographic') => ({
  proj: { selected: { id: selectedId } },
});

beforeEach(() => {
  jest.clearAllMocks();
  mockIntersects.mockReturnValue(true);
});

describe('mapModel construction (init)', () => {
  test('exposes default state', () => {
    const self = mapModel(buildModels(), buildConfig({}));
    expect(self.extent).toBeNull();
    expect(self.selectedMap).toBeNull();
    expect(self.ui).toBeNull();
    expect(self.rotation).toBe(0);
  });

  test('does nothing when config has no projections', () => {
    mapModel(buildModels(), {});
    expect(mockProj4Defs).not.toHaveBeenCalled();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  test('registers projections that have both crs and proj4', () => {
    mapModel(buildModels(), buildConfig({ geographic: geographicDef, arctic: arcticDef }));
    expect(mockProj4Defs).toHaveBeenCalledTimes(2);
    expect(mockProj4Defs).toHaveBeenCalledWith(geographicDef.crs, geographicDef.proj4);
    expect(mockProj4Defs).toHaveBeenCalledWith(arcticDef.crs, arcticDef.proj4);
  });

  test('skips projections missing crs or proj4', () => {
    const partial = { crs: 'EPSG:4326' };
    mapModel(buildModels(), buildConfig({ partial }));
    expect(mockProj4Defs).not.toHaveBeenCalled();
  });
});

describe('self.register', () => {
  test('registers a valid definition and sets the extent', () => {
    const self = mapModel(buildModels(), buildConfig({}));
    self.register(geographicDef);
    expect(mockProj4Defs).toHaveBeenCalledWith(geographicDef.crs, geographicDef.proj4);
    expect(mockRegister).toHaveBeenCalled();
    expect(mockOlProjGet).toHaveBeenCalledWith(geographicDef.crs);
    expect(mockSetExtent).toHaveBeenCalledWith(geographicDef.maxExtent);
  });

  test('does nothing for a definition without proj4', () => {
    const self = mapModel(buildModels(), buildConfig({}));
    self.register({ crs: 'EPSG:4326' });
    expect(mockProj4Defs).not.toHaveBeenCalled();
  });

  test('does nothing for an undefined definition', () => {
    const self = mapModel(buildModels(), buildConfig({}));
    self.register(undefined);
    expect(mockProj4Defs).not.toHaveBeenCalled();
  });
});

describe('self.update', () => {
  test('stores the extent', () => {
    const self = mapModel(buildModels(), buildConfig({}));
    const extent = [-10, -10, 10, 10];
    self.update(extent);
    expect(self.extent).toBe(extent);
  });
});

describe('self.updateMap', () => {
  test('stores the map and ui references', () => {
    const self = mapModel(buildModels(), buildConfig({}));
    const map = {};
    const ui = {};
    self.updateMap(map, ui);
    expect(self.selectedMap).toBe(map);
    expect(self.ui).toBe(ui);
  });
});

describe('self.getZoom', () => {
  test('returns null when no map is selected', () => {
    const self = mapModel(buildModels(), buildConfig({}));
    expect(self.getZoom()).toBeNull();
  });

  test('returns the zoom from the selected map view', () => {
    const self = mapModel(buildModels(), buildConfig({}));
    const map = { getView: () => ({ getZoom: () => 5 }) };
    self.updateMap(map, {});
    expect(self.getZoom()).toBe(5);
  });
});

describe('self.load', () => {
  test('sets extent when within range', () => {
    const config = buildConfig({ geographic: geographicDef });
    const self = mapModel(buildModels(), config);
    const errors = [];
    const state = { v: [-10, -10, 10, 10], p: 'geographic' };
    mockIntersects.mockReturnValue(true);
    self.load(state, errors);
    expect(self.extent).toEqual(state.v);
    expect(errors).toHaveLength(0);
    expect(self.loaded).toBe(true);
  });

  test('defaults the projection to geographic when state.p is absent', () => {
    const config = buildConfig({ geographic: geographicDef });
    const self = mapModel(buildModels(), config);
    const state = { v: [-10, -10, 10, 10] };
    self.load(state, []);
    expect(self.extent).toEqual(state.v);
  });

  test('overrides geographic maxExtent and sets wrapExtent', () => {
    const geoDef = { ...geographicDef };
    const config = buildConfig({ geographic: geoDef });
    const self = mapModel(buildModels(), config);
    self.load({ v: [-10, -10, 10, 10], p: 'geographic' }, []);
    expect(geoDef.wrapExtent).toEqual([-250, -90, 250, 90]);
  });

  test('falls back to maxExtent and pushes an error when out of range', () => {
    const config = buildConfig({ arctic: arcticDef });
    const self = mapModel(buildModels(), config);
    const errors = [];
    mockIntersects.mockReturnValue(false);
    self.load({ v: [9e9, 9e9, 1e10, 1e10], p: 'arctic' }, errors);
    expect(self.extent).toEqual(arcticDef.maxExtent);
    expect(self.extent).not.toBe(arcticDef.maxExtent);
    expect(errors).toEqual([{ message: 'Extent outside of range' }]);
  });

  test('pushes an error when the projection does not exist', () => {
    const config = buildConfig({ geographic: geographicDef });
    const self = mapModel(buildModels(), config);
    const errors = [];
    self.load({ v: [-10, -10, 10, 10], p: 'does-not-exist' }, errors);
    expect(errors).toEqual([{ message: 'Projection does not exist' }]);
  });

  test('ignores extent logic when state.v is absent', () => {
    const config = buildConfig({ geographic: geographicDef });
    const self = mapModel(buildModels(), config);
    const errors = [];
    self.load({ p: 'geographic' }, errors);
    expect(self.extent).toBeNull();
    expect(errors).toHaveLength(0);
  });

  test('converts rotation to radians for polar projections', () => {
    const config = buildConfig({ arctic: arcticDef });
    const self = mapModel(buildModels(), config);
    self.load({ p: 'arctic', r: 90 }, []);
    expect(self.rotation).toBeCloseTo(Math.PI / 2);
  });

  test('handles antarctic rotation', () => {
    const config = buildConfig({ arctic: arcticDef });
    const self = mapModel(buildModels(), config);
    self.load({ p: 'antarctic', r: 180 }, []);
    expect(self.rotation).toBeCloseTo(Math.PI);
  });

  test('leaves rotation untouched when r is NaN', () => {
    const config = buildConfig({ arctic: arcticDef });
    const self = mapModel(buildModels(), config);
    self.load({ p: 'arctic', r: NaN }, []);
    expect(self.rotation).toBe(0);
  });

  test('returns self', () => {
    const config = buildConfig({ geographic: geographicDef });
    const self = mapModel(buildModels(), config);
    expect(self.load({}, [])).toBe(self);
  });
});

describe('self.save', () => {
  test('saves a clone of the extent', () => {
    const self = mapModel(buildModels(), buildConfig({}));
    self.extent = [-10, -10, 10, 10];
    const stateObj = {};
    self.save(stateObj);
    expect(stateObj.v).toEqual(self.extent);
    expect(stateObj.v).not.toBe(self.extent);
  });

  test('saves rotation in degrees for non-geographic projections', () => {
    const self = mapModel(buildModels('arctic'), buildConfig({}));
    self.rotation = Math.PI / 2;
    const stateObj = {};
    self.save(stateObj);
    expect(Number(stateObj.r)).toBeCloseTo(90);
  });

  test('does not save rotation when it is zero', () => {
    const self = mapModel(buildModels('arctic'), buildConfig({}));
    self.rotation = 0;
    const stateObj = {};
    self.save(stateObj);
    expect(stateObj.r).toBeUndefined();
  });

  test('does not save rotation for the geographic projection', () => {
    const self = mapModel(buildModels('geographic'), buildConfig({}));
    self.rotation = Math.PI / 2;
    const stateObj = {};
    self.save(stateObj);
    expect(stateObj.r).toBeUndefined();
  });
});

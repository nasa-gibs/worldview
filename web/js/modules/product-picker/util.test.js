import {
  getRecentLayers,
  clearRecentLayers,
  clearSingleRecentLayer,
  updateRecentLayers,
  recentLayerInfo,
} from './util';

import safeLocalStorage from '../../util/local-storage';
import util from '../../util/util';

jest.mock('../../util/local-storage', () => ({
  keys: { RECENT_LAYERS: 'RECENT_LAYERS' },
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  enabled: true,
}));

jest.mock('../../util/util', () => ({
  now: jest.fn(),
}));

const PROJ = 'geographic';
const ALL_PROJECTIONS = ['geographic', 'arctic', 'antarctic'];

function makeLayerEntry(id, count, dateAdded) {
  return { id, count, dateAdded };
}

function makeStoredLayers(overrides = {}) {
  return {
    geographic: [],
    arctic: [],
    antarctic: [],
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  safeLocalStorage.enabled = true;
  util.now.mockReturnValue({ valueOf: () => 1000 });
});

describe('recentLayerInfo', () => {
  it('is a non-empty string', () => {
    expect(typeof recentLayerInfo).toBe('string');
    expect(recentLayerInfo.length).toBeGreaterThan(0);
  });

  it('mentions frequency of use', () => {
    expect(recentLayerInfo).toMatch(/frequency of use/i);
  });
});

describe('getRecentLayers', () => {
  it('returns empty array when localStorage returns null', () => {
    safeLocalStorage.getItem.mockReturnValue(null);
    const result = getRecentLayers({}, PROJ);
    expect(result).toEqual([]);
  });

  it('returns empty array when proj key does not exist in stored layers', () => {
    safeLocalStorage.getItem.mockReturnValue(JSON.stringify({ arctic: [] }));
    const result = getRecentLayers({}, PROJ);
    expect(result).toEqual([]);
  });

  it('returns mapped layer objects sorted by count descending', () => {
    const stored = makeStoredLayers({
      geographic: [
        makeLayerEntry('layer-a', 2, 500),
        makeLayerEntry('layer-b', 5, 400),
        makeLayerEntry('layer-c', 1, 600),
      ],
    });
    safeLocalStorage.getItem.mockReturnValue(JSON.stringify(stored));
    const layerConfig = {
      'layer-a': { id: 'layer-a', title: 'Layer A' },
      'layer-b': { id: 'layer-b', title: 'Layer B' },
      'layer-c': { id: 'layer-c', title: 'Layer C' },
    };
    const result = getRecentLayers(layerConfig, PROJ);
    expect(result[0].id).toBe('layer-b');
    expect(result[1].id).toBe('layer-a');
    expect(result[2].id).toBe('layer-c');
  });

  it('filters out layers not found in layerConfig', () => {
    const stored = makeStoredLayers({
      geographic: [
        makeLayerEntry('layer-known', 3, 500),
        makeLayerEntry('layer-unknown', 3, 400),
      ],
    });
    safeLocalStorage.getItem.mockReturnValue(JSON.stringify(stored));
    const layerConfig = {
      'layer-known': { id: 'layer-known', title: 'Known' },
    };
    const result = getRecentLayers(layerConfig, PROJ);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('layer-known');
  });

  it('sorts by dateAdded ascending when counts are equal', () => {
    const stored = makeStoredLayers({
      geographic: [
        makeLayerEntry('layer-newer', 3, 800),
        makeLayerEntry('layer-older', 3, 200),
      ],
    });
    safeLocalStorage.getItem.mockReturnValue(JSON.stringify(stored));
    const layerConfig = {
      'layer-newer': { id: 'layer-newer' },
      'layer-older': { id: 'layer-older' },
    };
    const result = getRecentLayers(layerConfig, PROJ);
    expect(result[0].id).toBe('layer-older');
    expect(result[1].id).toBe('layer-newer');
  });
});

describe('clearRecentLayers', () => {
  it('calls safeLocalStorage.removeItem with the correct key', () => {
    clearRecentLayers();
    expect(safeLocalStorage.removeItem).toHaveBeenCalledWith('RECENT_LAYERS');
  });
});

describe('clearSingleRecentLayer', () => {
  it('removes the layer from all its projections in storage', () => {
    const stored = makeStoredLayers({
      geographic: [makeLayerEntry('layer-1', 1, 100), makeLayerEntry('layer-2', 2, 200)],
      arctic: [makeLayerEntry('layer-1', 1, 100)],
    });
    safeLocalStorage.getItem.mockReturnValue(JSON.stringify(stored));

    const layer = {
      id: 'layer-1',
      projections: { geographic: {}, arctic: {} },
    };

    clearSingleRecentLayer(layer, ALL_PROJECTIONS);

    const saved = JSON.parse(safeLocalStorage.setItem.mock.calls[0][1]);
    expect(saved.geographic.find((l) => l.id === 'layer-1')).toBeUndefined();
    expect(saved.arctic.find((l) => l.id === 'layer-1')).toBeUndefined();
    expect(saved.geographic.find((l) => l.id === 'layer-2')).toBeDefined();
  });

  it('handles missing projection keys in storage gracefully', () => {
    safeLocalStorage.getItem.mockReturnValue(null);

    const layer = {
      id: 'layer-1',
      projections: { geographic: {} },
    };

    expect(() => clearSingleRecentLayer(layer, ALL_PROJECTIONS)).not.toThrow();
    expect(safeLocalStorage.setItem).toHaveBeenCalled();
  });
});

describe('updateRecentLayers', () => {
  it('does nothing when safeLocalStorage is not enabled', () => {
    safeLocalStorage.enabled = false;
    const layer = { id: 'layer-1', projections: { geographic: {} } };
    updateRecentLayers(layer, ALL_PROJECTIONS);
    expect(safeLocalStorage.setItem).not.toHaveBeenCalled();
  });

  it('adds a new layer entry with count 1', () => {
    const stored = makeStoredLayers({ geographic: [] });
    safeLocalStorage.getItem.mockReturnValue(JSON.stringify(stored));
    util.now.mockReturnValue({ valueOf: () => 12345 });

    const layer = { id: 'layer-new', projections: { geographic: {} } };
    updateRecentLayers(layer, ALL_PROJECTIONS);

    const saved = JSON.parse(safeLocalStorage.setItem.mock.calls[0][1]);
    const entry = saved.geographic.find((l) => l.id === 'layer-new');
    expect(entry).toBeDefined();
    expect(entry.count).toBe(1);
    expect(entry.dateAdded).toBe(12345);
  });

  it('increments count for an existing layer entry', () => {
    const stored = makeStoredLayers({
      geographic: [makeLayerEntry('layer-existing', 3, 500)],
    });
    safeLocalStorage.getItem.mockReturnValue(JSON.stringify(stored));
    util.now.mockReturnValue({ valueOf: () => 9999 });

    const layer = { id: 'layer-existing', projections: { geographic: {} } };
    updateRecentLayers(layer, ALL_PROJECTIONS);

    const saved = JSON.parse(safeLocalStorage.setItem.mock.calls[0][1]);
    const entry = saved.geographic.find((l) => l.id === 'layer-existing');
    expect(entry.count).toBe(4);
    expect(entry.dateAdded).toBe(9999);
  });

  it('evicts the oldest lowest-count entry when at MAX (20) layers', () => {
    const layers = Array.from({ length: 20 }, (_, i) => makeLayerEntry(`layer-${i}`, i + 1, (i + 1) * 100));
    layers[0] = makeLayerEntry('layer-0', 1, 50);
    layers[1] = makeLayerEntry('layer-1', 1, 100);

    const stored = makeStoredLayers({ geographic: layers });
    safeLocalStorage.getItem.mockReturnValue(JSON.stringify(stored));
    util.now.mockReturnValue({ valueOf: () => 99999 });

    const layer = { id: 'layer-new', projections: { geographic: {} } };
    updateRecentLayers(layer, ALL_PROJECTIONS);

    const saved = JSON.parse(safeLocalStorage.setItem.mock.calls[0][1]);
    expect(saved.geographic).toHaveLength(20);
    expect(saved.geographic.find((l) => l.id === 'layer-0')).toBeUndefined();
    expect(saved.geographic.find((l) => l.id === 'layer-new')).toBeDefined();
  });

  it('handles null localStorage (initializes from default object) when adding new layer', () => {
    safeLocalStorage.getItem.mockReturnValue(null);
    util.now.mockReturnValue({ valueOf: () => 1 });

    const layer = { id: 'layer-fresh', projections: { geographic: {} } };
    updateRecentLayers(layer, ALL_PROJECTIONS);

    const saved = JSON.parse(safeLocalStorage.setItem.mock.calls[0][1]);
    expect(saved.geographic.find((l) => l.id === 'layer-fresh')).toBeDefined();
  });

  it('updates across multiple projections', () => {
    const stored = makeStoredLayers({ geographic: [], arctic: [] });
    safeLocalStorage.getItem.mockReturnValue(JSON.stringify(stored));
    util.now.mockReturnValue({ valueOf: () => 777 });

    const layer = { id: 'multi-proj-layer', projections: { geographic: {}, arctic: {} } };
    updateRecentLayers(layer, ALL_PROJECTIONS);

    const saved = JSON.parse(safeLocalStorage.setItem.mock.calls[0][1]);
    expect(saved.geographic.find((l) => l.id === 'multi-proj-layer')).toBeDefined();
    expect(saved.arctic.find((l) => l.id === 'multi-proj-layer')).toBeDefined();
  });

  it('adds missing projection keys when stored object is incomplete', () => {
    const incomplete = { geographic: [] };
    safeLocalStorage.getItem.mockReturnValue(JSON.stringify(incomplete));
    util.now.mockReturnValue({ valueOf: () => 1 });

    const layer = { id: 'layer-x', projections: { geographic: {} } };
    updateRecentLayers(layer, ALL_PROJECTIONS);

    const saved = JSON.parse(safeLocalStorage.setItem.mock.calls[0][1]);
    expect(saved.arctic).toBeDefined();
    expect(saved.antarctic).toBeDefined();
  });
});

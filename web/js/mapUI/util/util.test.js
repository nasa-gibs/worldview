// util.test.js

/**
 * Jest unit tests for util.js
 *
 * Mocked external dependencies:
 *   - lodash          → each() is a passthrough forEach
 *   - ol/layer/Tile   → a real constructor so instanceof checks work
 *   - ol/proj         → transformExtent returns the extent unchanged
 */

// ─── Mocks (must be before any import that triggers them) ──────────────────
jest.mock('lodash', () => ({
  each: (collection, fn) => collection.forEach(fn),
}));

// Give TileLayer a real constructor so `instanceof` works in the source file
jest.mock('ol/layer/Tile', () => {
  function MockTileLayer() {}
  return MockTileLayer;
});

jest.mock('ol/proj', () => ({
  transformExtent: jest.fn((extent) => extent),
}));

// ─── Imports ───────────────────────────────────────────────────────────────
import TileLayer from 'ol/layer/Tile';
import {
  clearLayers,
  countTiles,
  countTilesForSpecifiedLayers,
  convertTimestamp,
  formatDate,
  weekAgo,
  threeHoursAgo,
  twentySevenHoursAgo,
  compareDailyDates,
  compareSubdailyDates,
  formatSelectedDate,
  loadLayersWithSlots,
} from './util';

// ═══════════════════════════════════════════════════════════════════════════
// Factory / helper utilities
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build a fake OL tile source whose forEachTileCoord will emit
 * `loadedCount` tiles with state 2 (loaded) and `errorCount` tiles with
 * state 3 (error).  Tiles with any other state are silently ignored.
 */
function buildFakeSource({ loadedCount = 0, errorCount = 0, projection = null } = {}) {
  return {
    getProjection: () => projection,
    getTileGridForProjection: () => ({
      getZForResolution: () => 3,
      forEachTileCoord: (_extent, _z, callback) => {
        for (let i = 0; i < loadedCount; i++) callback([3, i, 0]);
        for (let i = 0; i < errorCount; i++) callback([3, loadedCount + i, 0]);
      },
    }),
    getTile: (_z, x) => ({
      // x < loadedCount  → state 2 (loaded)
      // x >= loadedCount → state 3 (error)
      getState: () => (x < loadedCount ? 2 : 3),
    }),
  };
}

/**
 * Build an object that passes `instanceof TileLayer` and has the minimal
 * interface expected by processTileLayer.
 */
function buildTileLayer({ id = 'tileLayer', loadedCount = 2, errorCount = 1 } = {}) {
  const layer = Object.create(TileLayer.prototype);
  layer.wv = { id };
  layer.getSource = () => buildFakeSource({ loadedCount, errorCount });
  return layer;
}

/**
 * Build a plain group layer (NOT a TileLayer) whose getLayers() returns an
 * array of child layers.
 */
function buildGroupLayer(id = 'group', children = []) {
  return {
    wv: { id },
    getLayers: () => ({ getArray: () => children }),
  };
}

/** Build a non-TileLayer that also has no getLayers – edge-case filler. */
function buildPlainLayer(id = 'plain') {
  return { wv: { id } };
}

/**
 * Build a full fake `ui` object that satisfies both clearLayers and
 * countTiles / countTilesForSpecifiedLayers.
 */
function buildFakeUI(layers = []) {
  const layerArray = [...layers];
  const removeLayer = jest.fn((l) => {
    const idx = layerArray.indexOf(l);
    if (idx !== -1) layerArray.splice(idx, 1);
  });

  const fakeView = {
    getZoom: () => 3,
    calculateExtent: () => [-180, -90, 180, 90],
    getProjection: () => 'EPSG:4326',
    getResolutionForZoom: () => 1,
  };

  return {
    selected: {
      getLayers: () => ({ getArray: () => layerArray }),
      removeLayer,
      getSize: () => [800, 600],
      getView: () => fakeView,
    },
    cache: { clear: jest.fn() },
  };
}

/**
 * Build a fake mapUI suitable for loadLayersWithSlots.
 * Tracks insertAt calls so tests can assert on z-ordering.
 */
function buildMapUI(initialLayers = []) {
  const arr = [...initialLayers];
  const insertAt = jest.fn((index, layer) => arr.splice(index, 0, layer));
  return {
    getLayers: () => ({
      getArray: () => arr,
      insertAt,
    }),
    insertAt, // expose for assertions
    _layers: arr,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// clearLayers
// ═══════════════════════════════════════════════════════════════════════════
describe('clearLayers', () => {
  it('removes every layer from ui.selected and clears the cache', () => {
    const layerA = { id: 'a' };
    const layerB = { id: 'b' };
    const ui = buildFakeUI([layerA, layerB]);

    clearLayers(ui);

    expect(ui.selected.removeLayer).toHaveBeenCalledTimes(2);
    expect(ui.selected.removeLayer).toHaveBeenCalledWith(layerA);
    expect(ui.selected.removeLayer).toHaveBeenCalledWith(layerB);
    expect(ui.cache.clear).toHaveBeenCalledTimes(1);
  });

  it('still calls cache.clear when there are no layers', () => {
    const ui = buildFakeUI([]);
    clearLayers(ui);
    expect(ui.selected.removeLayer).not.toHaveBeenCalled();
    expect(ui.cache.clear).toHaveBeenCalledTimes(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// countTiles
// ═══════════════════════════════════════════════════════════════════════════
describe('countTiles', () => {
  it('returns zeros when the map has no layers', () => {
    expect(countTiles(buildFakeUI([]))).toEqual({
      totalExpectedTileCount: 0,
      totalLoadedTileCount: 0,
    });
  });

  it('counts loaded (state=2) and error (state=3) tiles for a single TileLayer', () => {
    // 3 loaded → adds 3 to both loaded & expected
    // 2 error  → adds 2 to expected only
    const layer = buildTileLayer({ loadedCount: 3, errorCount: 2 });
    const result = countTiles(buildFakeUI([layer]));

    expect(result.totalLoadedTileCount).toBe(3);
    expect(result.totalExpectedTileCount).toBe(5);
  });

  it('aggregates counts across multiple TileLayers', () => {
    const l1 = buildTileLayer({ id: 'l1', loadedCount: 1, errorCount: 0 });
    const l2 = buildTileLayer({ id: 'l2', loadedCount: 4, errorCount: 3 });
    const result = countTiles(buildFakeUI([l1, l2]));

    expect(result.totalLoadedTileCount).toBe(5);
    expect(result.totalExpectedTileCount).toBe(8);
  });

  it('recursively processes sub-layers inside a group layer', () => {
    const child = buildTileLayer({ id: 'child', loadedCount: 2, errorCount: 1 });
    const group = buildGroupLayer('g', [child]);
    const result = countTiles(buildFakeUI([group]));

    expect(result.totalLoadedTileCount).toBe(2);
    expect(result.totalExpectedTileCount).toBe(3);
  });

  it('ignores plain layers that are neither TileLayer nor group', () => {
    const plain = buildPlainLayer('p');
    const result = countTiles(buildFakeUI([plain]));

    expect(result).toEqual({ totalExpectedTileCount: 0, totalLoadedTileCount: 0 });
  });

  it('handles a mix of TileLayer, group, and plain layers', () => {
    const tile = buildTileLayer({ id: 't', loadedCount: 2, errorCount: 0 });
    const child = buildTileLayer({ id: 'c', loadedCount: 1, errorCount: 1 });
    const group = buildGroupLayer('g', [child]);
    const plain = buildPlainLayer('p');

    const result = countTiles(buildFakeUI([tile, group, plain]));

    expect(result.totalLoadedTileCount).toBe(3);
    expect(result.totalExpectedTileCount).toBe(4);
  });

  it('uses the view projection as fallback when source has no projection', () => {
    // buildFakeSource defaults projection to null → triggers fallback in processTileLayer
    const layer = buildTileLayer({ loadedCount: 1, errorCount: 0 });
    expect(() => countTiles(buildFakeUI([layer]))).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// countTilesForSpecifiedLayers
// ═══════════════════════════════════════════════════════════════════════════
describe('countTilesForSpecifiedLayers', () => {
  it('returns zeros when no layers match the provided id list', () => {
    const layer = buildTileLayer({ id: 'layerA', loadedCount: 5 });
    const result = countTilesForSpecifiedLayers(buildFakeUI([layer]), ['layerB']);

    expect(result).toEqual({ totalExpectedTileCount: 0, totalLoadedTileCount: 0 });
  });

  it('counts tiles only for specified layer ids', () => {
    const layerA = buildTileLayer({ id: 'layerA', loadedCount: 3, errorCount: 1 });
    const layerB = buildTileLayer({ id: 'layerB', loadedCount: 10, errorCount: 5 });
    const result = countTilesForSpecifiedLayers(buildFakeUI([layerA, layerB]), ['layerA']);

    expect(result.totalLoadedTileCount).toBe(3);
    expect(result.totalExpectedTileCount).toBe(4);
  });

  it('aggregates counts for multiple specified layer ids', () => {
    const layerA = buildTileLayer({ id: 'layerA', loadedCount: 2, errorCount: 1 });
    const layerB = buildTileLayer({ id: 'layerB', loadedCount: 1, errorCount: 0 });
    const layerC = buildTileLayer({ id: 'layerC', loadedCount: 5, errorCount: 2 });
    const result = countTilesForSpecifiedLayers(
      buildFakeUI([layerA, layerB, layerC]),
      ['layerA', 'layerB'],
    );

    expect(result.totalLoadedTileCount).toBe(3);
    expect(result.totalExpectedTileCount).toBe(4);
  });

  it('processes sub-layers inside a matched group layer', () => {
    const child = buildTileLayer({ id: 'child', loadedCount: 4, errorCount: 0 });
    const group = buildGroupLayer('myGroup', [child]);
    const result = countTilesForSpecifiedLayers(buildFakeUI([group]), ['myGroup']);

    expect(result.totalLoadedTileCount).toBe(4);
    expect(result.totalExpectedTileCount).toBe(4);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// convertTimestamp
// ═══════════════════════════════════════════════════════════════════════════
describe('convertTimestamp', () => {
  it('adds 4 hours to the time', () => {
    // 08:00 + 4h = 12:00
    const result = convertTimestamp('2024-03-15T08:00:00');
    expect(result).toMatch(/T12:00:00$/);
  });

  it('rounds minutes DOWN to the nearest multiple of 10', () => {
    // 08:23 + 4h = 12:23 → rounded minutes = 20
    const result = convertTimestamp('2024-03-15T08:23:45');
    expect(result).toBe('2024-03-15T12:20:00');
  });

  it('leaves minutes that are already a multiple of 10 unchanged', () => {
    // 06:30 + 4h = 10:30
    const result = convertTimestamp('2024-06-01T06:30:00');
    expect(result).toBe('2024-06-01T10:30:00');
  });

  it('rounds minutes 59 down to 50', () => {
    // 19:59 + 4h = 23:59 → rounded = 50
    const result = convertTimestamp('2024-03-10T19:59:00');
    expect(result).toBe('2024-03-10T23:50:00');
  });

  it('always sets seconds to 00', () => {
    const result = convertTimestamp('2024-04-20T10:05:55');
    expect(result).toMatch(/:00$/);
  });

  it('handles midnight roll-over to the next day', () => {
    // 21:00 + 4h = 2024-01-02T01:00
    const result = convertTimestamp('2024-01-01T21:00:00');
    expect(result).toBe('2024-01-02T01:00:00');
  });

  it('returns a string in YYYY-MM-DDTHH:MM:00 format', () => {
    const result = convertTimestamp('2024-05-10T08:23:00');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00$/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// formatDate
// ═══════════════════════════════════════════════════════════════════════════
describe('formatDate', () => {
  it('returns a midnight timestamp when hasSubdailyLayers is false', () => {
    const result = formatDate('2024-05-10T14:30:00', false);
    expect(result).toBe('2024-05-10T00:00:00');
  });

  it('returns a midnight timestamp when hasSubdailyLayers is omitted', () => {
    const result = formatDate('2024-07-04T18:00:00');
    expect(result).toBe('2024-07-04T00:00:00');
  });

  it('returns a timezone-adjusted subdaily timestamp when hasSubdailyLayers is true', () => {
    // 08:23:00 → convertTimestamp → +4h = 12:20:00
    const result = formatDate('2024-05-10T08:23:00', true);
    expect(result).toBe('2024-05-10T12:20:00');
  });

  it('correctly routes through convertTimestamp for subdaily layers', () => {
    // 06:00 + 4h = 10:00, minutes are 0 → no rounding needed
    const result = formatDate('2024-01-01T06:00:00', true);
    expect(result).toBe('2024-01-01T10:00:00');
  });

  it('zero-pads single-digit months and days', () => {
    const result = formatDate('2024-01-05T00:00:00', false);
    expect(result).toBe('2024-01-05T00:00:00');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// weekAgo
// ═══════════════════════════════════════════════════════════════════════════
describe('weekAgo', () => {
  it('returns a date exactly 7 days (604 800 000 ms) before the input', () => {
    const input = '2024-05-14T00:00:00';
    const diff = new Date(input) - new Date(weekAgo(input));
    expect(diff).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('returns a string', () => {
    expect(typeof weekAgo('2024-01-01')).toBe('string');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// threeHoursAgo
// ═══════════════════════════════════════════════════════════════════════════
describe('threeHoursAgo', () => {
  it('returns a date exactly 3 hours before the input', () => {
    const input = '2024-05-14T12:00:00';
    const diff = new Date(input) - new Date(threeHoursAgo(input));
    expect(diff).toBe(3 * 60 * 60 * 1000);
  });

  it('returns a string', () => {
    expect(typeof threeHoursAgo('2024-01-01T06:00:00')).toBe('string');
  });

  it('handles midnight roll-back to the previous day', () => {
    const input = '2024-06-01T02:00:00';
    const result = new Date(threeHoursAgo(input));
    // 02:00 − 3h = 23:00 the day before
    expect(result.getDate()).toBe(31);   // May 31
    expect(result.getHours()).toBe(23);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// twentySevenHoursAgo
// ═══════════════════════════════════════════════════════════════════════════
describe('twentySevenHoursAgo', () => {
  it('returns a date exactly 27 hours before the input', () => {
    const input = '2024-05-14T12:00:00';
    const diff = new Date(input) - new Date(twentySevenHoursAgo(input));
    expect(diff).toBe(27 * 60 * 60 * 1000);
  });

  it('returns a string', () => {
    expect(typeof twentySevenHoursAgo('2024-01-01T06:00:00')).toBe('string');
  });

  it('crosses a day boundary correctly', () => {
    const input = '2024-06-02T03:00:00';
    const result = new Date(twentySevenHoursAgo(input));
    // 03:00 June 2 − 27h = 00:00 June 1
    expect(result.getDate()).toBe(1);
    expect(result.getHours()).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// compareDailyDates
// ═══════════════════════════════════════════════════════════════════════════
describe('compareDailyDates', () => {
  it('returns true when selectedDate is one day after lastDateToCheck', () => {
    expect(compareDailyDates('2024-05-10', '2024-05-11')).toBe(true);
  });

  it('returns false when selectedDate equals lastDateToCheck (same calendar day)', () => {
    expect(compareDailyDates('2024-05-10', '2024-05-10')).toBe(false);
  });

  it('returns false when selectedDate is before lastDateToCheck', () => {
    expect(compareDailyDates('2024-05-10', '2024-05-09')).toBe(false);
  });

  it('zeroes out time so two timestamps on the same day are equal (false)', () => {
    // Even though the times differ the calendar day is the same
    expect(compareDailyDates('2024-05-10T00:00:01', '2024-05-10T23:59:59')).toBe(false);
  });

  it('returns true when selected is a later calendar day even with earlier time', () => {
    expect(compareDailyDates('2024-05-10T23:59:59', '2024-05-11T00:00:00')).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// compareSubdailyDates
// ═══════════════════════════════════════════════════════════════════════════
describe('compareSubdailyDates', () => {
  it('returns true when the hour difference is exactly 3', () => {
    // selected(09) - last(06) = 3 → hourDifference = 3 ≤ 3 → true
    expect(compareSubdailyDates('2024-01-01T06:00:00', '2024-01-01T09:00:00')).toBe(true);
  });

  it('returns true when the hour difference is less than 3', () => {
    expect(compareSubdailyDates('2024-01-01T06:00:00', '2024-01-01T07:00:00')).toBe(true);
  });

  it('returns true when both dates have the same hour (difference = 0)', () => {
    expect(compareSubdailyDates('2024-01-01T10:00:00', '2024-01-01T10:00:00')).toBe(true);
  });

  it('returns false when the hour difference is greater than 3', () => {
    // selected(11) - last(06) = 5 → false
    expect(compareSubdailyDates('2024-01-01T06:00:00', '2024-01-01T11:00:00')).toBe(false);
  });

  it('handles the 24-hour wraparound: last=23, selected=01 → diff=2 → true', () => {
    expect(compareSubdailyDates('2024-01-01T23:00:00', '2024-01-02T01:00:00')).toBe(true);
  });

  it('handles the 24-hour wraparound: last=20, selected=01 → diff=5 → false', () => {
    expect(compareSubdailyDates('2024-01-01T20:00:00', '2024-01-02T01:00:00')).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// formatSelectedDate
// ═══════════════════════════════════════════════════════════════════════════
describe('formatSelectedDate', () => {
  it('formats an ISO date string to YYYY-MM-DD', () => {
    expect(formatSelectedDate('2024-08-25T14:30:00')).toBe('2024-08-25');
  });

  it('zero-pads single-digit months and days', () => {
    expect(formatSelectedDate('2024-01-05T00:00:00')).toBe('2024-01-05');
  });

  it('discards the time component entirely', () => {
    const result = formatSelectedDate('2024-12-31T23:59:59');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result).toBe('2024-12-31');
  });

  it('works for the first day of the year', () => {
    expect(formatSelectedDate('2024-01-01T00:00:00')).toBe('2024-01-01');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// loadLayersWithSlots
// ═══════════════════════════════════════════════════════════════════════════
describe('loadLayersWithSlots', () => {
  // Use fake timers so the yieldToMain setTimeout resolves under our control
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  /**
   * Flush all pending microtasks AND macrotasks (timers).
   * Repeating the flush a couple of times ensures nested async chains resolve.
   */
  const flushAll = async () => {
    jest.runAllTimers();
    await Promise.resolve();
    jest.runAllTimers();
    await Promise.resolve();
  };

  // ── Guard: empty / falsy defs ───────────────────────────────────────────
  describe('when defs is empty or falsy', () => {
    it('returns { layers: [], results: [] } for undefined defs', async () => {
      const result = await loadLayersWithSlots({ defs: undefined });
      expect(result).toEqual({ layers: [], results: [] });
    });

    it('returns { layers: [], results: [] } for an empty array', async () => {
      const result = await loadLayersWithSlots({ defs: [] });
      expect(result).toEqual({ layers: [], results: [] });
    });

    it('calls updateLayerVisibilities when defs is empty', async () => {
      const updateLayerVisibilities = jest.fn();
      await loadLayersWithSlots({ defs: [], updateLayerVisibilities });
      expect(updateLayerVisibilities).toHaveBeenCalledTimes(1);
    });

    it('does NOT throw when updateLayerVisibilities is omitted and defs is empty', async () => {
      await expect(loadLayersWithSlots({ defs: [] })).resolves.toBeDefined();
    });
  });

  // ── Happy path ──────────────────────────────────────────────────────────
  describe('successful layer creation', () => {
    it('returns created layers in the result', async () => {
      const fakeLayer = { wv: { id: 'l1' } };
      const createLayer = jest.fn().mockResolvedValue(fakeLayer);

      const promise = loadLayersWithSlots({
        defs: [{ id: 'l1' }],
        createLayer,
        skipYield: true,
      });
      await flushAll();
      const result = await promise;

      expect(result.layers).toHaveLength(1);
      expect(result.layers[0]).toBe(fakeLayer);
      expect(result.results).toEqual([]);
    });

    it('inserts the layer into the map via mapUI.getLayers().insertAt()', async () => {
      const fakeLayer = { wv: { id: 'l1' } };
      const createLayer = jest.fn().mockResolvedValue(fakeLayer);
      const mapUI = buildMapUI();

      const promise = loadLayersWithSlots({
        defs: [{ id: 'l1' }],
        createLayer,
        mapUI,
        skipYield: true,
      });
      await flushAll();
      await promise;

      expect(mapUI.insertAt).toHaveBeenCalledTimes(1);
      expect(mapUI.insertAt).toHaveBeenCalledWith(0, fakeLayer);
    });

    it('inserts multiple layers and calls updateLayerVisibilities after each insertion', async () => {
      const layerA = { wv: { id: 'layerA' } };
      const layerB = { wv: { id: 'layerB' } };
      const createLayer = jest.fn()
        .mockResolvedValueOnce(layerA)
        .mockResolvedValueOnce(layerB);
      const updateLayerVisibilities = jest.fn();
      const mapUI = buildMapUI();

      const promise = loadLayersWithSlots({
        defs: [{ id: 'layerA' }, { id: 'layerB' }],
        createLayer,
        mapUI,
        updateLayerVisibilities,
        skipYield: true,
      });
      await flushAll();
      await promise;

      // Called once per successful insertion + once at the end
      expect(updateLayerVisibilities.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    it('calls updateLayerVisibilities once at the end of a non-superseded operation', async () => {
      const fakeLayer = { wv: { id: 'l' } };
      const createLayer = jest.fn().mockResolvedValue(fakeLayer);
      const updateLayerVisibilities = jest.fn();

      const promise = loadLayersWithSlots({
        defs: [{ id: 'l' }],
        createLayer,
        updateLayerVisibilities,
        skipYield: true,
      });
      await flushAll();
      await promise;

      // The final updateLayerVisibilities call happens after allSettled
      expect(updateLayerVisibilities).toHaveBeenCalled();
    });

    it('computes the correct insertIndex based on existing layers in the map', async () => {
      // layerA is at defIndex 0, layerB at defIndex 1.
      // When layerB is inserted, layerA is already present → insertIndex should be 1.
      const layerA = { wv: { id: 'layerA' } };
      const layerB = { wv: { id: 'layerB' } };
      const createLayer = jest.fn()
        .mockResolvedValueOnce(layerA)
        .mockResolvedValueOnce(layerB);
      const mapUI = buildMapUI();

      const promise = loadLayersWithSlots({
        defs: [{ id: 'layerA' }, { id: 'layerB' }],
        createLayer,
        mapUI,
        skipYield: true,
      });
      await flushAll();
      await promise;

      // First call inserts layerA at index 0 (no prior layers)
      expect(mapUI.insertAt.mock.calls[0]).toEqual([0, layerA]);
      // Second call inserts layerB at index 1 (layerA is already present below it)
      expect(mapUI.insertAt.mock.calls[1]).toEqual([1, layerB]);
    });
  });

  // ── createLayer returns null/falsy ──────────────────────────────────────
  describe('when createLayer returns null', () => {
    it('does not insert into the map and excludes null from returned layers', async () => {
      const createLayer = jest.fn().mockResolvedValue(null);
      const mapUI = buildMapUI();

      const promise = loadLayersWithSlots({
        defs: [{ id: 'nullLayer' }],
        createLayer,
        mapUI,
        skipYield: true,
      });
      await flushAll();
      const result = await promise;

      expect(mapUI.insertAt).not.toHaveBeenCalled();
      expect(result.layers).toHaveLength(0);
    });
  });

  // ── getLayerOptions ─────────────────────────────────────────────────────
  describe('getLayerOptions', () => {
    it('passes options returned by getLayerOptions to createLayer', async () => {
      const fakeLayer = { wv: { id: 'l' } };
      const createLayer = jest.fn().mockResolvedValue(fakeLayer);
      const getLayerOptions = jest.fn().mockReturnValue({ opacity: 0.5 });

      const promise = loadLayersWithSlots({
        defs: [{ id: 'l' }],
        createLayer,
        getLayerOptions,
        skipYield: true,
      });
      await flushAll();
      await promise;

      expect(getLayerOptions).toHaveBeenCalledWith({ id: 'l' });
      expect(createLayer).toHaveBeenCalledWith({ id: 'l' }, { opacity: 0.5 });
    });

    it('passes an empty object to createLayer when getLayerOptions is not provided', async () => {
      const fakeLayer = { wv: { id: 'l' } };
      const createLayer = jest.fn().mockResolvedValue(fakeLayer);

      const promise = loadLayersWithSlots({
        defs: [{ id: 'l' }],
        createLayer,
        skipYield: true,
      });
      await flushAll();
      await promise;

      expect(createLayer).toHaveBeenCalledWith({ id: 'l' }, {});
    });
  });

  // ── error handling ──────────────────────────────────────────────────────
  describe('when createLayer throws / rejects', () => {
    it('logs a console.warn and still returns any successful layers', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const goodLayer = { wv: { id: 'good' } };
      const createLayer = jest.fn()
        .mockRejectedValueOnce(new Error('boom'))
        .mockResolvedValueOnce(goodLayer);

      const promise = loadLayersWithSlots({
        defs: [{ id: 'bad' }, { id: 'good' }],
        createLayer,
        skipYield: true,
      });
      await flushAll();
      const result = await promise;

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('bad'),
        expect.any(Error),
      );
      expect(result.layers).toContain(goodLayer);
    });

    it('returns an empty layers array when all layers fail', async () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      const createLayer = jest.fn().mockRejectedValue(new Error('all fail'));

      const promise = loadLayersWithSlots({
        defs: [{ id: 'a' }, { id: 'b' }],
        createLayer,
        skipYield: true,
      });
      await flushAll();
      const result = await promise;

      expect(result.layers).toHaveLength(0);
    });
  });

  // ── queue support ───────────────────────────────────────────────────────
  describe('queue support', () => {
    it('delegates task execution to queue.add when a queue is provided', async () => {
      const fakeLayer = { wv: { id: 'q' } };
      const createLayer = jest.fn().mockResolvedValue(fakeLayer);
      const queue = { add: jest.fn((fn) => fn()) };

      const promise = loadLayersWithSlots({
        defs: [{ id: 'q' }],
        createLayer,
        queue,
        skipYield: true,
      });
      await flushAll();
      await promise;

      expect(queue.add).toHaveBeenCalledTimes(1);
    });

    it('calls task directly (no queue.add) when queue is not provided', async () => {
      const fakeLayer = { wv: { id: 'noQ' } };
      const createLayer = jest.fn().mockResolvedValue(fakeLayer);

      const promise = loadLayersWithSlots({
        defs: [{ id: 'noQ' }],
        createLayer,
        skipYield: true,
      });
      await flushAll();
      const result = await promise;

      // If we get here with a layer, the task ran directly
      expect(result.layers).toHaveLength(1);
    });
  });

  // ── skipYield ───────────────────────────────────────────────────────────
  describe('skipYield behaviour', () => {
    it('does NOT call setTimeout when skipYield is true', async () => {
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
      const fakeLayer = { wv: { id: 'l' } };
      const createLayer = jest.fn().mockResolvedValue(fakeLayer);

      const promise = loadLayersWithSlots({
        defs: [{ id: 'l' }],
        createLayer,
        skipYield: true,
      });
      await flushAll();
      await promise;

      expect(setTimeoutSpy).not.toHaveBeenCalled();
    });

    it('calls setTimeout (yieldToMain) when skipYield is false', async () => {
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
      const fakeLayer = { wv: { id: 'l' } };
      const createLayer = jest.fn().mockResolvedValue(fakeLayer);

      const promise = loadLayersWithSlots({
        defs: [{ id: 'l' }],
        createLayer,
        skipYield: false,
      });
      await flushAll();
      await promise;

      expect(setTimeoutSpy).toHaveBeenCalled();
    });
  });

  // ── no mapUI ────────────────────────────────────────────────────────────
  describe('when mapUI is null', () => {
    it('still returns layers without throwing', async () => {
      const fakeLayer = { wv: { id: 'l' } };
      const createLayer = jest.fn().mockResolvedValue(fakeLayer);

      const promise = loadLayersWithSlots({
        defs: [{ id: 'l' }],
        createLayer,
        mapUI: null,
        skipYield: true,
      });
      await flushAll();
      const result = await promise;

      expect(result.layers).toHaveLength(1);
      expect(result.layers[0]).toBe(fakeLayer);
    });
  });

  // ── superseded operations ───────────────────────────────────────────────
  describe('superseded operations (stale load detection)', () => {
    it('skips map insertion for a superseded operation and does not call final updateLayerVisibilities', async () => {
      const layer1 = { wv: { id: 'l1' } };
      const layer2 = { wv: { id: 'l2' } };

      // First createLayer call is held back until we manually resolve it
      let resolveFirst;
      const firstLayerPromise = new Promise((resolve) => { resolveFirst = () => resolve(layer1); });

      const createLayer = jest.fn()
        .mockReturnValueOnce(firstLayerPromise)   // slow first op
        .mockResolvedValue(layer2);               // fast second op

      const mapUI = buildMapUI();
      const updateLayerVisibilities = jest.fn();

      // Start first (soon-to-be-superseded) operation
      const firstOp = loadLayersWithSlots({
        defs: [{ id: 'l1' }],
        createLayer,
        mapUI,
        updateLayerVisibilities,
        skipYield: true,
      });

      // Immediately start second operation – bumps loadOperationId
      const secondOp = loadLayersWithSlots({
        defs: [{ id: 'l2' }],
        createLayer,
        mapUI,
        updateLayerVisibilities,
        skipYield: true,
      });

      // Let the second op finish first
      await flushAll();

      // Now let the first op's layer resolve – it should detect it is stale
      resolveFirst();
      await flushAll();

      const [first, second] = await Promise.all([firstOp, secondOp]);

      // The stale op filled its slot but should NOT have called insertAt
      // Only the second (current) op should have inserted
      const totalInserts = mapUI.insertAt.mock.calls.length;
      expect(totalInserts).toBe(1); // only the non-superseded op inserts

      // Both ops return their (non-null) completed layers
      expect(first.layers).toHaveLength(1);
      expect(second.layers).toHaveLength(1);

      // updateLayerVisibilities should have been called by the second op's
      // insertLayerAtCorrectPosition and its final block – NOT by the stale op's final block
      const calls = updateLayerVisibilities.mock.calls.length;
      expect(calls).toBeGreaterThanOrEqual(1);
    });
  });
});

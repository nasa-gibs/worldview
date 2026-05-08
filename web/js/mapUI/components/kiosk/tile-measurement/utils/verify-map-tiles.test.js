import countTilesForSpecifiedLayers from './verify-map-tiles';
import TileLayer from 'ol/layer/Tile';

jest.mock('ol/layer/Tile');
jest.mock('ol/proj', () => ({
  transformExtent: jest.fn((extent) => extent),
}));

import { transformExtent } from 'ol/proj';

// ─── Canvas mock setup ────────────────────────────────────────────────────────

function buildMockContext(pixelData) {
  return {
    drawImage: jest.fn(),
    getImageData: jest.fn(() => ({ data: pixelData })),
  };
}

function buildMockCanvas(ctx) {
  return {
    getContext: jest.fn(() => ctx),
    width: 0,
    height: 0,
  };
}

// ─── Tile / TileGrid / Source / Layer factories ───────────────────────────────

function buildMockTile(state, imageOverride) {
  const defaultImage = { complete: true, naturalWidth: 1, width: 2, height: 2 };
  return {
    getState: jest.fn(() => state),
    image_: imageOverride ?? defaultImage,
  };
}

function buildMockTileGrid(tiles = []) {
  return {
    getZForResolution: jest.fn(() => 5),
    forEachTileCoord: jest.fn((extent, z, cb) => {
      tiles.forEach((tile, i) => cb([z, i, 0]));
    }),
  };
}

function buildMockSource(tiles = [], projectionOverride = null) {
  const tileGrid = buildMockTileGrid(tiles);
  const tileMap = {};
  tiles.forEach((tile, i) => { tileMap[i] = tile; });

  return {
    getProjection: jest.fn(() => projectionOverride),
    getTileGridForProjection: jest.fn(() => tileGrid),
    getTile: jest.fn((z, x) => tileMap[x] ?? tiles[x]),
  };
}

function buildMockTileLayer(source, id = 'test-layer-id') {
  const layer = new TileLayer();
  layer.getSource = jest.fn(() => source);
  layer.wv = { id };
  return layer;
}

function buildMockView(projectionCode = 'EPSG:4326') {
  const projection = { getCode: jest.fn(() => projectionCode) };
  return {
    calculateExtent: jest.fn(() => [-180, -90, 180, 90]),
    getZoom: jest.fn(() => 5),
    getProjection: jest.fn(() => projection),
    getResolutionForZoom: jest.fn(() => 0.5),
  };
}

function buildMockMap(layers = [], viewOverride) {
  const view = viewOverride ?? buildMockView();
  return {
    getView: jest.fn(() => view),
    getSize: jest.fn(() => [800, 600]),
    getLayers: jest.fn(() => ({
      getArray: jest.fn(() => layers),
    })),
  };
}

function buildUi(map) {
  return { selected: map };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('countTilesForSpecifiedLayers', () => {
  let mockCtx;
  let mockCanvas;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Default: multi-color (valid) image — 2×2 with 4 different colored pixels
    mockCtx = buildMockContext(new Uint8ClampedArray([
      255, 0, 0, 255,
      0, 255, 0, 255,
      0, 0, 255, 255,
      255, 255, 0, 255,
    ]));
    mockCanvas = buildMockCanvas(mockCtx);
    jest.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'canvas') return mockCanvas;
      return {};
    });

    // Make TileLayer instances recognizable via instanceof
    TileLayer.mockImplementation(function MockTileLayer() {});
  });

  afterEach(() => {
    console.log.mockRestore();
    console.error.mockRestore();
    document.createElement.mockRestore();
  });

  // ── Return shape ───────────────────────────────────────────────────────────

  describe('return shape', () => {
    it('returns an object with all six expected keys', async () => {
      const map = buildMockMap([]);
      const result = countTilesForSpecifiedLayers(buildUi(map), []);
      await Promise.resolve();
      expect(result).toHaveProperty('totalExpectedTileCount');
      expect(result).toHaveProperty('totalLoadedTileCount');
      expect(result).toHaveProperty('totalTilesLoadedWithBadImage');
      expect(result).toHaveProperty('totalErrorTiles');
      expect(result).toHaveProperty('totalEmptyTiles');
      expect(result).toHaveProperty('totalOtherTileStates');
    });

    it('returns all zeros when there are no matching layers', async () => {
      const map = buildMockMap([]);
      const result = countTilesForSpecifiedLayers(buildUi(map), ['some-layer']);
      await Promise.resolve();
      expect(result.totalExpectedTileCount).toBe(0);
      expect(result.totalLoadedTileCount).toBe(0);
      expect(result.totalTilesLoadedWithBadImage).toBe(0);
      expect(result.totalErrorTiles).toBe(0);
      expect(result.totalEmptyTiles).toBe(0);
      expect(result.totalOtherTileStates).toEqual([]);
    });
  });

  // ── Layer filtering ────────────────────────────────────────────────────────

  describe('layer filtering', () => {
    it('only processes layers whose wv.id is in layersToCheck', async () => {
      const tileA = buildMockTile(4);
      const tileB = buildMockTile(4);
      const sourceA = buildMockSource([tileA]);
      const sourceB = buildMockSource([tileB]);
      const layerA = buildMockTileLayer(sourceA, 'layer-a');
      const layerB = buildMockTileLayer(sourceB, 'layer-b');
      const map = buildMockMap([layerA, layerB]);

      const result = countTilesForSpecifiedLayers(buildUi(map), ['layer-a']);
      await Promise.resolve();
      expect(result.totalExpectedTileCount).toBe(1);
    });

    it('processes multiple matching layers', async () => {
      const tileA = buildMockTile(4);
      const tileB = buildMockTile(4);
      const sourceA = buildMockSource([tileA]);
      const sourceB = buildMockSource([tileB]);
      const layerA = buildMockTileLayer(sourceA, 'layer-a');
      const layerB = buildMockTileLayer(sourceB, 'layer-b');
      const map = buildMockMap([layerA, layerB]);

      const result = countTilesForSpecifiedLayers(buildUi(map), ['layer-a', 'layer-b']);
      await Promise.resolve();
      expect(result.totalExpectedTileCount).toBe(2);
    });

    it('excludes layers without a wv property', async () => {
      const tile = buildMockTile(4);
      const source = buildMockSource([tile]);
      const layer = buildMockTileLayer(source, 'layer-a');
      delete layer.wv;
      const map = buildMockMap([layer]);

      const result = countTilesForSpecifiedLayers(buildUi(map), ['layer-a']);
      await Promise.resolve();
      expect(result.totalExpectedTileCount).toBe(0);
    });

    it('excludes layers with wv but no id', async () => {
      const tile = buildMockTile(4);
      const source = buildMockSource([tile]);
      const layer = buildMockTileLayer(source, 'layer-a');
      layer.wv = {};
      const map = buildMockMap([layer]);

      const result = countTilesForSpecifiedLayers(buildUi(map), ['layer-a']);
      await Promise.resolve();
      expect(result.totalExpectedTileCount).toBe(0);
    });

    it('returns all zeros when layersToCheck is empty', async () => {
      const tile = buildMockTile(4);
      const source = buildMockSource([tile]);
      const layer = buildMockTileLayer(source, 'layer-a');
      const map = buildMockMap([layer]);

      const result = countTilesForSpecifiedLayers(buildUi(map), []);
      await Promise.resolve();
      expect(result.totalExpectedTileCount).toBe(0);
    });
  });

  // ── LayerGroup (getLayers) ─────────────────────────────────────────────────

  describe('LayerGroup processing', () => {
    it('recurses into LayerGroup sub-layers', async () => {
      const tile = buildMockTile(4);
      const source = buildMockSource([tile]);
      const subLayer = buildMockTileLayer(source, 'layer-a');

      const layerGroup = {
        wv: { id: 'layer-a' },
        getLayers: jest.fn(() => ({ getArray: jest.fn(() => [subLayer]) })),
      };
      const map = buildMockMap([layerGroup]);

      const result = countTilesForSpecifiedLayers(buildUi(map), ['layer-a']);
      await Promise.resolve();
      expect(result.totalExpectedTileCount).toBe(1);
    });

    it('recurses into nested LayerGroups', async () => {
      const tile = buildMockTile(4);
      const source = buildMockSource([tile]);
      const subLayer = buildMockTileLayer(source, 'layer-a');

      const innerGroup = {
        wv: { id: 'inner' },
        getLayers: jest.fn(() => ({ getArray: jest.fn(() => [subLayer]) })),
      };
      const outerGroup = {
        wv: { id: 'layer-a' },
        getLayers: jest.fn(() => ({ getArray: jest.fn(() => [innerGroup]) })),
      };
      const map = buildMockMap([outerGroup]);

      const result = countTilesForSpecifiedLayers(buildUi(map), ['layer-a']);
      await Promise.resolve();
      expect(result.totalExpectedTileCount).toBe(1);
    });

    it('calls console.error for layers that are neither TileLayer nor LayerGroup', async () => {
      const unknownLayer = { wv: { id: 'layer-a' } };
      const map = buildMockMap([unknownLayer]);

      countTilesForSpecifiedLayers(buildUi(map), ['layer-a']);
      await Promise.resolve();
      expect(console.error).toHaveBeenCalledWith(
        'Layer is not an instance of a TileLayer or LayerGroup',
      );
    });
  });

  // ── Tile state counting ────────────────────────────────────────────────────

  describe('tile state counting', () => {
    it('increments totalExpectedTileCount for every tile', async () => {
      const tiles = [buildMockTile(0), buildMockTile(0), buildMockTile(0)];
      const source = buildMockSource(tiles);
      const layer = buildMockTileLayer(source, 'layer-a');
      const map = buildMockMap([layer]);

      const result = countTilesForSpecifiedLayers(buildUi(map), ['layer-a']);
      await Promise.resolve();
      expect(result.totalExpectedTileCount).toBe(3);
    });

    it('counts state 3 tiles as errorTiles', async () => {
      const tiles = [buildMockTile(3), buildMockTile(3)];
      const source = buildMockSource(tiles);
      const layer = buildMockTileLayer(source, 'layer-a');
      const map = buildMockMap([layer]);

      const result = countTilesForSpecifiedLayers(buildUi(map), ['layer-a']);
      await Promise.resolve();
      expect(result.totalErrorTiles).toBe(2);
    });

    it('counts state 4 tiles as emptyTiles', async () => {
      const tiles = [buildMockTile(4), buildMockTile(4), buildMockTile(4)];
      const source = buildMockSource(tiles);
      const layer = buildMockTileLayer(source, 'layer-a');
      const map = buildMockMap([layer]);

      const result = countTilesForSpecifiedLayers(buildUi(map), ['layer-a']);
      await Promise.resolve();
      expect(result.totalEmptyTiles).toBe(3);
    });

    it('pushes state 0 (IDLE) into totalOtherTileStates', async () => {
      const tiles = [buildMockTile(0)];
      const source = buildMockSource(tiles);
      const layer = buildMockTileLayer(source, 'layer-a');
      const map = buildMockMap([layer]);

      const result = countTilesForSpecifiedLayers(buildUi(map), ['layer-a']);
      await Promise.resolve();
      expect(result.totalOtherTileStates).toContain(0);
    });

    it('pushes state 1 (LOADING) into totalOtherTileStates', async () => {
      const tiles = [buildMockTile(1)];
      const source = buildMockSource(tiles);
      const layer = buildMockTileLayer(source, 'layer-a');
      const map = buildMockMap([layer]);

      const result = countTilesForSpecifiedLayers(buildUi(map), ['layer-a']);
      await Promise.resolve();
      expect(result.totalOtherTileStates).toContain(1);
    });

    it('pushes state 5 (ABORT) into totalOtherTileStates', async () => {
      const tiles = [buildMockTile(5)];
      const source = buildMockSource(tiles);
      const layer = buildMockTileLayer(source, 'layer-a');
      const map = buildMockMap([layer]);

      const result = countTilesForSpecifiedLayers(buildUi(map), ['layer-a']);
      await Promise.resolve();
      expect(result.totalOtherTileStates).toContain(5);
    });

    it('accumulates otherTileStates from multiple tiles', async () => {
      const tiles = [buildMockTile(0), buildMockTile(1), buildMockTile(5)];
      const source = buildMockSource(tiles);
      const layer = buildMockTileLayer(source, 'layer-a');
      const map = buildMockMap([layer]);

      const result = countTilesForSpecifiedLayers(buildUi(map), ['layer-a']);
      await Promise.resolve();
      expect(result.totalOtherTileStates).toEqual([0, 1, 5]);
    });
  });

  // ── Tile state 2 (LOADED) and checkTileImage ───────────────────────────────

  describe('tile state 2 (LOADED) and checkTileImage', () => {
    it('increments totalLoadedTileCount when state is 2 and image is invalid (multi-color)', async () => {
      // Multi-color pixel data — checkTileImage returns false (not single color, not transparent)
      mockCtx.getImageData.mockReturnValue({
        data: new Uint8ClampedArray([
          255, 0, 0, 255,
          0, 255, 0, 255,
        ]),
      });
      const tile = buildMockTile(2);
      const source = buildMockSource([tile]);
      const layer = buildMockTileLayer(source, 'layer-a');
      const map = buildMockMap([layer]);

      const result = countTilesForSpecifiedLayers(buildUi(map), ['layer-a']);
      await Promise.resolve();
      expect(result.totalLoadedTileCount).toBe(1);
      expect(result.totalTilesLoadedWithBadImage).toBe(0);
    });

    it('increments totalTilesLoadedWithBadImage when state is 2 and image is single-color', async () => {
      // Single-color pixel data — checkTileImage returns true
      mockCtx.getImageData.mockReturnValue({
        data: new Uint8ClampedArray([
          255, 0, 0, 255,
          255, 0, 0, 255,
        ]),
      });
      const tile = buildMockTile(2);
      const source = buildMockSource([tile]);
      const layer = buildMockTileLayer(source, 'layer-a');
      const map = buildMockMap([layer]);

      const result = countTilesForSpecifiedLayers(buildUi(map), ['layer-a']);
      await Promise.resolve();
      expect(result.totalTilesLoadedWithBadImage).toBe(1);
      expect(result.totalLoadedTileCount).toBe(0);
    });

    it('increments totalTilesLoadedWithBadImage when state is 2 and image is fully transparent', async () => {
      // All-transparent pixel data — checkTileImage returns true
      mockCtx.getImageData.mockReturnValue({
        data: new Uint8ClampedArray([
          0, 0, 0, 0,
          0, 0, 0, 0,
        ]),
      });
      const tile = buildMockTile(2);
      const source = buildMockSource([tile]);
      const layer = buildMockTileLayer(source, 'layer-a');
      const map = buildMockMap([layer]);

      const result = countTilesForSpecifiedLayers(buildUi(map), ['layer-a']);
      await Promise.resolve();
      expect(result.totalTilesLoadedWithBadImage).toBe(1);
    });

    it('counts loaded tile with invalid image (image.complete is false) as totalLoadedTileCount', async () => {
      const tile = buildMockTile(2, { complete: false, naturalWidth: 0, width: 2, height: 2 });
      const source = buildMockSource([tile]);
      const layer = buildMockTileLayer(source, 'layer-a');
      const map = buildMockMap([layer]);

      const result = countTilesForSpecifiedLayers(buildUi(map), ['layer-a']);
      await Promise.resolve();
      expect(result.totalLoadedTileCount).toBe(1);
      expect(result.totalTilesLoadedWithBadImage).toBe(0);
    });

    it('counts loaded tile with naturalWidth 0 as totalLoadedTileCount', async () => {
      const tile = buildMockTile(2, { complete: true, naturalWidth: 0, width: 2, height: 2 });
      const source = buildMockSource([tile]);
      const layer = buildMockTileLayer(source, 'layer-a');
      const map = buildMockMap([layer]);

      const result = countTilesForSpecifiedLayers(buildUi(map), ['layer-a']);
      await Promise.resolve();
      expect(result.totalLoadedTileCount).toBe(1);
      expect(result.totalTilesLoadedWithBadImage).toBe(0);
    });

    it('calls console.log("Image invalid.") when image is not complete', async () => {
      const tile = buildMockTile(2, { complete: false, naturalWidth: 0, width: 2, height: 2 });
      const source = buildMockSource([tile]);
      const layer = buildMockTileLayer(source, 'layer-a');
      const map = buildMockMap([layer]);

      countTilesForSpecifiedLayers(buildUi(map), ['layer-a']);
      await Promise.resolve();
      expect(console.log).toHaveBeenCalledWith('Image invalid.');
    });
  });

  // ── processTileLayer internals ─────────────────────────────────────────────

  describe('processTileLayer internals', () => {
    it('calls transformExtent with the view extent and projections', async () => {
      const tile = buildMockTile(4);
      const source = buildMockSource([tile]);
      const layer = buildMockTileLayer(source, 'layer-a');
      const view = buildMockView();
      const map = buildMockMap([layer], view);

      countTilesForSpecifiedLayers(buildUi(map), ['layer-a']);
      await Promise.resolve();
      expect(transformExtent).toHaveBeenCalledWith(
        [-180, -90, 180, 90],
        view.getProjection(),
        view.getProjection(),
      );
    });

    it('uses source.getProjection() when it returns a value', async () => {
      const mockSourceProj = { getCode: jest.fn(() => 'EPSG:3857') };
      const tile = buildMockTile(4);
      const source = buildMockSource([tile], mockSourceProj);
      const layer = buildMockTileLayer(source, 'layer-a');
      const map = buildMockMap([layer]);

      countTilesForSpecifiedLayers(buildUi(map), ['layer-a']);
      await Promise.resolve();
      expect(source.getTileGridForProjection).toHaveBeenCalledWith(mockSourceProj);
    });

    it('falls back to view.getProjection() when source.getProjection() returns null', async () => {
      const tile = buildMockTile(4);
      const source = buildMockSource([tile], null);
      const layer = buildMockTileLayer(source, 'layer-a');
      const view = buildMockView();
      const map = buildMockMap([layer], view);

      countTilesForSpecifiedLayers(buildUi(map), ['layer-a']);
      await Promise.resolve();
      expect(source.getTileGridForProjection).toHaveBeenCalledWith(view.getProjection());
    });

    it('calls source.getTile with correct tileCoord arguments', async () => {
      const tile = buildMockTile(4);
      const source = buildMockSource([tile]);
      const layer = buildMockTileLayer(source, 'layer-a');
      const map = buildMockMap([layer]);

      countTilesForSpecifiedLayers(buildUi(map), ['layer-a']);
      await Promise.resolve();
      expect(source.getTile).toHaveBeenCalledWith(5, 0, 0, 1, expect.anything());
    });

    it('calls tileGrid.getZForResolution with the view resolution', async () => {
      const tile = buildMockTile(4);
      const source = buildMockSource([tile]);
      const layer = buildMockTileLayer(source, 'layer-a');
      const view = buildMockView();
      const map = buildMockMap([layer], view);

      countTilesForSpecifiedLayers(buildUi(map), ['layer-a']);
      await Promise.resolve();
      const tileGrid = source.getTileGridForProjection();
      expect(tileGrid.getZForResolution).toHaveBeenCalledWith(0.5);
    });
  });

  // ── Aggregation across multiple layers ────────────────────────────────────

  describe('aggregation across multiple layers', () => {
    it('sums totalErrorTiles across multiple layers', async () => {
      const tilesA = [buildMockTile(3)];
      const tilesB = [buildMockTile(3), buildMockTile(3)];
      const sourceA = buildMockSource(tilesA);
      const sourceB = buildMockSource(tilesB);
      const layerA = buildMockTileLayer(sourceA, 'layer-a');
      const layerB = buildMockTileLayer(sourceB, 'layer-b');
      const map = buildMockMap([layerA, layerB]);

      const result = countTilesForSpecifiedLayers(buildUi(map), ['layer-a', 'layer-b']);
      await Promise.resolve();
      expect(result.totalErrorTiles).toBe(3);
    });

    it('sums totalEmptyTiles across multiple layers', async () => {
      const tilesA = [buildMockTile(4), buildMockTile(4)];
      const tilesB = [buildMockTile(4)];
      const sourceA = buildMockSource(tilesA);
      const sourceB = buildMockSource(tilesB);
      const layerA = buildMockTileLayer(sourceA, 'layer-a');
      const layerB = buildMockTileLayer(sourceB, 'layer-b');
      const map = buildMockMap([layerA, layerB]);

      const result = countTilesForSpecifiedLayers(buildUi(map), ['layer-a', 'layer-b']);
      await Promise.resolve();
      expect(result.totalEmptyTiles).toBe(3);
    });

    it('concatenates totalOtherTileStates across multiple layers', async () => {
      const tilesA = [buildMockTile(0)];
      const tilesB = [buildMockTile(1)];
      const sourceA = buildMockSource(tilesA);
      const sourceB = buildMockSource(tilesB);
      const layerA = buildMockTileLayer(sourceA, 'layer-a');
      const layerB = buildMockTileLayer(sourceB, 'layer-b');
      const map = buildMockMap([layerA, layerB]);

      const result = countTilesForSpecifiedLayers(buildUi(map), ['layer-a', 'layer-b']);
      await Promise.resolve();
      expect(result.totalOtherTileStates).toEqual([0, 1]);
    });

    it('sums totalExpectedTileCount across mixed tile states', async () => {
      const tiles = [buildMockTile(2), buildMockTile(3), buildMockTile(4), buildMockTile(0)];
      const source = buildMockSource(tiles);
      const layer = buildMockTileLayer(source, 'layer-a');
      const map = buildMockMap([layer]);

      const result = countTilesForSpecifiedLayers(buildUi(map), ['layer-a']);
      await Promise.resolve();
      expect(result.totalExpectedTileCount).toBe(4);
    });
  });
});

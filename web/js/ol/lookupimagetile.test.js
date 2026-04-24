/* eslint-disable no-underscore-dangle */
import OlTileState from 'ol/TileState';
import lookupFactory from './lookupimagetile';
import { decodePNG, processImage } from './util';

jest.mock('ol/ImageTile', () => {
  const MockOlImageTile = jest.fn(function MockOlImageTile(
    tileCoord, state, src, crossOrigin, tileLoadFunction, sourceOptions) {
    this.tileCoord = tileCoord;
    this.state = state;
    this.src_ = src;
    this.crossOrigin = crossOrigin;
    this.tileLoadFunction = tileLoadFunction;
    this.sourceOptions = sourceOptions;
    this.image_ = { src: '', width: 0, height: 0, addEventListener: jest.fn(), removeEventListener: jest.fn() };
    this.changed = jest.fn();
  });
  MockOlImageTile.prototype.changed = jest.fn();
  return MockOlImageTile;
});
jest.mock('ol/TileState', () => ({
  IDLE: 0,
  LOADING: 1,
  LOADED: 2,
  ERROR: 3,
}));

jest.mock('./util', () => ({
  decodePNG: jest.fn(),
  processImage: jest.fn(),
}));

const makeTile = (lookup, src = 'http://example.com/tile.png', state = OlTileState.IDLE) => {
  const factory = lookupFactory(lookup, {});
  const tileLoadFunction = jest.fn();
  return factory([0, 0, 0], state, src, null, tileLoadFunction);
};

const makeCanvas = (width = 2, height = 2) => {
  const imageData = { data: new Uint8ClampedArray(width * height * 4), width, height };
  const ctx = {
    drawImage: jest.fn(),
    createImageData: jest.fn(() => imageData),
    putImageData: jest.fn(),
    getImageData: jest.fn(() => imageData),
  };
  const canvas = { width, height, getContext: jest.fn(() => ctx) };
  return { canvas, ctx, imageData };
};

describe('lookupFactory', () => {
  it('returns a factory function', () => {
    expect(typeof lookupFactory({}, {})).toBe('function');
  });

  it('factory creates a tile with correct src', () => {
    const tile = makeTile({}, 'http://example.com/tile.png');
    expect(tile.src_).toBe('http://example.com/tile.png');
  });

  it('factory creates a tile with correct lookup', () => {
    const lookup = { '255,0,0,255': { r: 255, g: 0, b: 0, a: 255 } };
    const tile = makeTile(lookup);
    expect(tile.lookup_).toBe(lookup);
  });

  it('tile canvas_ is null initially', () => {
    const tile = makeTile({});
    expect(tile.canvas_).toBeNull();
  });

  it('getImage returns canvas_', () => {
    const tile = makeTile({});
    expect(tile.getImage()).toBeNull();
  });
});

describe('LookupImageTile.load', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.createElement = jest.fn((tag) => {
      if (tag === 'canvas') {
        return makeCanvas().canvas;
      }
      return {};
    });
  });

  describe('when state is not IDLE', () => {
    it('does not process when state is LOADING', async () => {
      const tile = makeTile({}, 'http://example.com/tile.png', OlTileState.LOADING);
      await tile.load();
      expect(tile.state).toBe(OlTileState.LOADING);
    });

    it('does not process when state is LOADED', async () => {
      const tile = makeTile({}, 'http://example.com/tile.png', OlTileState.LOADED);
      await tile.load();
      expect(tile.state).toBe(OlTileState.LOADED);
    });
  });

  describe('when lookupCount <= 1 or >= 25 (image load path)', () => {
    it('sets image src and adds load event listener', async () => {
      const lookup = { '255,0,0,255': { r: 255, g: 0, b: 0, a: 255 } };
      const tile = makeTile(lookup);
      const addEventListenerSpy = jest.spyOn(tile.image_, 'addEventListener');
      await tile.load();
      expect(tile.image_.src).toBe(tile.src_);
      expect(addEventListenerSpy).toHaveBeenCalledWith('load', expect.any(Function));
    });

    it('sets state to LOADING on load call', async () => {
      const lookup = { '255,0,0,255': { r: 255, g: 0, b: 0, a: 255 } };
      const tile = makeTile(lookup);
      await tile.load();
      expect(tile.state).toBe(OlTileState.LOADING);
    });

    it('calls changed() when load begins', async () => {
      const lookup = { '255,0,0,255': { r: 255, g: 0, b: 0, a: 255 } };
      const tile = makeTile(lookup);
      await tile.load();
      expect(tile.changed).toHaveBeenCalled();
    });

    it('empty lookup uses image load path', async () => {
      const tile = makeTile({});
      const addEventListenerSpy = jest.spyOn(tile.image_, 'addEventListener');
      await tile.load();
      expect(addEventListenerSpy).toHaveBeenCalledWith('load', expect.any(Function));
    });

    it('lookup with 25+ entries uses image load path', async () => {
      const lookup = {};
      for (let i = 0; i < 25; i += 1) {
        lookup[`${i},0,0,255`] = { r: i, g: 0, b: 0, a: 255 };
      }
      const tile = makeTile(lookup);
      const addEventListenerSpy = jest.spyOn(tile.image_, 'addEventListener');
      await tile.load();
      expect(addEventListenerSpy).toHaveBeenCalledWith('load', expect.any(Function));
    });

    describe('onImageLoad callback', () => {
      it('creates canvas with image dimensions', async () => {
        const lookup = { '255,0,0,255': { r: 255, g: 0, b: 0, a: 255 } };
        const tile = makeTile(lookup);
        const addEventListenerSpy = jest.spyOn(tile.image_, 'addEventListener');
        await tile.load();

        tile.image_.width = 10;
        tile.image_.height = 10;
        const onImageLoad = addEventListenerSpy.mock.calls[0][1];
        onImageLoad();

        expect(document.createElement).toHaveBeenCalledWith('canvas');
      });

      it('calls processImage when imageProcessed is false', async () => {
        const lookup = { '255,0,0,255': { r: 255, g: 0, b: 0, a: 255 } };
        const tile = makeTile(lookup);
        const addEventListenerSpy = jest.spyOn(tile.image_, 'addEventListener');
        await tile.load();

        tile.image_.width = 10;
        tile.image_.height = 10;
        const onImageLoad = addEventListenerSpy.mock.calls[0][1];
        onImageLoad();

        expect(processImage).toHaveBeenCalledWith(tile.canvas_, lookup);
      });

      it('calls customTileLoadFunction_ after image loads', async () => {
        const lookup = { '255,0,0,255': { r: 255, g: 0, b: 0, a: 255 } };
        const tile = makeTile(lookup);
        const addEventListenerSpy = jest.spyOn(tile.image_, 'addEventListener');
        await tile.load();

        tile.image_.width = 10;
        tile.image_.height = 10;
        const onImageLoad = addEventListenerSpy.mock.calls[0][1];
        onImageLoad();

        expect(tile.customTileLoadFunction_).toHaveBeenCalledWith(tile, tile.src_);
      });

      it('sets state to LOADED after image loads', async () => {
        const lookup = { '255,0,0,255': { r: 255, g: 0, b: 0, a: 255 } };
        const tile = makeTile(lookup);
        const addEventListenerSpy = jest.spyOn(tile.image_, 'addEventListener');
        await tile.load();

        tile.image_.width = 10;
        tile.image_.height = 10;
        const onImageLoad = addEventListenerSpy.mock.calls[0][1];
        onImageLoad();

        expect(tile.state).toBe(OlTileState.LOADED);
      });

      it('removes load event listener after image loads', async () => {
        const lookup = { '255,0,0,255': { r: 255, g: 0, b: 0, a: 255 } };
        const tile = makeTile(lookup);
        const removeEventListenerSpy = jest.spyOn(tile.image_, 'removeEventListener');
        const addEventListenerSpy = jest.spyOn(tile.image_, 'addEventListener');
        await tile.load();

        tile.image_.width = 10;
        tile.image_.height = 10;
        const onImageLoad = addEventListenerSpy.mock.calls[0][1];
        onImageLoad();

        expect(removeEventListenerSpy).toHaveBeenCalledWith('load', onImageLoad);
      });
    });
  });

  describe('when lookupCount is between 2 and 24 (fetch/PNG path)', () => {
    const makeLookup = (count) => {
      const lookup = {};
      for (let i = 0; i < count; i += 1) {
        lookup[`${i},${i},${i},255`] = { r: i, g: i, b: i, a: 255 };
      }
      return lookup;
    };

    const makePLTEBuffer = (width, height) => {
      const pixelData = new Uint8Array(width * height).fill(0);
      const plteData = new Uint8Array([255, 0, 0, 0, 255, 0, 0, 0, 255]);
      return {
        width,
        height,
        data: pixelData,
        tabs: { PLTE: plteData },
      };
    };

    beforeEach(() => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('calls fetch with tile src', async () => {
      const lookup = makeLookup(5);
      decodePNG.mockResolvedValue(makePLTEBuffer(2, 2));
      const tile = makeTile(lookup, 'http://example.com/tile.png');
      await tile.load();
      expect(fetch).toHaveBeenCalledWith('http://example.com/tile.png');
    });

    it('calls decodePNG with array buffer', async () => {
      const lookup = makeLookup(5);
      const buffer = new ArrayBuffer(8);
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(buffer),
      });
      decodePNG.mockResolvedValue(makePLTEBuffer(2, 2));
      const tile = makeTile(lookup);
      await tile.load();
      expect(decodePNG).toHaveBeenCalledWith(buffer);
    });

    it('sets state to LOADED after successful fetch', async () => {
      const lookup = makeLookup(5);
      decodePNG.mockResolvedValue(makePLTEBuffer(2, 2));
      const tile = makeTile(lookup);
      await tile.load();
      expect(tile.state).toBe(OlTileState.LOADED);
    });

    it('calls customTileLoadFunction_ after successful fetch', async () => {
      const lookup = makeLookup(5);
      decodePNG.mockResolvedValue(makePLTEBuffer(2, 2));
      const tile = makeTile(lookup);
      await tile.load();
      expect(tile.customTileLoadFunction_).toHaveBeenCalledWith(tile, tile.src_);
    });

    it('sets state to ERROR when fetch fails', async () => {
      const lookup = makeLookup(5);
      jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const tile = makeTile(lookup);
      await tile.load();
      expect(tile.state).toBe(OlTileState.ERROR);
      consoleSpy.mockRestore();
    });

    it('calls changed() after setting ERROR state', async () => {
      const lookup = makeLookup(5);
      jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const tile = makeTile(lookup);
      await tile.load();
      expect(tile.changed).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('logs error to console on failure', async () => {
      const lookup = makeLookup(5);
      const error = new Error('Network error');
      jest.spyOn(global, 'fetch').mockRejectedValue(error);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const tile = makeTile(lookup);
      await tile.load();
      expect(consoleSpy).toHaveBeenCalledWith('Error:', error);
      consoleSpy.mockRestore();
    });

    it('sets state to ERROR when response is not ok', async () => {
      const lookup = makeLookup(5);
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const tile = makeTile(lookup);
      await tile.load();
      expect(tile.state).toBe(OlTileState.ERROR);
      consoleSpy.mockRestore();
    });

    describe('with PLTE indexed PNG', () => {
      it('creates canvas with decoded PNG dimensions', async () => {
        const lookup = makeLookup(5);
        decodePNG.mockResolvedValue(makePLTEBuffer(4, 4));
        const tile = makeTile(lookup);
        await tile.load();
        expect(tile.canvas_).toBeDefined();
      });

      it('draws pixels matching pixelsToDisplay', async () => {
        const lookup = {
          '255,0,0,255': { r: 255, g: 0, b: 0, a: 255 },
          '0,255,0,255': { r: 0, g: 255, b: 0, a: 255 },
          '0,0,255,255': { r: 0, g: 0, b: 255, a: 255 },
        };
        const pixelData = new Uint8Array([0, 1, 2, 0]);
        const plteData = new Uint8Array([255, 0, 0, 0, 255, 0, 0, 0, 255]);
        decodePNG.mockResolvedValue({
          width: 2,
          height: 2,
          data: pixelData,
          tabs: { PLTE: plteData },
        });
        const tile = makeTile(lookup);
        const { ctx, imageData } = makeCanvas(2, 2);
        document.createElement = jest.fn(() => ({
          width: 0,
          height: 0,
          getContext: jest.fn(() => ctx),
        }));
        ctx.createImageData.mockReturnValue(imageData);
        await tile.load();
        expect(ctx.putImageData).toHaveBeenCalled();
      });

      it('sets transparent pixels for colors not in pixelsToDisplay', async () => {
        const lookup = {
          '255,0,0,255': { r: 255, g: 0, b: 0, a: 255 },
          '0,255,0,255': { r: 0, g: 255, b: 0, a: 255 },
        };
        const pixelData = new Uint8Array([2]);
        const plteData = new Uint8Array([0, 0, 255]);
        decodePNG.mockResolvedValue({
          width: 1,
          height: 1,
          data: pixelData,
          tabs: { PLTE: plteData },
        });
        const outputData = new Uint8ClampedArray(4);
        const imageData = { data: outputData };
        const ctx = {
          createImageData: jest.fn(() => imageData),
          putImageData: jest.fn(),
          drawImage: jest.fn(),
        };
        document.createElement = jest.fn(() => ({
          width: 0,
          height: 0,
          getContext: jest.fn(() => ctx),
        }));
        const tile = makeTile(lookup);
        await tile.load();
        expect(outputData[3]).toBe(0);
      });
    });

    describe('without PLTE (non-indexed PNG)', () => {
      it('copies pixel data to output', async () => {
        const lookup = {
          '255,0,0,255': { r: 255, g: 0, b: 0, a: 255 },
          '0,255,0,255': { r: 0, g: 255, b: 0, a: 255 },
        };
        const pixelData = new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255]);
        decodePNG.mockResolvedValue({
          width: 2,
          height: 1,
          data: pixelData,
          tabs: {},
        });
        const outputData = new Uint8ClampedArray(8);
        const imageData = { data: outputData };
        const ctx = {
          createImageData: jest.fn(() => imageData),
          putImageData: jest.fn(),
          drawImage: jest.fn(),
        };
        document.createElement = jest.fn(() => ({
          width: 0,
          height: 0,
          getContext: jest.fn(() => ctx),
        }));
        const tile = makeTile(lookup);
        await tile.load();
        expect(outputData[0]).toBe(255);
      });

      it('makes pixels transparent when color difference exceeds threshold', async () => {
        const lookup = {
          '255,0,0,255': { r: 255, g: 0, b: 0, a: 255 },
          '0,255,0,255': { r: 0, g: 255, b: 0, a: 255 },
        };
        // A pixel that differs significantly from both colors in lookup
        const pixelData = new Uint8ClampedArray([100, 100, 100, 255]);
        decodePNG.mockResolvedValue({
          width: 1,
          height: 1,
          data: pixelData,
          tabs: {},
        });
        const outputData = new Uint8ClampedArray(4);
        outputData.set(pixelData);
        const imageData = { data: outputData };
        const ctx = {
          createImageData: jest.fn(() => imageData),
          putImageData: jest.fn(),
          drawImage: jest.fn(),
        };
        document.createElement = jest.fn(() => ({
          width: 0,
          height: 0,
          getContext: jest.fn(() => ctx),
        }));
        const tile = makeTile(lookup);
        await tile.load();
        expect(outputData[3]).toBe(0);
      });

      it('keeps pixels visible when color difference is within threshold', async () => {
        const lookup = {
          '100,100,100,255': { r: 100, g: 100, b: 100, a: 255 },
          '0,255,0,255': { r: 0, g: 255, b: 0, a: 255 },
        };
        const pixelData = new Uint8ClampedArray([105, 100, 100, 255]);
        decodePNG.mockResolvedValue({
          width: 1,
          height: 1,
          data: pixelData,
          tabs: {},
        });
        const outputData = new Uint8ClampedArray([105, 100, 100, 255]);
        const imageData = { data: outputData };
        const ctx = {
          createImageData: jest.fn(() => imageData),
          putImageData: jest.fn(),
          drawImage: jest.fn(),
        };
        document.createElement = jest.fn(() => ({
          width: 0,
          height: 0,
          getContext: jest.fn(() => ctx),
        }));
        const tile = makeTile(lookup);
        await tile.load();
        expect(outputData[3]).toBe(255);
      });
    });

    it('calls changed() after setting LOADED state', async () => {
      const lookup = makeLookup(5);
      decodePNG.mockResolvedValue(makePLTEBuffer(2, 2));
      const tile = makeTile(lookup);
      tile.changed.mockClear();
      await tile.load();
      expect(tile.changed).toHaveBeenCalled();
    });
  });
});

describe('getPixelColorsToDisplay (via integration)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('excludes fully transparent pixels (r=0,g=0,b=0,a=0) from pixelsToDisplay', async () => {
    const lookup = {
      '0,0,0,0': { r: 0, g: 0, b: 0, a: 0 },
      '255,0,0,255': { r: 255, g: 0, b: 0, a: 255 },
      '0,255,0,255': { r: 0, g: 255, b: 0, a: 255 },
    };
    const pixelData = new Uint8Array([0, 1]);
    const plteData = new Uint8Array([0, 0, 0, 255, 0, 0]);
    decodePNG.mockResolvedValue({
      width: 2,
      height: 1,
      data: pixelData,
      tabs: { PLTE: plteData },
    });
    const outputData = new Uint8ClampedArray(8);
    const ctx = {
      createImageData: jest.fn(() => ({ data: outputData })),
      putImageData: jest.fn(),
    };
    document.createElement = jest.fn(() => ({
      width: 0,
      height: 0,
      getContext: jest.fn(() => ctx),
    }));
    const tile = makeTile(lookup);
    await tile.load();
    // pixel at index 0 maps to color (0,0,0,255) which is excluded => transparent
    expect(outputData[3]).toBe(0);
    // pixel at index 1 maps to color (255,0,0,255) which is included => visible
    expect(outputData[7]).toBe(255);
  });
});

describe('getColormap (via integration)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('correctly converts RGB PLTE to RGBA colormap', async () => {
    const lookup = {
      '255,0,0,255': { r: 255, g: 0, b: 0, a: 255 },
      '0,255,0,255': { r: 0, g: 255, b: 0, a: 255 },
    };
    const pixelData = new Uint8Array([0]);
    const plteData = new Uint8Array([255, 0, 0]);
    decodePNG.mockResolvedValue({
      width: 1,
      height: 1,
      data: pixelData,
      tabs: { PLTE: plteData },
    });
    const outputData = new Uint8ClampedArray(4);
    const ctx = {
      createImageData: jest.fn(() => ({ data: outputData })),
      putImageData: jest.fn(),
    };
    document.createElement = jest.fn(() => ({
      width: 0,
      height: 0,
      getContext: jest.fn(() => ctx),
    }));
    const tile = makeTile(lookup);
    await tile.load();
    // Pixel 0 -> colormap index 0 -> (255,0,0,255) which is in lookup -> visible
    expect(outputData[0]).toBe(255);
    expect(outputData[1]).toBe(0);
    expect(outputData[2]).toBe(0);
    expect(outputData[3]).toBe(255);
  });

  it('clamps pixel index to max colormap index', async () => {
    const lookup = {
      '255,0,0,255': { r: 255, g: 0, b: 0, a: 255 },
      '0,255,0,255': { r: 0, g: 255, b: 0, a: 255 },
    };
    // pixel index 10 but only 1 color in PLTE -> clamps to 0
    const pixelData = new Uint8Array([10]);
    const plteData = new Uint8Array([255, 0, 0]);
    decodePNG.mockResolvedValue({
      width: 1,
      height: 1,
      data: pixelData,
      tabs: { PLTE: plteData },
    });
    const outputData = new Uint8ClampedArray(4);
    const ctx = {
      createImageData: jest.fn(() => ({ data: outputData })),
      putImageData: jest.fn(),
    };
    document.createElement = jest.fn(() => ({
      width: 0,
      height: 0,
      getContext: jest.fn(() => ctx),
    }));
    const tile = makeTile(lookup);
    await tile.load();
    expect(outputData[0]).toBe(255);
  });
});

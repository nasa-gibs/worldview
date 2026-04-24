/* eslint-disable no-underscore-dangle */
import { decodePNG, extractIndexedData, getPixelDataFromCanvas, processImage } from './util';

// Fix 1: polyfill structuredClone for Jest environment
if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

// Helper to create a mock canvas with controllable pixel data
const makeMockCanvas = (width, height, pixelData) => {
  const data = pixelData || new Uint8ClampedArray(width * height * 4);
  const imageData = { data };
  const ctx = {
    getImageData: jest.fn(() => imageData),
    putImageData: jest.fn(),
    drawImage: jest.fn(),
    createImageData: jest.fn(() => imageData),
  };
  return {
    width,
    height,
    getContext: jest.fn(() => ctx),
    _ctx: ctx,
    _imageData: imageData,
  };
};

// Helper to build a minimal valid PNG ArrayBuffer
const buildPNG = ({
  width = 1,
  height = 1,
  colorType = 2,
  bitDepth = 8,
  plte = null,
  trns = null,
} = {}) => {
  const signature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];

  const makeChunk = (type, data) => {
    const typeBytes = type.split('').map((c) => c.charCodeAt(0));
    const length = data.length;
    const chunk = new Uint8Array(4 + 4 + length + 4);
    const view = new DataView(chunk.buffer);
    view.setUint32(0, length, false);
    typeBytes.forEach((b, i) => { chunk[4 + i] = b; });
    chunk.set(data, 8);
    return chunk;
  };

  const ihdrData = new Uint8Array(13);
  const ihdrView = new DataView(ihdrData.buffer);
  ihdrView.setUint32(0, width, false);
  ihdrView.setUint32(4, height, false);
  ihdrData[8] = bitDepth;
  ihdrData[9] = colorType;

  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const iendChunk = makeChunk('IEND', new Uint8Array(0));

  const parts = [new Uint8Array(signature), ihdrChunk];
  if (plte) parts.push(makeChunk('PLTE', plte));
  if (trns) parts.push(makeChunk('tRNS', trns));
  parts.push(iendChunk);

  const totalLength = parts.reduce((sum, p) => sum + p.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  parts.forEach((p) => { result.set(p, offset); offset += p.length; });
  return result.buffer;
};

// Fix 2: Setup mock Image and URL helpers that work correctly
const setupImageMocks = (pixelData) => {
  const mockImageData = { data: pixelData || new Uint8ClampedArray([255, 0, 0, 255]) };
  const mockCtx = {
    drawImage: jest.fn(),
    getImageData: jest.fn(() => mockImageData),
  };
  const mockCanvas = {
    width: pixelData ? Math.sqrt(pixelData.length / 4) : 1,
    height: pixelData ? Math.sqrt(pixelData.length / 4) : 1,
    getContext: jest.fn(() => mockCtx),
  };
  document.createElement = jest.fn(() => mockCanvas);

  // Fix 3: Don't spy on Blob constructor - use a simple working Image mock instead
  URL.createObjectURL = jest.fn(() => 'blob:mock-url');
  URL.revokeObjectURL = jest.fn();

  global.Image = function MockImage() {
    this.onload = null;
    this.onerror = null;
    this.width = 1;
    this.height = 1;
    const self = this;
    Object.defineProperty(this, 'src', {
      set() {
        setTimeout(() => { if (self.onload) self.onload(); }, 0);
      },
      get() { return ''; },
    });
  };

  return { mockCanvas, mockCtx, mockImageData };
};

describe('processImage', () => {
  it('swaps pixel color based on lookup', () => {
    const pixelData = new Uint8ClampedArray([255, 0, 0, 255, 0, 0, 0, 0]);
    const canvas = makeMockCanvas(2, 1, pixelData);
    const lookup = { '255,0,0,255': { r: 0, g: 0, b: 255, a: 255 } };
    processImage(canvas, lookup);
    const ctx = canvas._ctx;
    const putData = ctx.putImageData.mock.calls[0][0].data;
    expect(putData[0]).toBe(0);
    expect(putData[1]).toBe(0);
    expect(putData[2]).toBe(255);
    expect(putData[3]).toBe(255);
  });

  it('keeps transparent pixels (0,0,0,0) as transparent', () => {
    const pixelData = new Uint8ClampedArray([0, 0, 0, 0]);
    const canvas = makeMockCanvas(1, 1, pixelData);
    const lookup = { '255,0,0,255': { r: 0, g: 255, b: 0, a: 255 } };
    processImage(canvas, lookup);
    const ctx = canvas._ctx;
    const putData = ctx.putImageData.mock.calls[0][0].data;
    expect(putData[0]).toBe(0);
    expect(putData[1]).toBe(0);
    expect(putData[2]).toBe(0);
    expect(putData[3]).toBe(0);
  });

  it('applies anti-aliasing adjustment for unmatched pixels', () => {
    const pixelData = new Uint8ClampedArray([200, 0, 0, 255]);
    const canvas = makeMockCanvas(1, 1, pixelData);
    const lookup = { '255,0,0,255': { r: 0, g: 0, b: 255, a: 255 } };
    processImage(canvas, lookup);
    const ctx = canvas._ctx;
    const putData = ctx.putImageData.mock.calls[0][0].data;
    // rDiff = 200-255 = -55, paletteColor.r=0, result = 0+(-55) = -55 => clamped to 0
    expect(putData[0]).toBe(0);
    expect(putData[3]).toBe(255);
  });

  it('caches computed anti-aliased colors for repeated pixels', () => {
    const pixelData = new Uint8ClampedArray([200, 0, 0, 255, 200, 0, 0, 255]);
    const canvas = makeMockCanvas(2, 1, pixelData);
    const lookup = { '255,0,0,255': { r: 100, g: 0, b: 100, a: 255 } };
    processImage(canvas, lookup);
    const ctx = canvas._ctx;
    const putData = ctx.putImageData.mock.calls[0][0].data;
    expect(putData[0]).toBe(putData[4]);
    expect(putData[2]).toBe(putData[6]);
  });

  it('calls getContext with "2d"', () => {
    const canvas = makeMockCanvas(1, 1);
    processImage(canvas, { '0,0,0,255': { r: 0, g: 0, b: 0, a: 255 } });
    expect(canvas.getContext).toHaveBeenCalledWith('2d');
  });

  it('calls putImageData after processing', () => {
    const canvas = makeMockCanvas(1, 1);
    processImage(canvas, { '0,0,0,255': { r: 0, g: 0, b: 0, a: 255 } });
    expect(canvas._ctx.putImageData).toHaveBeenCalled();
  });

  it('does not mutate original lookup object', () => {
    const lookup = { '255,0,0,255': { r: 0, g: 255, b: 0, a: 255 } };
    const originalKeys = Object.keys(lookup).length;
    const canvas = makeMockCanvas(1, 1, new Uint8ClampedArray([100, 100, 100, 100]));
    processImage(canvas, lookup);
    expect(Object.keys(lookup).length).toBe(originalKeys);
  });

  it('handles multiple pixels with different colors', () => {
    const pixelData = new Uint8ClampedArray([
      255, 0, 0, 255,
      0, 0, 0, 0,
      255, 0, 0, 255,
    ]);
    const canvas = makeMockCanvas(3, 1, pixelData);
    const lookup = { '255,0,0,255': { r: 0, g: 0, b: 255, a: 255 } };
    processImage(canvas, lookup);
    const ctx = canvas._ctx;
    const putData = ctx.putImageData.mock.calls[0][0].data;
    expect(putData[2]).toBe(255);
    expect(putData[7]).toBe(0);
    expect(putData[10]).toBe(255);
  });
});

describe('extractIndexedData', () => {
  const palette = new Uint8Array([255, 0, 0, 0, 255, 0, 0, 0, 255]);

  it('returns correct palette indices for exact matches', () => {
    const pixels = new Uint8ClampedArray([
      255, 0, 0, 255,
      0, 255, 0, 255,
      0, 0, 255, 255,
    ]);
    const result = extractIndexedData(pixels, palette, 3, 1);
    expect(result[0]).toBe(0);
    expect(result[1]).toBe(1);
    expect(result[2]).toBe(2);
  });

  it('returns index 0 for fully transparent pixels', () => {
    const pixels = new Uint8ClampedArray([100, 100, 100, 0]);
    const result = extractIndexedData(pixels, palette, 1, 1);
    expect(result[0]).toBe(0);
  });

  it('finds closest palette index for non-exact matches', () => {
    const pixels = new Uint8ClampedArray([250, 5, 5, 255]);
    const result = extractIndexedData(pixels, palette, 1, 1);
    expect(result[0]).toBe(0);
  });

  it('uses alphaValues from tRNS chunk when provided', () => {
    const alphaValues = new Uint8Array([0, 255, 255]);
    const pixels = new Uint8ClampedArray([255, 0, 0, 0]);
    const result = extractIndexedData(pixels, palette, 1, 1, alphaValues);
    expect(result[0]).toBe(0);
  });

  it('defaults alpha to 255 when alphaValues not provided', () => {
    const pixels = new Uint8ClampedArray([255, 0, 0, 255]);
    const result = extractIndexedData(pixels, palette, 1, 1);
    expect(result[0]).toBe(0);
  });

  it('returns Uint8Array of correct length', () => {
    const pixels = new Uint8ClampedArray(4 * 4 * 4);
    const result = extractIndexedData(pixels, palette, 4, 4);
    expect(result.length).toBe(16);
    expect(result).toBeInstanceOf(Uint8Array);
  });

  it('skips transparent palette entries when looking for opaque colors', () => {
    const alphaValues = new Uint8Array([0, 255]);
    const pal = new Uint8Array([255, 0, 0, 0, 255, 0]);
    const pixels = new Uint8ClampedArray([255, 0, 0, 255]);
    const result = extractIndexedData(pixels, pal, 1, 1, alphaValues);
    expect(result[0]).toBe(1);
  });

  it('handles single color palette', () => {
    const pal = new Uint8Array([128, 64, 32]);
    const pixels = new Uint8ClampedArray([128, 64, 32, 255]);
    const result = extractIndexedData(pixels, pal, 1, 1);
    expect(result[0]).toBe(0);
  });

  it('handles alphaValues for partial palette coverage', () => {
    const alphaValues = new Uint8Array([128]);
    const pixels = new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255]);
    const result = extractIndexedData(pixels, palette, 2, 1, alphaValues);
    expect(result).toHaveLength(2);
  });
});

describe('getPixelDataFromCanvas', () => {
  let originalImage;
  let originalCreateObjectURL;
  let originalRevokeObjectURL;

  beforeEach(() => {
    originalImage = global.Image;
    originalCreateObjectURL = URL.createObjectURL;
    originalRevokeObjectURL = URL.revokeObjectURL;
    setupImageMocks();
  });

  afterEach(() => {
    global.Image = originalImage;
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    jest.restoreAllMocks();
  });

  it('returns pixels and canvas', async () => {
    const buffer = new ArrayBuffer(8);
    const result = await getPixelDataFromCanvas(buffer);
    expect(result).toHaveProperty('pixels');
    expect(result).toHaveProperty('canvas');
  });

  it('creates a Blob with image/png type', async () => {
    const buffer = new ArrayBuffer(8);
    // Verify by checking createObjectURL was called (Blob was created and passed to it)
    await getPixelDataFromCanvas(buffer);
    expect(URL.createObjectURL).toHaveBeenCalled();
    const arg = URL.createObjectURL.mock.calls[0][0];
    expect(arg).toBeInstanceOf(Blob);
    expect(arg.type).toBe('image/png');
  });

  it('calls URL.createObjectURL', async () => {
    await getPixelDataFromCanvas(new ArrayBuffer(8));
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it('calls URL.revokeObjectURL after loading', async () => {
    await getPixelDataFromCanvas(new ArrayBuffer(8));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('revokes URL even when image load fails', async () => {
    global.Image = function FailImage() {
      this.onload = null;
      this.onerror = null;
      const self = this;
      Object.defineProperty(this, 'src', {
        set() {
          setTimeout(() => { if (self.onerror) self.onerror('load error'); }, 0);
        },
        get() { return ''; },
      });
    };
    await expect(getPixelDataFromCanvas(new ArrayBuffer(8))).rejects.toThrow('Failed to load PNG');
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });

  it('draws image to canvas context', async () => {
    const buffer = new ArrayBuffer(8);
    await getPixelDataFromCanvas(buffer);
    const canvas = document.createElement.mock.results[0].value;
    const ctx = canvas.getContext('2d');
    expect(ctx.drawImage).toHaveBeenCalled();
  });
});

describe('decodePNG', () => {
  let originalImage;
  let originalCreateObjectURL;
  let originalRevokeObjectURL;

  beforeEach(() => {
    originalImage = global.Image;
    originalCreateObjectURL = URL.createObjectURL;
    originalRevokeObjectURL = URL.revokeObjectURL;
    setupImageMocks();
  });

  afterEach(() => {
    global.Image = originalImage;
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    jest.restoreAllMocks();
  });

  it('throws on invalid PNG signature', async () => {
    const buffer = new ArrayBuffer(16);
    await expect(decodePNG(buffer)).rejects.toThrow('Invalid PNG signature');
  });

  it('throws when IHDR chunk is missing', async () => {
    const sig = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    const iend = new Uint8Array([0, 0, 0, 0, 0x49, 0x45, 0x4E, 0x44, 0, 0, 0, 0]);
    const buf = new Uint8Array(sig.length + iend.length);
    buf.set(sig, 0);
    buf.set(iend, sig.length);
    await expect(decodePNG(buf.buffer)).rejects.toThrow('Missing IHDR chunk');
  });

  it('returns correct width and height from IHDR', async () => {
    const buffer = buildPNG({ width: 1, height: 1, colorType: 2 });
    const result = await decodePNG(buffer);
    expect(result.width).toBe(1);
    expect(result.height).toBe(1);
  });

  it('returns correct bitDepth and colorType', async () => {
    const buffer = buildPNG({ width: 1, height: 1, colorType: 2, bitDepth: 8 });
    const result = await decodePNG(buffer);
    expect(result.bitDepth).toBe(8);
    expect(result.colorType).toBe(2);
  });

  it('returns isIndexed true for colorType 3', async () => {
    const plte = new Uint8Array([255, 0, 0, 0, 255, 0]);
    setupImageMocks(new Uint8ClampedArray([255, 0, 0, 255]));
    const buffer = buildPNG({ width: 1, height: 1, colorType: 3, plte });
    const result = await decodePNG(buffer);
    expect(result.isIndexed).toBe(true);
  });

  it('returns isIndexed false for colorType 2', async () => {
    const buffer = buildPNG({ width: 1, height: 1, colorType: 2 });
    const result = await decodePNG(buffer);
    expect(result.isIndexed).toBe(false);
  });

  it('returns tabs with PLTE when palette present', async () => {
    const plte = new Uint8Array([255, 0, 0, 0, 255, 0]);
    setupImageMocks(new Uint8ClampedArray([255, 0, 0, 255]));
    const buffer = buildPNG({ width: 1, height: 1, colorType: 3, plte });
    const result = await decodePNG(buffer);
    expect(result.tabs).toBeDefined();
    expect(result.tabs.PLTE).toBeInstanceOf(Uint8Array);
  });

  it('returns tabs as undefined when no palette', async () => {
    const buffer = buildPNG({ width: 1, height: 1, colorType: 2 });
    const result = await decodePNG(buffer);
    expect(result.tabs).toBeUndefined();
  });

  it('returns tabs with tRNS when trns chunk present', async () => {
    const plte = new Uint8Array([255, 0, 0, 0, 255, 0]);
    const trns = new Uint8Array([128, 255]);
    setupImageMocks(new Uint8ClampedArray([255, 0, 0, 128]));
    const buffer = buildPNG({ width: 1, height: 1, colorType: 3, plte, trns });
    const result = await decodePNG(buffer);
    expect(result.tabs.tRNS).toBeInstanceOf(Uint8Array);
  });

  it('returns rgba data', async () => {
    const buffer = buildPNG({ width: 1, height: 1, colorType: 2 });
    const result = await decodePNG(buffer);
    expect(result.rgba).toBeInstanceOf(Uint8Array);
  });

  it('returns canvas', async () => {
    const buffer = buildPNG({ width: 1, height: 1, colorType: 2 });
    const result = await decodePNG(buffer);
    expect(result.canvas).toBeDefined();
  });

  it('returns Uint8Array data for non-indexed PNG', async () => {
    const buffer = buildPNG({ width: 1, height: 1, colorType: 2 });
    const result = await decodePNG(buffer);
    expect(result.data).toBeInstanceOf(Uint8Array);
  });

  it('returns Uint8Array indexed data for indexed PNG', async () => {
    const plte = new Uint8Array([255, 0, 0, 0, 255, 0]);
    setupImageMocks(new Uint8ClampedArray([255, 0, 0, 255]));
    const buffer = buildPNG({ width: 1, height: 1, colorType: 3, plte });
    const result = await decodePNG(buffer);
    expect(result.data).toBeInstanceOf(Uint8Array);
    expect(result.data.length).toBe(1);
  });

  it('parses IHDR width and height as big-endian uint32', async () => {
    setupImageMocks(new Uint8ClampedArray(256 * 128 * 4));
    const buffer = buildPNG({ width: 256, height: 128, colorType: 2 });
    const mockImageData = { data: new Uint8ClampedArray(256 * 128 * 4) };
    const mockCtx = { drawImage: jest.fn(), getImageData: jest.fn(() => mockImageData) };
    const mockCanvas = { width: 256, height: 128, getContext: jest.fn(() => mockCtx) };
    document.createElement = jest.fn(() => mockCanvas);
    const result = await decodePNG(buffer);
    expect(result.width).toBe(256);
    expect(result.height).toBe(128);
  });
});

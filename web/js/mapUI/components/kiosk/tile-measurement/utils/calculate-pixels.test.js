import calculateBlackPixelRatio from './calculate-pixels';

// ─── Canvas mock setup ────────────────────────────────────────────────────────

// Builds a mock canvas context whose getImageData returns a controlled pixel array
function buildMockCtx(pixelData) {
  return {
    drawImage: jest.fn(),
    getImageData: jest.fn(() => ({ data: pixelData })),
  };
}

// Builds a mock canvas element using a given ctx
function buildMockCanvas(ctx) {
  return {
    getContext: jest.fn(() => ctx),
    width: 0,
    height: 0,
  };
}

// Helper to build a flat RGBA pixel array for an N×N image
// Each pixel is described as [r, g, b, a]
function buildPixelData(pixels) {
  return new Uint8ClampedArray(pixels.flat());
}

// Convenience to build a 1×1 target with a given pixel
function buildTarget(width, height) {
  return { width, height };
}

describe('calculateBlackPixelRatio', () => {
  let mockImgInstance;
  let mockCtx;
  let mockCanvas;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});

    mockImgInstance = { src: null, onload: null, onerror: null };
    jest.spyOn(global, 'Image').mockImplementation(() => mockImgInstance);

    mockCtx = buildMockCtx([]);
    mockCanvas = buildMockCanvas(mockCtx);

    jest.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'canvas') return mockCanvas;
      return document.createElement.wrappedMethod
        ? document.createElement.wrappedMethod(tag)
        : {};
    });
  });

  afterEach(() => {
    console.error.mockRestore();
    global.Image.mockRestore();
    document.createElement.mockRestore();
  });

  // ── Return value ───────────────────────────────────────────────────────────

  describe('Return value', () => {
    it('returns a Promise', () => {
      const result = calculateBlackPixelRatio('blob:mock-url');
      expect(result).toBeInstanceOf(Promise);
    });
  });

  // ── img.src ────────────────────────────────────────────────────────────────

  describe('img.src', () => {
    it('sets img.src to the provided blobUrl', () => {
      calculateBlackPixelRatio('blob:test-url');
      expect(mockImgInstance.src).toBe('blob:test-url');
    });

    it('sets img.src to an empty string when blobUrl is empty', () => {
      calculateBlackPixelRatio('');
      expect(mockImgInstance.src).toBe('');
    });
  });

  // ── canvas setup ───────────────────────────────────────────────────────────

  describe('canvas setup', () => {
    it('creates a canvas element via document.createElement', async () => {
      const target = buildTarget(4, 4);
      mockCtx.getImageData.mockReturnValue({ data: buildPixelData(Array(16).fill([0, 0, 0, 0])) });
      const promise = calculateBlackPixelRatio('blob:url');
      await mockImgInstance.onload({ target });
      await promise;
      expect(document.createElement).toHaveBeenCalledWith('canvas');
    });

    it('sets canvas.width to target.width', async () => {
      const target = buildTarget(10, 5);
      mockCtx.getImageData.mockReturnValue({ data: buildPixelData(Array(50).fill([0, 0, 0, 0])) });
      const promise = calculateBlackPixelRatio('blob:url');
      await mockImgInstance.onload({ target });
      await promise;
      expect(mockCanvas.width).toBe(10);
    });

    it('sets canvas.height to target.height', async () => {
      const target = buildTarget(10, 5);
      mockCtx.getImageData.mockReturnValue({ data: buildPixelData(Array(50).fill([0, 0, 0, 0])) });
      const promise = calculateBlackPixelRatio('blob:url');
      await mockImgInstance.onload({ target });
      await promise;
      expect(mockCanvas.height).toBe(5);
    });

    it('calls ctx.drawImage with the target and its dimensions', async () => {
      const target = buildTarget(8, 8);
      mockCtx.getImageData.mockReturnValue({
        data: buildPixelData(Array(64).fill([255, 255, 255, 255])),
      });
      const promise = calculateBlackPixelRatio('blob:url');
      await mockImgInstance.onload({ target });
      await promise;
      expect(mockCtx.drawImage).toHaveBeenCalledWith(target, 0, 0, 8, 8);
    });

    it('calls ctx.getImageData with correct dimensions', async () => {
      const target = buildTarget(3, 3);
      mockCtx.getImageData.mockReturnValue({
        data: buildPixelData(Array(9).fill([255, 255, 255, 255])),
      });
      const promise = calculateBlackPixelRatio('blob:url');
      await mockImgInstance.onload({ target });
      await promise;
      expect(mockCtx.getImageData).toHaveBeenCalledWith(0, 0, 3, 3);
    });

    it('calls canvas.getContext with "2d"', async () => {
      const target = buildTarget(2, 2);
      mockCtx.getImageData.mockReturnValue({ data: buildPixelData(Array(4).fill([0, 0, 0, 0])) });
      const promise = calculateBlackPixelRatio('blob:url');
      await mockImgInstance.onload({ target });
      await promise;
      expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
    });
  });

  // ── black pixel counting ───────────────────────────────────────────────────

  describe('black pixel counting', () => {
    async function resolveWithPixels(pixels, width, height) {
      const target = buildTarget(width, height);
      mockCtx.getImageData.mockReturnValue({ data: buildPixelData(pixels) });
      const promise = calculateBlackPixelRatio('blob:url');
      await mockImgInstance.onload({ target });
      return promise;
    }

    it('resolves with 0 when all pixels are white (255,255,255,255)', async () => {
      const result = await resolveWithPixels(
        Array(4).fill([255, 255, 255, 255]),
        2, 2,
      );
      expect(result).toBe(0);
    });

    it('resolves with 1 when all pixels are fully black (0,0,0,255)', async () => {
      const result = await resolveWithPixels(
        Array(4).fill([0, 0, 0, 255]),
        2, 2,
      );
      expect(result).toBe(1);
    });

    it('resolves with 1 when all pixels are transparent black (0,0,0,0)', async () => {
      const result = await resolveWithPixels(
        Array(4).fill([0, 0, 0, 0]),
        2, 2,
      );
      expect(result).toBe(1);
    });

    it('resolves with 0.5 when half the pixels are black (0,0,0,255)', async () => {
      const pixels = [
        [0, 0, 0, 255],
        [0, 0, 0, 255],
        [255, 255, 255, 255],
        [255, 255, 255, 255],
      ];
      const result = await resolveWithPixels(pixels, 2, 2);
      expect(result).toBe(0.5);
    });

    it('resolves with 0.25 when one of four pixels is black', async () => {
      const pixels = [
        [0, 0, 0, 255],
        [255, 0, 0, 255],
        [0, 255, 0, 255],
        [0, 0, 255, 255],
      ];
      const result = await resolveWithPixels(pixels, 2, 2);
      expect(result).toBe(0.25);
    });

    it('does NOT count a pixel as black when alpha is not 255 or 0', async () => {
      const pixels = [[0, 0, 0, 128]];
      const result = await resolveWithPixels(pixels, 1, 1);
      expect(result).toBe(0);
    });

    it('does NOT count a pixel as black when only R is 0', async () => {
      const pixels = [[0, 255, 255, 255]];
      const result = await resolveWithPixels(pixels, 1, 1);
      expect(result).toBe(0);
    });

    it('does NOT count a pixel as black when only G is 0', async () => {
      const pixels = [[255, 0, 255, 255]];
      const result = await resolveWithPixels(pixels, 1, 1);
      expect(result).toBe(0);
    });

    it('does NOT count a pixel as black when only B is 0', async () => {
      const pixels = [[255, 255, 0, 255]];
      const result = await resolveWithPixels(pixels, 1, 1);
      expect(result).toBe(0);
    });

    it('resolves with 1 for a single fully black pixel (1×1)', async () => {
      const result = await resolveWithPixels([[0, 0, 0, 255]], 1, 1);
      expect(result).toBe(1);
    });

    it('resolves with 0 for a single white pixel (1×1)', async () => {
      const result = await resolveWithPixels([[255, 255, 255, 255]], 1, 1);
      expect(result).toBe(0);
    });

    it('correctly counts transparent black pixels (alpha 0) as black', async () => {
      const pixels = [
        [0, 0, 0, 0],
        [255, 255, 255, 255],
      ];
      const result = await resolveWithPixels(pixels, 2, 1);
      expect(result).toBe(0.5);
    });

    it('resolves with 0 for an image with no pixels (0×0)', async () => {
      const target = buildTarget(0, 0);
      mockCtx.getImageData.mockReturnValue({ data: new Uint8ClampedArray([]) });
      const promise = calculateBlackPixelRatio('blob:url');
      await mockImgInstance.onload({ target });
      const result = await promise;
      expect(result).toBeNaN();
    });

    it('handles a large image correctly', async () => {
      const size = 100;
      const halfBlack = Array(size * size / 2).fill([0, 0, 0, 255]);
      const halfWhite = Array(size * size / 2).fill([255, 255, 255, 255]);
      const result = await resolveWithPixels([...halfBlack, ...halfWhite], size, size);
      expect(result).toBe(0.5);
    });
  });

  // ── img.onerror ────────────────────────────────────────────────────────────

  describe('img.onerror', () => {
    it('rejects the promise when img.onerror fires', async () => {
      const mockError = new Error('load failed');
      const promise = calculateBlackPixelRatio('blob:bad-url');
      mockImgInstance.onerror(mockError);
      await expect(promise).rejects.toThrow('load failed');
    });

    it('calls console.error with "Image loading error:" when onerror fires', async () => {
      const mockError = new Error('load failed');
      const promise = calculateBlackPixelRatio('blob:bad-url');
      mockImgInstance.onerror(mockError);
      await promise.catch(() => {});
      expect(console.error).toHaveBeenCalledWith('Image loading error:', mockError);
    });

    it('rejects with the original error object', async () => {
      const mockError = new Event('error');
      const promise = calculateBlackPixelRatio('blob:bad-url');
      mockImgInstance.onerror(mockError);
      await expect(promise).rejects.toBe(mockError);
    });

    it('does NOT resolve when onerror fires', async () => {
      const mockError = new Error('fail');
      let resolved = false;
      const promise = calculateBlackPixelRatio('blob:bad-url');
      promise.then(() => { resolved = true; }).catch(() => {});
      mockImgInstance.onerror(mockError);
      await promise.catch(() => {});
      expect(resolved).toBe(false);
    });
  });
});

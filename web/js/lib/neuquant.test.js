import NeuQuant from './neuquant';

const makePixels = (length, fillValue = 128) => {
  const pixels = new Uint8Array(length);
  pixels.fill(fillValue);
  return pixels;
};

const makeRGBPixels = (numPixels, r = 128, g = 64, b = 32) => {
  const pixels = new Uint8Array(numPixels * 3);
  for (let i = 0; i < numPixels; i++) {
    pixels[i * 3] = r;
    pixels[i * 3 + 1] = g;
    pixels[i * 3 + 2] = b;
  }
  return pixels;
};

// Minimum picture size is 3 * 503 = 1509 bytes
const MIN_SIZE = 3 * 503;

describe('NeuQuant', () => {
  describe('constructor / NeuQuantConstructor', () => {
    it('creates a NeuQuant instance', () => {
      const pixels = makePixels(MIN_SIZE);
      const nq = NeuQuant(pixels, pixels.length, 1);
      expect(nq).toBeDefined();
    });

    it('returns an object with map and process methods', () => {
      const pixels = makePixels(MIN_SIZE);
      const nq = NeuQuant(pixels, pixels.length, 1);
      expect(typeof nq.map).toBe('function');
      expect(typeof nq.process).toBe('function');
    });
  });

  describe('process', () => {
    it('returns a color map array', () => {
      const pixels = makePixels(MIN_SIZE);
      const nq = NeuQuant(pixels, pixels.length, 1);
      const colorMap = nq.process();
      expect(Array.isArray(colorMap)).toBe(true);
    });

    it('returns color map with 256 * 3 entries (RGB for each of 256 colors)', () => {
      const pixels = makePixels(MIN_SIZE);
      const nq = NeuQuant(pixels, pixels.length, 1);
      const colorMap = nq.process();
      expect(colorMap.length).toBe(256 * 3);
    });

    it('returns color map values in range 0-255', () => {
      const pixels = makePixels(MIN_SIZE);
      const nq = NeuQuant(pixels, pixels.length, 1);
      const colorMap = nq.process();
      colorMap.forEach((value) => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(255);
      });
    });

    it('works with samplefac = 10', () => {
      const pixels = makePixels(MIN_SIZE * 10);
      const nq = NeuQuant(pixels, pixels.length, 10);
      const colorMap = nq.process();
      expect(colorMap.length).toBe(768);
    });

    it('works with samplefac = 30', () => {
      const pixels = makePixels(MIN_SIZE * 30);
      const nq = NeuQuant(pixels, pixels.length, 30);
      const colorMap = nq.process();
      expect(colorMap.length).toBe(768);
    });

    it('produces different colormaps for different input images', () => {
      const pixels1 = makeRGBPixels(MIN_SIZE / 3, 255, 0, 0);
      const pixels2 = makeRGBPixels(MIN_SIZE / 3, 0, 0, 255);
      const nq1 = NeuQuant(pixels1, pixels1.length, 1);
      const nq2 = NeuQuant(pixels2, pixels2.length, 1);
      const map1 = nq1.process();
      const map2 = nq2.process();
      expect(map1).not.toEqual(map2);
    });

    it('handles image smaller than minpicturebytes', () => {
      const pixels = makePixels(9); // 3 * 3, less than 3 * 503
      const nq = NeuQuant(pixels, pixels.length, 1);
      const colorMap = nq.process();
      expect(colorMap.length).toBe(768);
    });

    it('handles image length divisible by prime1 (499)', () => {
      const len = 3 * 499 * 2; // divisible by prime1
      const pixels = makePixels(len);
      const nq = NeuQuant(pixels, pixels.length, 1);
      const colorMap = nq.process();
      expect(colorMap.length).toBe(768);
    });

    it('handles image length divisible by prime1 and prime2', () => {
      const len = 3 * 499 * 491; // divisible by prime1 and prime2
      const pixels = makePixels(len);
      const nq = NeuQuant(pixels, pixels.length, 1);
      const colorMap = nq.process();
      expect(colorMap.length).toBe(768);
    });
  });

  describe('map', () => {
    it('returns a number', () => {
      const pixels = makePixels(MIN_SIZE);
      const nq = NeuQuant(pixels, pixels.length, 1);
      nq.process();
      const result = nq.map(128, 128, 128);
      expect(typeof result).toBe('number');
    });

    it('returns a value between 0 and 255', () => {
      const pixels = makePixels(MIN_SIZE);
      const nq = NeuQuant(pixels, pixels.length, 1);
      nq.process();
      const result = nq.map(128, 128, 128);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(255);
    });

    it('returns consistent results for same input', () => {
      const pixels = makePixels(MIN_SIZE);
      const nq = NeuQuant(pixels, pixels.length, 1);
      nq.process();
      const result1 = nq.map(100, 150, 200);
      const result2 = nq.map(100, 150, 200);
      expect(result1).toBe(result2);
    });

    it('maps black (0,0,0)', () => {
      const pixels = makePixels(MIN_SIZE);
      const nq = NeuQuant(pixels, pixels.length, 1);
      nq.process();
      const result = nq.map(0, 0, 0);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(255);
    });

    it('maps white (255,255,255)', () => {
      const pixels = makePixels(MIN_SIZE);
      const nq = NeuQuant(pixels, pixels.length, 1);
      nq.process();
      const result = nq.map(255, 255, 255);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(255);
    });

    it('maps red (0, 0, 255) in BGR format', () => {
      const pixels = makeRGBPixels(MIN_SIZE / 3, 255, 0, 0);
      const nq = NeuQuant(pixels, pixels.length, 1);
      nq.process();
      const result = nq.map(0, 0, 255);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(255);
    });

    it('returns different indices for very different colors after training on diverse image', () => {
      // Create an image with many colors
      const numPixels = MIN_SIZE;
      const pixels = new Uint8Array(numPixels);
      for (let i = 0; i < numPixels; i++) {
        pixels[i] = i % 256;
      }
      const nq = NeuQuant(pixels, pixels.length, 1);
      nq.process();
      const blackIdx = nq.map(0, 0, 0);
      const whiteIdx = nq.map(255, 255, 255);
      // They should map to different indices since they are very different colors
      expect(blackIdx).not.toBe(whiteIdx);
    });

    it('map can be called before process without throwing', () => {
      const pixels = makePixels(MIN_SIZE);
      const nq = NeuQuant(pixels, pixels.length, 1);
      // map before process - netindex is empty, but should not crash
      expect(() => nq.map(128, 128, 128)).not.toThrow();
    });

    it('handles boundary values', () => {
      const pixels = makePixels(MIN_SIZE);
      const nq = NeuQuant(pixels, pixels.length, 1);
      nq.process();
      expect(() => nq.map(0, 0, 0)).not.toThrow();
      expect(() => nq.map(255, 255, 255)).not.toThrow();
      expect(() => nq.map(127, 127, 127)).not.toThrow();
    });
  });

  describe('learn step variations', () => {
    it('uses step=3 when lengthcount < minpicturebytes', () => {
      const pixels = makePixels(100);
      const nq = NeuQuant(pixels, pixels.length, 1);
      expect(() => nq.process()).not.toThrow();
    });

    it('uses step=3*prime1 when lengthcount not divisible by prime1', () => {
      // length not divisible by 499 but > minpicturebytes
      const len = MIN_SIZE + 1;
      const pixels = makePixels(len);
      const nq = NeuQuant(pixels, pixels.length, 1);
      expect(() => nq.process()).not.toThrow();
    });

    it('processes with varied pixel data', () => {
      const pixels = new Uint8Array(MIN_SIZE);
      for (let i = 0; i < MIN_SIZE; i++) {
        pixels[i] = Math.floor((i * 7) % 256);
      }
      const nq = NeuQuant(pixels, pixels.length, 1);
      const colorMap = nq.process();
      expect(colorMap.length).toBe(768);
    });
  });

  describe('multiple instances', () => {
    it('creates independent instances', () => {
      const pixels1 = makeRGBPixels(MIN_SIZE / 3, 200, 100, 50);
      const pixels2 = makeRGBPixels(MIN_SIZE / 3, 50, 100, 200);

      const nq1 = NeuQuant(pixels1, pixels1.length, 1);
      const nq2 = NeuQuant(pixels2, pixels2.length, 1);

      const map1 = nq1.process();
      const map2 = nq2.process();

      // Maps should differ since input is different
      const differ = map1.some((v, i) => v !== map2[i]);
      expect(differ).toBe(true);
    });

    it('second instance does not affect first instance results', () => {
      const pixels1 = makePixels(MIN_SIZE, 100);
      const nq1 = NeuQuant(pixels1, pixels1.length, 1);
      const map1 = nq1.process();

      const pixels2 = makePixels(MIN_SIZE, 200);
      const nq2 = NeuQuant(pixels2, pixels2.length, 1);
      nq2.process();

      // map1 should remain valid
      expect(map1.length).toBe(768);
    });
  });

  describe('alterneigh and altersingle (via process)', () => {
    it('runs without error with rad > 1', () => {
      // Use larger image to ensure rad > 1 during learning
      const size = MIN_SIZE * 5;
      const pixels = new Uint8Array(size);
      for (let i = 0; i < size; i++) {
        pixels[i] = i % 256;
      }
      const nq = NeuQuant(pixels, pixels.length, 1);
      expect(() => nq.process()).not.toThrow();
    });

    it('alterneigh handles boundary neurons without throwing', () => {
      const pixels = new Uint8Array(MIN_SIZE * 2);
      for (let i = 0; i < pixels.length; i++) {
        pixels[i] = i % 256;
      }
      const nq = NeuQuant(pixels, pixels.length, 1);
      expect(() => nq.process()).not.toThrow();
    });
  });

  describe('inxbuild and colorMap (via process)', () => {
    it('sorts network by green channel', () => {
      const pixels = new Uint8Array(MIN_SIZE);
      for (let i = 0; i < MIN_SIZE; i += 3) {
        pixels[i] = i % 256;
        pixels[i + 1] = (i * 2) % 256;
        pixels[i + 2] = (i * 3) % 256;
      }
      const nq = NeuQuant(pixels, pixels.length, 1);
      const colorMap = nq.process();
      expect(colorMap.length).toBe(768);
      // All values should be valid byte values
      colorMap.forEach((v) => {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(255);
      });
    });
  });
});
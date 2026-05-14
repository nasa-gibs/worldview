import GifStream from './gifstream';
import GifWriter from '../../lib/gifwriter';
import NeuQuant from '../../lib/neuquant';

jest.mock('../../lib/gifwriter');
jest.mock('../../lib/neuquant');

const mockEnqueue = jest.fn();
const mockClose = jest.fn();

const mockPaletteRGB = [255, 0, 0, 0, 255, 0, 0, 0, 255];

const mockNeuQuantInstance = {
  process: jest.fn(() => mockPaletteRGB),
  map: jest.fn(() => 0),
};
NeuQuant.mockImplementation(() => mockNeuQuantInstance);

const mockGifWriterInstance = { getReader: jest.fn() };
GifWriter.mockImplementation(() => mockGifWriterInstance);

function makeImageData(width = 2, height = 2) {
  const data = new Uint8ClampedArray(width * height * 4).fill(128);
  return { data, width, height };
}

function makeCtx(width = 2, height = 2) {
  return {
    clearRect: jest.fn(),
    getContext: jest.fn(),
    drawImage: jest.fn(),
    font: '',
    fillStyle: '',
    textAlign: '',
    textBaseline: '',
    strokeStyle: '',
    lineWidth: 0,
    strokeText: jest.fn(),
    fillText: jest.fn(),
    getImageData: jest.fn(() => makeImageData(width, height)),
  };
}

function baseOptions(overrides = {}) {
  return {
    gifWidth: 2,
    gifHeight: 2,
    fontColor: '#fff',
    fontSize: '12px',
    fontFamily: 'Arial',
    fontWeight: 'bold',
    text: '',
    textAlign: 'center',
    textBaseline: 'bottom',
    waterMark: null,
    waterMarkHeight: 0,
    waterMarkWidth: 0,
    waterMarkXCoordinate: 0,
    waterMarkYCoordinate: 0,
    loop: 0,
    images: [{ src: 'img1.png' }],
    progressCallback: jest.fn(),
    showFrameText: false,
    ...overrides,
  };
}

describe('GifStream', () => {
  let gs;

  beforeEach(() => {
    jest.clearAllMocks();
    gs = new GifStream();
  });

  describe('constructor', () => {
    it('initializes canvas and ctx to null', () => {
      expect(gs.canvas).toBeNull();
      expect(gs.ctx).toBeNull();
    });
  });

  describe('cancel', () => {
    it('sets cancelled to true when no promise exists', () => {
      gs.cancel();
      expect(gs.cancelled).toBe(true);
    });

    it('cancels the promise when one exists', () => {
      gs.promise = { cancel: jest.fn() };
      gs.cancel();
      expect(gs.cancelled).toBe(true);
      expect(gs.promise.cancel).toHaveBeenCalled();
    });
  });

  describe('createGIF', () => {
    beforeEach(() => {
      jest.spyOn(document, 'createElement').mockReturnValue({
        getContext: jest.fn(() => makeCtx()),
        width: 0,
        height: 0,
      });
    });

    it('throws when images array is empty', () => {
      expect(() => gs.createGIF(baseOptions({ images: [] }), jest.fn())).toThrow('No images found');
    });

    it('clears existing canvas rect when canvas already exists', () => {
      const mockClearRect = jest.fn();
      gs.canvas = { width: 2, height: 2 };
      gs.ctx = { clearRect: mockClearRect };
      jest.spyOn(gs, 'getImagePromise').mockReturnValue(Promise.resolve({}));
      gs.createGIF(baseOptions(), jest.fn());
      expect(mockClearRect).toHaveBeenCalledWith(0, 0, 2, 2);
    });

    it('calls getImagePromise for each image', () => {
      const spy = jest.spyOn(gs, 'getImagePromise').mockReturnValue(Promise.resolve({}));
      gs.createGIF(baseOptions({ images: [{ src: 'a.png' }, { src: 'b.png' }] }), jest.fn());
      expect(spy).toHaveBeenCalledTimes(2);
    });

    it('calls progressCallback with 0 on start', async () => {
      const progressCallback = jest.fn();
      const mockReader = {
        read: jest.fn().mockResolvedValue({ done: true, value: undefined }),
      };
      mockGifWriterInstance.getReader.mockReturnValue(mockReader);
      jest.spyOn(gs, 'getImagePromise').mockResolvedValue({});
      jest.spyOn(gs, 'getStream').mockReturnValue(mockGifWriterInstance);
      await new Promise((resolve) => {
        gs.createGIF(baseOptions({ progressCallback }), resolve);
      });
      expect(progressCallback).toHaveBeenCalledWith(0);
    });

    it('calls callback with blob when stream is done', async () => {
      const mockReader = {
        read: jest.fn()
          .mockResolvedValueOnce({ done: false, value: new Uint8Array([1, 2]) })
          .mockResolvedValueOnce({ done: true, value: undefined }),
      };
      mockGifWriterInstance.getReader.mockReturnValue(mockReader);
      jest.spyOn(gs, 'getImagePromise').mockResolvedValue({});
      jest.spyOn(gs, 'getStream').mockReturnValue(mockGifWriterInstance);

      jest.useFakeTimers();
      const resultPromise = new Promise((resolve) => {
        gs.createGIF(baseOptions({ images: [{ src: 'a.png' }] }), resolve);
      });
      await jest.runAllTimersAsync();
      const result = await resultPromise;
      jest.useRealTimers();

      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.error).toBe('');
    });

    it('calls returnCancel when cancelled mid-stream', async () => {
      const mockReader = {
        read: jest.fn().mockResolvedValue({ done: false, value: new Uint8Array([1]) }),
      };
      mockGifWriterInstance.getReader.mockReturnValue(mockReader);
      jest.spyOn(gs, 'getImagePromise').mockResolvedValue({});
      jest.spyOn(gs, 'getStream').mockReturnValue(mockGifWriterInstance);
      jest.useFakeTimers();
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const result = await new Promise((resolve) => {
        gs.createGIF(baseOptions(), (obj) => {
          if (obj.cancelled) resolve(obj);
        });
        gs.cancelled = true;
        jest.runAllTimers();
      });
      expect(result.cancelled).toBe(true);
      consoleSpy.mockRestore();
      jest.useRealTimers();
    });

    it('calls returnError when getImagePromise rejects', async () => {
      jest.spyOn(gs, 'getImagePromise').mockRejectedValue(new Error('load error'));
      const result = await new Promise((resolve) => {
        gs.createGIF(baseOptions(), (obj) => {
          if (obj.error) resolve(obj);
        });
      });
      expect(result.blob).toBeNull();
      expect(result.error).toBeDefined();
    });
  });

  describe('getImagePromise', () => {
    beforeEach(() => {
      gs.options = baseOptions();
    });

    it('resolves with img on load', async () => {
      const mockImg = {
        onload: null,
        onerror: null,
        src: '',
        width: 0,
        height: 0,
        text: '',
        delay: 0,
        crossOrigin: '',
      };
      jest.spyOn(global, 'Image').mockImplementation(() => mockImg);
      URL.revokeObjectURL = jest.fn();
      const promise = gs.getImagePromise({ src: 'test.png', text: 'hi', delay: 200 });
      mockImg.onload();
      const img = await promise;
      expect(img).toBe(mockImg);
    });

    it('rejects on error', async () => {
      const mockImg = {
        onload: null,
        onerror: null,
        src: '',
        width: 0,
        height: 0,
        text: '',
        delay: 0,
        crossOrigin: '',
      };
      jest.spyOn(global, 'Image').mockImplementation(() => mockImg);
      const promise = gs.getImagePromise({ src: 'bad.png' });
      mockImg.onerror(new Error('fail'));
      await expect(promise).rejects.toBeDefined();
    });
  });

  describe('addFrameDetails', () => {
    it('draws image to canvas and returns ctx', () => {
      const ctx = makeCtx();
      gs.options = baseOptions({ text: 'Hello', showFrameText: true });
      const img = { text: 'frame text', src: 'img.png' };
      const result = gs.addFrameDetails(ctx, img);
      expect(ctx.drawImage).toHaveBeenCalled();
      expect(result).toBe(ctx);
    });

    it('applies text when text exists', () => {
      const ctx = makeCtx();
      gs.options = baseOptions({ text: 'test text', showFrameText: false });
      const img = { text: null };
      gs.addFrameDetails(ctx, img);
      expect(ctx.fillText).toHaveBeenCalledWith('test text', expect.any(Number), expect.any(Number));
    });

    it('applies frameText when showFrameText is true and frameText exists', () => {
      const ctx = makeCtx();
      gs.options = baseOptions({ text: 'global', showFrameText: true });
      const img = { text: 'frame text' };
      gs.addFrameDetails(ctx, img);
      expect(ctx.fillText).toHaveBeenCalledWith('frame text', expect.any(Number), expect.any(Number));
    });

    it('applies stroke when options.stroke is set', () => {
      const ctx = makeCtx();
      gs.options = baseOptions({
        text: 'stroked',
        showFrameText: true,
        stroke: { color: 'black', pixels: 2 },
      });
      const img = { text: 'stroked' };
      gs.addFrameDetails(ctx, img);
      expect(ctx.strokeText).toHaveBeenCalled();
    });

    it('draws watermark when waterMark is set', () => {
      const ctx = makeCtx();
      const waterMark = {};
      gs.options = baseOptions({
        waterMark,
        waterMarkXCoordinate: 0,
        waterMarkYCoordinate: 0,
        waterMarkWidth: 10,
        waterMarkHeight: 10,
      });
      const img = { text: null };
      gs.addFrameDetails(ctx, img);
      expect(ctx.drawImage).toHaveBeenCalledTimes(2);
    });

    it('returns error string on exception', () => {
      const ctx = makeCtx();
      ctx.drawImage.mockImplementation(() => { throw new Error('draw error'); });
      gs.options = baseOptions();
      const img = { text: null };
      const result = gs.addFrameDetails(ctx, img);
      expect(typeof result).toBe('string');
      expect(result).toContain('Error');
    });

    it('uses textXCoordinate from options when provided', () => {
      const ctx = makeCtx();
      gs.options = baseOptions({ text: 'hi', textXCoordinate: 99 });
      const img = { text: null };
      gs.addFrameDetails(ctx, img);
      expect(ctx.fillText).toHaveBeenCalledWith('hi', 99, expect.any(Number));
    });

    it('uses textYCoordinate from options when provided', () => {
      const ctx = makeCtx();
      gs.options = baseOptions({ text: 'hi', textYCoordinate: 77 });
      const img = { text: null };
      gs.addFrameDetails(ctx, img);
      expect(ctx.fillText).toHaveBeenCalledWith('hi', expect.any(Number), 77);
    });

    it('uses textAlign right branch', () => {
      const ctx = makeCtx();
      gs.options = baseOptions({ text: 'hi', textAlign: 'right' });
      const img = { text: null };
      gs.addFrameDetails(ctx, img);
      expect(ctx.fillText).toHaveBeenCalled();
    });

    it('uses textAlign left branch', () => {
      const ctx = makeCtx();
      gs.options = baseOptions({ text: 'hi', textAlign: 'left' });
      const img = { text: null };
      gs.addFrameDetails(ctx, img);
      expect(ctx.fillText).toHaveBeenCalled();
    });

    it('uses textBaseline center branch', () => {
      const ctx = makeCtx();
      gs.options = baseOptions({ text: 'hi', textBaseline: 'center' });
      const img = { text: null };
      gs.addFrameDetails(ctx, img);
      expect(ctx.fillText).toHaveBeenCalled();
    });

    it('uses textBaseline top branch', () => {
      const ctx = makeCtx();
      gs.options = baseOptions({ text: 'hi', textBaseline: 'top' });
      const img = { text: null };
      gs.addFrameDetails(ctx, img);
      expect(ctx.fillText).toHaveBeenCalled();
    });

    it('does not call fillText when no text', () => {
      const ctx = makeCtx();
      gs.options = baseOptions({ text: '', showFrameText: false });
      const img = { text: null };
      gs.addFrameDetails(ctx, img);
      expect(ctx.fillText).not.toHaveBeenCalled();
    });
  });

  describe('getStream', () => {
    let ctx;
    let pullFn;
    let capturedController;

    beforeEach(() => {
      ctx = makeCtx();
      gs.options = baseOptions();

      global.ReadableStream = jest.fn(({ pull }) => {
        pullFn = pull;
        return { _pull: pull };
      });

      capturedController = { enqueue: mockEnqueue, close: mockClose };
    });

    it('returns a GifWriter instance', () => {
      const frames = [{ delay: 500 }];
      jest.spyOn(gs, 'addFrameDetails').mockReturnValue(ctx);
      gs.getStream(frames, ctx);
      expect(GifWriter).toHaveBeenCalled();
    });

    it('uses loop option when provided', () => {
      const frames = [{ delay: 100 }];
      gs.options = baseOptions({ loop: 2 });
      jest.spyOn(gs, 'addFrameDetails').mockReturnValue(ctx);
      gs.getStream(frames, ctx);
      expect(GifWriter).toHaveBeenCalledWith(
        expect.anything(), 2, 2, { loop: 2 },
      );
    });

    it('defaults loop to 0 when not set', () => {
      const frames = [{ delay: 100 }];
      gs.options = baseOptions({ loop: undefined });
      jest.spyOn(gs, 'addFrameDetails').mockReturnValue(ctx);
      gs.getStream(frames, ctx);
      expect(GifWriter).toHaveBeenCalledWith(
        expect.anything(), 2, 2, { loop: 0 },
      );
    });

    it('enqueues pixel data for a frame with a delay', () => {
      const frames = [{ delay: 200 }];
      jest.spyOn(gs, 'addFrameDetails').mockReturnValue(ctx);
      gs.getStream(frames, ctx);
      pullFn(capturedController);
      expect(mockEnqueue).toHaveBeenCalled();
    });

    it('uses default delay of 100 when frame.delay is falsy', () => {
      const frames = [{ delay: 0 }];
      jest.spyOn(gs, 'addFrameDetails').mockReturnValue(ctx);
      gs.getStream(frames, ctx);
      pullFn(capturedController);
      const enqueueArgs = mockEnqueue.mock.calls[0][0];
      expect(enqueueArgs[5].delay).toBe(100);
    });

    it('adds extraLastFrameDelay on the last frame', () => {
      const frames = [{ delay: 100 }];
      gs.options = baseOptions({ extraLastFrameDelay: 500 });
      jest.spyOn(gs, 'addFrameDetails').mockReturnValue(ctx);
      gs.getStream(frames, ctx);
      pullFn(capturedController);
      const enqueueArgs = mockEnqueue.mock.calls[0][0];
      expect(enqueueArgs[5].delay).toBe(10 + 50);
    });

    it('does not add extraLastFrameDelay to non-last frames', () => {
      const frames = [{ delay: 100 }, { delay: 100 }];
      gs.options = baseOptions({ extraLastFrameDelay: 500, images: [{ src: 'a' }, { src: 'b' }] });
      jest.spyOn(gs, 'addFrameDetails').mockReturnValue(ctx);
      gs.getStream(frames, ctx);
      pullFn(capturedController);
      const enqueueArgs = mockEnqueue.mock.calls[0][0];
      expect(enqueueArgs[5].delay).toBe(10);
    });

    it('maps pixels correctly', () => {
      const frames = [{ delay: 100 }];
      jest.spyOn(gs, 'addFrameDetails').mockReturnValue(ctx);
      gs.getStream(frames, ctx);
      pullFn(capturedController);
      expect(mockNeuQuantInstance.map).toHaveBeenCalled();
    });
  });
});

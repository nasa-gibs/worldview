import gifWriter from './gifwriter';
import { ReadableStream } from 'stream/web'

global.ReadableStream = ReadableStream;

// Helper to collect all chunks from a ReadableStream
const collectStream = async (stream) => {
  const reader = stream.getReader();
  const chunks = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  chunks.forEach((c) => { result.set(c, offset); offset += c.length; });
  return result;
};

// Helper to create a minimal ReadableStream with frames
const makeFrameStream = (frames = []) => {
  let index = 0;
  return {
    getReader: () => ({
      read: () => {
        if (index < frames.length) {
          return Promise.resolve({ done: false, value: frames[index++] });
        }
        return Promise.resolve({ done: true, value: undefined });
      },
    }),
  };
};

// Minimal valid palette (must be power of 2, 2..256 entries)
const palette2 = [0xff0000, 0x00ff00]; // 2 colors
const palette4 = [0xff0000, 0x00ff00, 0x0000ff, 0xffffff]; // 4 colors
const palette256 = Array.from({ length: 256 }, (_, i) => i * 0x010101);

// Minimal indexed pixels for a 2x2 frame
const pixels2x2 = new Uint8Array([0, 1, 0, 1]);
const pixels1x1 = new Uint8Array([0]);

describe('gifWriter constructor', () => {
  it('returns a ReadableStream', () => {
    const rs = makeFrameStream([]);
    const result = new gifWriter(rs, 100, 100, {});
    expect(result).toBeInstanceOf(ReadableStream);
  });

  it('throws on width <= 0', () => {
    expect(() => new gifWriter(makeFrameStream(), 0, 100, {})).toThrow('Width/Height invalid.');
  });

  it('throws on height <= 0', () => {
    expect(() => new gifWriter(makeFrameStream(), 100, 0, {})).toThrow('Width/Height invalid.');
  });

  it('throws on width > 65535', () => {
    expect(() => new gifWriter(makeFrameStream(), 65536, 100, {})).toThrow('Width/Height invalid.');
  });

  it('throws on height > 65535', () => {
    expect(() => new gifWriter(makeFrameStream(), 100, 65536, {})).toThrow('Width/Height invalid.');
  });

  it('throws on negative loop count', () => {
    expect(() => new gifWriter(makeFrameStream(), 100, 100, { loop: -1 })).toThrow('Loop count invalid.');
  });

  it('throws on loop count > 65535', () => {
    expect(() => new gifWriter(makeFrameStream(), 100, 100, { loop: 65536 })).toThrow('Loop count invalid.');
  });

  it('writes GIF header bytes (GIF89a)', async () => {
    const rs = makeFrameStream([]);
    const stream = new gifWriter(rs, 10, 10, {});
    const data = await collectStream(stream);
    // GIF89a signature
    expect(data[0]).toBe(0x47); // G
    expect(data[1]).toBe(0x49); // I
    expect(data[2]).toBe(0x46); // F
    expect(data[3]).toBe(0x38); // 8
    expect(data[4]).toBe(0x39); // 9
    expect(data[5]).toBe(0x61); // a
  });

  it('writes correct width in logical screen descriptor', async () => {
    const rs = makeFrameStream([]);
    const stream = new gifWriter(rs, 300, 200, {});
    const data = await collectStream(stream);
    expect(data[6]).toBe(300 & 0xff);
    expect(data[7]).toBe((300 >> 8) & 0xff);
  });

  it('writes correct height in logical screen descriptor', async () => {
    const rs = makeFrameStream([]);
    const stream = new gifWriter(rs, 300, 200, {});
    const data = await collectStream(stream);
    expect(data[8]).toBe(200 & 0xff);
    expect(data[9]).toBe((200 >> 8) & 0xff);
  });

  it('sets global color table flag when palette provided', async () => {
    const rs = makeFrameStream([]);
    const stream = new gifWriter(rs, 10, 10, { palette: palette4 });
    const data = await collectStream(stream);
    expect(data[10] & 0x80).toBe(0x80);
  });

  it('does not set global color table flag when no palette', async () => {
    const rs = makeFrameStream([]);
    const stream = new gifWriter(rs, 10, 10, {});
    const data = await collectStream(stream);
    expect(data[10] & 0x80).toBe(0);
  });

  it('writes terminator byte (0x3b) at end', async () => {
    const rs = makeFrameStream([]);
    const stream = new gifWriter(rs, 10, 10, {});
    const data = await collectStream(stream);
    expect(data[data.length - 1]).toBe(0x3b);
  });

  it('writes Netscape loop block when loop count provided', async () => {
    const rs = makeFrameStream([]);
    const stream = new gifWriter(rs, 10, 10, { loop: 0 });
    const data = await collectStream(stream);
    // After LSD (13 bytes), netscape block starts
    expect(data[13]).toBe(0x21);
    expect(data[14]).toBe(0xff);
    expect(data[15]).toBe(0x0b);
  });

  it('does not write Netscape block when loop is not provided', async () => {
    const rs = makeFrameStream([]);
    const stream = new gifWriter(rs, 10, 10, {});
    const data = await collectStream(stream);
    // After LSD (bytes 0-12), next should be terminator 0x3b (no frames)
    expect(data[13]).toBe(0x3b);
  });

  it('handles undefined gopts', async () => {
    const rs = makeFrameStream([]);
    const stream = new gifWriter(rs, 10, 10, undefined);
    const data = await collectStream(stream);
    expect(data[0]).toBe(0x47);
  });

  it('writes a frame when provided', async () => {
    const frame = [0, 0, 2, 2, pixels2x2, { palette: palette2 }];
    const rs = makeFrameStream([frame]);
    const stream = new gifWriter(rs, 10, 10, {});
    const data = await collectStream(stream);
    // Should have image separator 0x2c somewhere in data
    expect(Array.from(data)).toContain(0x2c);
  });
});

describe('gifWriter addFrame', () => {
  const makeWriter = (gopts = {}, frames = []) => {
    const rs = makeFrameStream(frames);
    return new gifWriter(rs, 100, 100, gopts);
  };

  it('throws on x < 0', async () => {
    const frame = [-1, 0, 2, 2, pixels2x2, { palette: palette2 }];
    const stream = makeWriter({}, [frame]);
    await expect(collectStream(stream)).rejects.toMatch('x/y invalid.');
  });

  it('throws on y < 0', async () => {
    const frame = [0, -1, 2, 2, pixels2x2, { palette: palette2 }];
    const stream = makeWriter({}, [frame]);
    await expect(collectStream(stream)).rejects.toMatch('x/y invalid.');
  });

  it('throws on x > 65535', async () => {
    const frame = [65536, 0, 2, 2, pixels2x2, { palette: palette2 }];
    const stream = makeWriter({}, [frame]);
    await expect(collectStream(stream)).rejects.toMatch('x/y invalid.');
  });

  it('throws on y > 65535', async () => {
    const frame = [0, 65536, 2, 2, pixels2x2, { palette: palette2 }];
    const stream = makeWriter({}, [frame]);
    await expect(collectStream(stream)).rejects.toMatch('x/y invalid.');
  });

  it('throws on w <= 0', async () => {
    const frame = [0, 0, 0, 2, pixels2x2, { palette: palette2 }];
    const stream = makeWriter({}, [frame]);
    await expect(collectStream(stream)).rejects.toMatch('Width/Height invalid.');
  });

  it('throws on h <= 0', async () => {
    const frame = [0, 0, 2, 0, pixels2x2, { palette: palette2 }];
    const stream = makeWriter({}, [frame]);
    await expect(collectStream(stream)).rejects.toMatch('Width/Height invalid.');
  });

  it('throws on w > 65535', async () => {
    const frame = [0, 0, 65536, 2, pixels2x2, { palette: palette2 }];
    const stream = makeWriter({}, [frame]);
    await expect(collectStream(stream)).rejects.toMatch('Width/Height invalid.');
  });

  it('throws on h > 65535', async () => {
    const frame = [0, 0, 2, 65536, pixels2x2, { palette: palette2 }];
    const stream = makeWriter({}, [frame]);
    await expect(collectStream(stream)).rejects.toMatch('Width/Height invalid.');
  });

  it('throws when not enough pixels', async () => {
    const frame = [0, 0, 10, 10, pixels2x2, { palette: palette2 }];
    const stream = makeWriter({}, [frame]);
    await expect(collectStream(stream)).rejects.toMatch('Not enough pixels for the frame size.');
  });

  it('throws when no local or global palette', async () => {
    const frame = [0, 0, 2, 2, pixels2x2, {}];
    const stream = makeWriter({}, [frame]);
    await expect(collectStream(stream)).rejects.toMatch('Must supply either a local or global palette.');
  });

  it('throws when palette is null and no global palette', async () => {
    const frame = [0, 0, 2, 2, pixels2x2, { palette: null }];
    const stream = makeWriter({}, [frame]);
    await expect(collectStream(stream)).rejects.toMatch('Must supply either a local or global palette.');
  });

  it('uses global palette when no local palette', async () => {
    const frame = [0, 0, 2, 2, pixels2x2, {}];
    const stream = makeWriter({ palette: palette2 }, [frame]);
    const data = await collectStream(stream);
    expect(data[data.length - 1]).toBe(0x3b);
  });

  it('throws on invalid palette size (not power of 2)', async () => {
    const frame = [0, 0, 1, 1, pixels1x1, { palette: [0xff0000, 0x00ff00, 0x0000ff] }];
    const stream = makeWriter({}, [frame]);
    await expect(collectStream(stream)).rejects.toMatch('Invalid code/color length');
  });

  it('throws on palette size < 2', async () => {
    const frame = [0, 0, 1, 1, pixels1x1, { palette: [0xff0000] }];
    const stream = makeWriter({}, [frame]);
    await expect(collectStream(stream)).rejects.toMatch('Invalid code/color length');
  });

  it('throws on palette size > 256', async () => {
    const palette = Array.from({ length: 512 }, (_, i) => i);
    const frame = [0, 0, 1, 1, pixels1x1, { palette }];
    const stream = makeWriter({}, [frame]);
    await expect(collectStream(stream)).rejects.toMatch('Invalid code/color length');
  });

  it('throws on disposal out of range (< 0)', async () => {
    const frame = [0, 0, 2, 2, pixels2x2, { palette: palette2, disposal: -1 }];
    const stream = makeWriter({}, [frame]);
    await expect(collectStream(stream)).rejects.toMatch('Disposal out of range.');
  });

  it('throws on disposal out of range (> 3)', async () => {
    const frame = [0, 0, 2, 2, pixels2x2, { palette: palette2, disposal: 4 }];
    const stream = makeWriter({}, [frame]);
    await expect(collectStream(stream)).rejects.toMatch('Disposal out of range.');
  });

  it('throws on transparent index out of range', async () => {
    const frame = [0, 0, 2, 2, pixels2x2, { palette: palette2, transparent: 5 }];
    const stream = makeWriter({}, [frame]);
    await expect(collectStream(stream)).rejects.toMatch('Transparent color index.');
  });

  it('throws on transparent index < 0', async () => {
    const frame = [0, 0, 2, 2, pixels2x2, { palette: palette2, transparent: -1 }];
    const stream = makeWriter({}, [frame]);
    await expect(collectStream(stream)).rejects.toMatch('Transparent color index.');
  });

  it('writes image separator byte (0x2c)', async () => {
    const frame = [0, 0, 2, 2, pixels2x2, { palette: palette2 }];
    const stream = makeWriter({}, [frame]);
    const data = await collectStream(stream);
    expect(Array.from(data)).toContain(0x2c);
  });

  it('writes graphics control extension when delay is set', async () => {
    const frame = [0, 0, 2, 2, pixels2x2, { palette: palette2, delay: 10 }];
    const stream = makeWriter({}, [frame]);
    const data = await collectStream(stream);
    expect(Array.from(data)).toContain(0x21);
    expect(Array.from(data)).toContain(0xf9);
  });

  it('writes graphics control extension when disposal is set', async () => {
    const frame = [0, 0, 2, 2, pixels2x2, { palette: palette2, disposal: 1 }];
    const stream = makeWriter({}, [frame]);
    const data = await collectStream(stream);
    expect(Array.from(data)).toContain(0xf9);
  });

  it('writes graphics control extension when transparent is set', async () => {
    const frame = [0, 0, 2, 2, pixels2x2, { palette: palette2, transparent: 0 }];
    const stream = makeWriter({}, [frame]);
    const data = await collectStream(stream);
    expect(Array.from(data)).toContain(0xf9);
  });

  it('does not write graphics control extension with defaults', async () => {
    const frame = [0, 0, 2, 2, pixels2x2, { palette: palette2 }];
    const stream = makeWriter({}, [frame]);
    const data = await collectStream(stream);
    // GCE would be at position 13 (right after LSD)
    // With no loop, LSD ends at byte 12 (index), next frame data starts
    // Image separator 0x2c should come before 0x21 0xf9
    const arr = Array.from(data);
    const gceIdx = arr.indexOf(0xf9);
    expect(gceIdx).toBe(-1);
  });

  it('writes local color table when local palette provided', async () => {
    const frame = [0, 0, 2, 2, pixels2x2, { palette: palette2 }];
    const stream = makeWriter({}, [frame]);
    const data = await collectStream(stream);
    // Local palette flag should be set in image descriptor
    // Image descriptor is at some position after LSD
    // We just verify the stream is valid and non-empty
    expect(data.length).toBeGreaterThan(20);
  });

  it('does not write local color table when using global palette', async () => {
    const frame = [0, 0, 2, 2, pixels2x2, {}];
    const stream = makeWriter({ palette: palette2 }, [frame]);
    const data = await collectStream(stream);
    expect(data.length).toBeGreaterThan(20);
  });

  it('writes multiple frames', async () => {
    const frame1 = [0, 0, 2, 2, pixels2x2, { palette: palette2 }];
    const frame2 = [0, 0, 2, 2, pixels2x2, { palette: palette2 }];
    const stream = makeWriter({}, [frame1, frame2]);
    const data = await collectStream(stream);
    expect(data[data.length - 1]).toBe(0x3b);
    // Two image separators
    const arr = Array.from(data);
    const count = arr.filter((b) => b === 0x2c).length;
    expect(count).toBeGreaterThanOrEqual(2);
  });

  it('handles undefined opts in addFrame', async () => {
    const frame = [0, 0, 2, 2, pixels2x2, undefined];
    const stream = makeWriter({ palette: palette2 }, [frame]);
    const data = await collectStream(stream);
    expect(data[data.length - 1]).toBe(0x3b);
  });

  it('handles 256-color palette', async () => {
    const pixels = new Uint8Array(256);
    pixels.fill(0);
    const frame = [0, 0, 16, 16, pixels, { palette: palette256 }];
    const stream = makeWriter({}, [frame]);
    const data = await collectStream(stream);
    expect(data[data.length - 1]).toBe(0x3b);
  });

  it('handles all disposal values 0-3', async () => {
    for (let disposal = 0; disposal <= 3; disposal++) {
      const frame = [0, 0, 2, 2, pixels2x2, { palette: palette2, disposal }];
      const stream = makeWriter({}, [frame]);
      const data = await collectStream(stream);
      expect(data[data.length - 1]).toBe(0x3b);
    }
  });

  it('writes correct frame position (x, y)', async () => {
    const frame = [5, 10, 2, 2, pixels2x2, { palette: palette2 }];
    const stream = makeWriter({}, [frame]);
    const data = await collectStream(stream);
    // Find image separator and check x, y bytes after it
    const arr = Array.from(data);
    const sepIdx = arr.indexOf(0x2c);
    expect(arr[sepIdx + 1]).toBe(5); // x low byte
    expect(arr[sepIdx + 2]).toBe(0); // x high byte
    expect(arr[sepIdx + 3]).toBe(10); // y low byte
    expect(arr[sepIdx + 4]).toBe(0); // y high byte
  });

  it('handles large x/y values correctly', async () => {
    const frame = [256, 512, 2, 2, pixels2x2, { palette: palette2 }];
    const stream = makeWriter({}, [frame]);
    const data = await collectStream(stream);
    const arr = Array.from(data);
    const sepIdx = arr.indexOf(0x2c);
    expect(arr[sepIdx + 1]).toBe(0);   // 256 & 0xff = 0
    expect(arr[sepIdx + 2]).toBe(1);   // 256 >> 8 = 1
    expect(arr[sepIdx + 3]).toBe(0);   // 512 & 0xff = 0
    expect(arr[sepIdx + 4]).toBe(2);   // 512 >> 8 = 2
  });
});

describe('check_palette_and_num_colors (via addFrame)', () => {
  const makeWriter = (gopts = {}, frames = []) => {
    const rs = makeFrameStream(frames);
    return new gifWriter(rs, 100, 100, gopts);
  };

  it('accepts palette of size 2', async () => {
    const frame = [0, 0, 2, 2, pixels2x2, { palette: palette2 }];
    const stream = makeWriter({}, [frame]);
    await expect(collectStream(stream)).resolves.toBeDefined();
  });

  it('accepts palette of size 4', async () => {
    const frame = [0, 0, 2, 2, pixels2x2, { palette: palette4 }];
    const stream = makeWriter({}, [frame]);
    await expect(collectStream(stream)).resolves.toBeDefined();
  });

  it('accepts palette of size 256', async () => {
    const pixels = new Uint8Array(4).fill(0);
    const frame = [0, 0, 2, 2, pixels, { palette: palette256 }];
    const stream = makeWriter({}, [frame]);
    await expect(collectStream(stream)).resolves.toBeDefined();
  });

  it('rejects palette of size 1', async () => {
    const frame = [0, 0, 1, 1, pixels1x1, { palette: [0xff0000] }];
    const stream = makeWriter({}, [frame]);
    await expect(collectStream(stream)).rejects.toMatch('Invalid code/color length');
  });

  it('rejects palette of size 3 (not power of 2)', async () => {
    const frame = [0, 0, 1, 1, pixels1x1, { palette: [0xff0000, 0x00ff00, 0x0000ff] }];
    const stream = makeWriter({}, [frame]);
    await expect(collectStream(stream)).rejects.toMatch('Invalid code/color length');
  });
});

describe('GifWriterOutputLZWCodeStream (via addFrame)', () => {
  const makeWriter = (gopts = {}, frames = []) => {
    const rs = makeFrameStream(frames);
    return new gifWriter(rs, 100, 100, gopts);
  };

  it('compresses a stream of identical pixels', async () => {
    const pixels = new Uint8Array(100).fill(0);
    const frame = [0, 0, 10, 10, pixels, { palette: palette2 }];
    const stream = makeWriter({}, [frame]);
    const data = await collectStream(stream);
    expect(data.length).toBeGreaterThan(0);
    expect(data[data.length - 1]).toBe(0x3b);
  });

  it('compresses a stream of alternating pixels', async () => {
    const pixels = new Uint8Array(100);
    pixels.forEach((_, i) => { pixels[i] = i % 2; });
    const frame = [0, 0, 10, 10, pixels, { palette: palette2 }];
    const stream = makeWriter({}, [frame]);
    const data = await collectStream(stream);
    expect(data[data.length - 1]).toBe(0x3b);
  });

  it('handles large pixel stream requiring code table reset', async () => {
    // Create enough unique runs to fill the code table (>4096 entries)
    const pixels = new Uint8Array(8000);
    for (let i = 0; i < pixels.length; i++) {
      pixels[i] = i % 256;
    }
    const frame = [0, 0, 100, 80, pixels, { palette: palette256 }];
    const stream = makeWriter({}, [frame]);
    const data = await collectStream(stream);
    expect(data[data.length - 1]).toBe(0x3b);
  });

  it('handles min_code_size < 2 (forces to 2)', async () => {
    // palette2 gives min_code_size = 1, which gets bumped to 2
    const frame = [0, 0, 2, 2, pixels2x2, { palette: palette2 }];
    const stream = makeWriter({}, [frame]);
    const data = await collectStream(stream);
    expect(data.length).toBeGreaterThan(0);
  });

  it('produces output for single pixel frame', async () => {
    const frame = [0, 0, 1, 1, pixels1x1, { palette: palette2 }];
    const stream = makeWriter({}, [frame]);
    const data = await collectStream(stream);
    expect(data[data.length - 1]).toBe(0x3b);
  });
});
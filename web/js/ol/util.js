/**
 * @param {Canvas} canvas - Canvas to process
 * @param {Object} lookup - Color lookup object
 * @returns {void}
 * @description Processes the canvas to swap colors based on the provided lookup object.
 */
function processImage(canvas, lookup) {
  // If pixels were processed already, we skip this transformation
  const octets = canvas.width * canvas.height * 4;
  const context = canvas.getContext('2d');
  const imageData = context.getImageData(
    0,
    0,
    canvas.width,
    canvas.height,
  );

  // Process each pixel to color-swap single color palettes
  const pixels = imageData.data;
  const colorLookupObj = structuredClone(lookup);
  const defaultColor = Object.keys(lookup)[0];
  const paletteColor = lookup[Object.keys(lookup)[0]];

  // Load black/transparent into the lookup object
  colorLookupObj['0,0,0,0'] = {
    r: 0,
    g: 0,
    b: 0,
    a: 0,
  };

  for (let i = 0; i < octets; i += 4) {
    const pixelColor = `${pixels[i + 0]},${pixels[i + 1]},${pixels[i + 2]},${pixels[i + 3]}`;

    if (!colorLookupObj[pixelColor]) {
      // Handle non-transparent pixels that do not match the palette exactly
      const defaultColorArr = defaultColor.split(',');
      const pixelColorArr = pixelColor.split(',');

      // Determine difference of pixel from default to replicate anti-aliasing
      const rDifference = pixelColorArr[0] - defaultColorArr[0];
      const gDifference = pixelColorArr[1] - defaultColorArr[1];
      const bDifference = pixelColorArr[2] - defaultColorArr[2];
      const alphaValue = pixelColorArr[3];

      // Store the resulting pair of pixel color & anti-aliased adjusted color
      colorLookupObj[pixelColor] = {
        r: paletteColor.r + rDifference,
        g: paletteColor.g + gDifference,
        b: paletteColor.b + bDifference,
        a: alphaValue,
      };
    }

    // set the pixel color
    pixels[i + 0] = colorLookupObj[pixelColor].r;
    pixels[i + 1] = colorLookupObj[pixelColor].g;
    pixels[i + 2] = colorLookupObj[pixelColor].b;
    pixels[i + 3] = colorLookupObj[pixelColor].a;
  }
  context.putImageData(imageData, 0, 0);
}

/**
 * Extract indexed data for palette-based PNGs
 * @param {Uint8ClampedArray} pixels - RGBA pixel data from canvas
 * @param {Uint8Array} palette - PLTE data
 * @param {Number} width - Image width
 * @param {Number} height - Image height
 * @param {Uint8Array} alphaValues - tRNS data (optional)
 * @returns {Uint8Array} - Array of palette indices
 */
const extractIndexedData = (pixels, palette, width, height, alphaValues) => {
  // Create a map of RGB values to palette indices for lookup
  const paletteMap = new Map();
  const indexedData = new Uint8Array(width * height);

  // Build palette map
  for (let i = 0; i < palette.length; i += 3) {
    const r = palette[i];
    const g = palette[i + 1];
    const b = palette[i + 2];
    // Alpha is 255 unless specified in tRNS
    const a = alphaValues && (i / 3) < alphaValues.length ? alphaValues[i / 3] : 255;
    const key = `${r},${g},${b},${a}`;
    paletteMap.set(key, i / 3);
  }

  // Map each pixel to its palette index
  for (let i = 0, j = 0; i < pixels.length; i += 4, j += 1) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const a = pixels[i + 3];

    // Try to find this color in the palette
    const key = `${r},${g},${b},${a}`;

    if (paletteMap.has(key)) {
      indexedData[j] = paletteMap.get(key);
    } else if (a === 0) {
      // Fully transparent pixel - use index 0
      indexedData[j] = 0;
    } else {
      // Find closest color in palette
      let bestIndex = 0;
      let bestDiff = Infinity;

      for (let p = 0; p < palette.length; p += 3) {
        const pr = palette[p];
        const pg = palette[p + 1];
        const pb = palette[p + 2];
        const pa = alphaValues && p / 3 < alphaValues.length ? alphaValues[p / 3] : 255;

        // Skip transparent entries when looking for opaque colors
        if (!(a > 0 && pa === 0)) {
          const diff = Math.abs(r - pr) + Math.abs(g - pg) + Math.abs(b - pb) + Math.abs(a - pa);

          if (diff < bestDiff) {
            bestDiff = diff;
            bestIndex = p / 3;
          }
        }
      }

      indexedData[j] = bestIndex;
    }
  }

  return indexedData;
};

/**
 * Use Canvas to decode the PNG pixel data
 * @param {ArrayBuffer} buffer - PNG data
 * @returns {Promise<Object>} - Canvas and pixel data
 */
const getPixelDataFromCanvas = async (buffer) => {
  const blob = new Blob([buffer], { type: 'image/png' });
  const blobUrl = URL.createObjectURL(blob);

  try {
    // Create an image and wait for it to load
    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = (err) => reject(new Error(`Failed to load PNG: ${err}`));
      image.src = blobUrl;
    });

    // Draw the image to canvas
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    // Get pixel data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    return { pixels: imageData.data, canvas };
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
};

/**
 * PNG Chunk Parser - Reads PNG binary format and extracts key chunks
 * @param {ArrayBuffer} buffer - Raw PNG data as ArrayBuffer
 * @returns {Promise<Object>} Decoded PNG information
 */
const parsePNG = async (buffer) => {
  // Function to read a PNG chunk
  const readChunk = (dataView, offset) => {
    const length = dataView.getUint32(offset, false); // Big-endian
    const type = String.fromCharCode(
      dataView.getUint8(offset + 4),
      dataView.getUint8(offset + 5),
      dataView.getUint8(offset + 6),
      dataView.getUint8(offset + 7),
    );

    // Extract chunk data
    const data = new Uint8Array(buffer, offset + 8, length);

    // Calculate next chunk position (length + type + data + CRC)
    const nextChunkOffset = offset + 8 + length + 4;

    return {
      type,
      data,
      length,
      nextOffset: nextChunkOffset,
    };
  };

  // Verify PNG signature
  const dataView = new DataView(buffer);
  const signature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];

  if (signature.some((val, i) => dataView.getUint8(i) !== val)) throw new Error('Invalid PNG signature');

  // Start parsing chunks after signature
  let offset = 8;
  let ihdrChunk = null;
  let plteChunk = null;
  let trnsChunk = null;

  // Read chunks until we find what we need or reach the end
  while (offset < buffer.byteLength) {
    const chunk = readChunk(dataView, offset);

    if (chunk.type === 'IHDR') {
      ihdrChunk = chunk;
    } else if (chunk.type === 'PLTE') {
      plteChunk = chunk;
    } else if (chunk.type === 'tRNS') {
      trnsChunk = chunk;
    } else if (chunk.type === 'IEND') {
      break;
    }

    offset = chunk.nextOffset;
  }

  // We need IHDR to proceed
  if (!ihdrChunk) throw new Error('Missing IHDR chunk');

  // Parse IHDR data
  const ihdrView = new DataView(ihdrChunk.data.buffer, ihdrChunk.data.byteOffset, ihdrChunk.data.byteLength);
  const width = ihdrView.getUint32(0, false);
  const height = ihdrView.getUint32(4, false);
  const bitDepth = ihdrView.getUint8(8);
  const colorType = ihdrView.getUint8(9);

  // Get actual pixel data using canvas (more reliable than trying to implement decompression)
  const { pixels, canvas } = await getPixelDataFromCanvas(buffer);

  // Process palette if available
  let palette = null;
  let alphaValues = null;
  const isIndexed = colorType === 3; // Color type 3 is indexed color

  if (plteChunk) palette = new Uint8Array(plteChunk.data);

  // Process transparency if available
  // For indexed color, tRNS contains alpha values for palette entries
  if (trnsChunk && plteChunk) alphaValues = new Uint8Array(trnsChunk.data);

  // Create indexed data if this is an indexed color PNG
  let indexedData = null;
  // For true indexed PNGs, the pixel data is already indices. We'll need to extract it from the canvas data
  if (isIndexed && palette) indexedData = extractIndexedData(pixels, palette, width, height, alphaValues);

  const tabsObj = {
    PLTE: palette,
    tRNS: alphaValues || undefined,
  };
  const tabs = palette ? tabsObj : undefined;

  return {
    width,
    height,
    bitDepth,
    colorType,
    isIndexed,
    data: isIndexed ? indexedData : new Uint8Array(pixels.buffer),
    rgba: new Uint8Array(pixels.buffer),
    tabs,
    canvas,
  };
};

const decodePNG = async (buffer) => parsePNG(buffer);

export {
  decodePNG,
  extractIndexedData,
  getPixelDataFromCanvas,
  processImage,
};

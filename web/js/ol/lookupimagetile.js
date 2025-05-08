/* eslint-disable func-names */
import OlImageTile from 'ol/ImageTile';
import OlTileState from 'ol/TileState';

/**
 * Extract indexed data for palette-based PNGs
 * @param {Uint8ClampedArray} pixels - RGBA pixel data from canvas
 * @param {Uint8Array} palette - PLTE data
 * @param {Uint8Array} alphaValues - tRNS data (optional)
 * @param {Number} width - Image width
 * @param {Number} height - Image height
 * @returns {Uint8Array} - Array of palette indices
 */
function extractIndexedData(pixels, palette, alphaValues, width, height) {
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
}

/**
 * Use Canvas to decode the PNG pixel data
 * @param {ArrayBuffer} buffer - PNG data
 * @returns {Promise<Object>} - Canvas and pixel data
 */
async function getPixelDataFromCanvas(buffer) {
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
}

/**
 * PNG Chunk Parser - Reads PNG binary format and extracts key chunks
 * @param {ArrayBuffer} buffer - Raw PNG data as ArrayBuffer
 * @returns {Promise<Object>} Decoded PNG information
 */
async function parsePNG(buffer) {
  // Function to read a PNG chunk
  function readChunk(dataView, offset) {
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
  }

  // Verify PNG signature
  const dataView = new DataView(buffer);
  const signature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];

  for (let i = 0; i < signature.length; i += 1) {
    if (dataView.getUint8(i) !== signature[i]) throw new Error('Invalid PNG signature');
  }

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

  if (plteChunk) {
    palette = new Uint8Array(plteChunk.data);
  }

  // Process transparency if available
  if (trnsChunk && plteChunk) {
    // For indexed color, tRNS contains alpha values for palette entries
    alphaValues = new Uint8Array(trnsChunk.data);
  }

  // Create indexed data if this is an indexed color PNG
  let indexedData = null;
  if (isIndexed && palette) {
    // For true indexed PNGs, the pixel data is already indices
    // We'll need to extract it from the canvas data
    indexedData = extractIndexedData(pixels, palette, alphaValues, width, height);
  }

  return {
    width,
    height,
    bitDepth,
    colorType,
    isIndexed,
    data: isIndexed ? indexedData : new Uint8Array(pixels.buffer),
    rgba: new Uint8Array(pixels.buffer),
    tabs: palette ? {
      PLTE: palette,
      tRNS: alphaValues || undefined,
    } : undefined,
    canvas,
  };
}

/**
 * Replacement for decodePNG that properly parses PNG chunks
 */
async function decodePNG(buffer) {
  return parsePNG(buffer);
}

/**
   * @method getPixelColorsToDisplay
   * @static
   * @param obj {object} - The Colormap for this product
   *
   * @returns {object} Colormap containing only active colors
   */
function getPixelColorsToDisplay(obj) {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (!(value.r === 0 && value.g === 0 && value.b === 0 && value.a === 0)) {
      acc[key] = value;
    }
    return acc;
  }, {});
}

function getColormap(rawColormap) {
  // Calculate number of colors in palette (each color is 3 bytes)
  const numColors = rawColormap.length / 3;
  // Create RGBA array (4 bytes per color)
  const colorMapArr = new Uint8Array(numColors * 4);

  // Fill with colors from PLTE
  for (let i = 0; i < numColors; i += 1) {
    colorMapArr[i * 4] = rawColormap[i * 3]; // R
    colorMapArr[(i * 4) + 1] = rawColormap[(i * 3) + 1]; // G
    colorMapArr[(i * 4) + 2] = rawColormap[(i * 3) + 2]; // B
    colorMapArr[(i * 4) + 3] = 255; // A
  }

  return colorMapArr;
}

class LookupImageTile extends OlImageTile {
  constructor(lookup, tileCoord, state, src, crossOrigin, tileLoadFunction, sourceOptions) {
    super(tileCoord, state, src, crossOrigin, tileLoadFunction, sourceOptions);
    this.lookup_ = lookup;
    this.canvas_ = null;
    // Store custom tileLoadFunction
    this.customTileLoadFunction_ = tileLoadFunction;
  }
}
LookupImageTile.prototype.getImage = function () {
  return this.canvas_;
};
LookupImageTile.prototype.load = async function () {
  if (this.state === OlTileState.IDLE) {
    this.state = OlTileState.LOADING;
    const that = this;
    this.changed();
    let imageProcessed = false;

    const onImageLoad = function() {
      that.canvas_ = document.createElement('canvas');
      that.canvas_.width = that.image_.width;
      that.canvas_.height = that.image_.height;
      const g = that.canvas_.getContext('2d');
      g.drawImage(that.image_, 0, 0);
      const octets = that.canvas_.width * that.canvas_.height * 4;

      // If pixels were processed already, we skip this transformation
      if (!imageProcessed) {
        const imageData = g.getImageData(
          0,
          0,
          that.canvas_.width,
          that.canvas_.height,
        );

        // Process each pixel to color-swap single color palettes
        const pixels = imageData.data;
        const colorLookupObj = structuredClone(that.lookup_);
        const defaultColor = Object.keys(that.lookup_)[0];
        const paletteColor = that.lookup_[Object.keys(that.lookup_)[0]];

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
        g.putImageData(imageData, 0, 0);
      }

      // uses the tileload function passed from layerbuilder
      if (that.customTileLoadFunction_) {
        that.customTileLoadFunction_(that, that.src_);
      }

      that.state = OlTileState.LOADED;
      that.changed();
      that.image_.removeEventListener('load', onImageLoad);
    };

    // Process images with category palettes, not continuous palettes
    const lookupCount = Object.keys(this.lookup_).length;
    if (lookupCount > 1 && lookupCount < 25) {
      imageProcessed = true;
      const pixelsToDisplay = getPixelColorsToDisplay(this.lookup_);
      try {
        const res = await fetch(this.src_);
        if (!res.ok) throw new Error(`Failed to fetch image: ${res.status} ${res.statusText}`);
        const buffer = await res.arrayBuffer();
        // decode the buffer PNG file
        const decodedPNG = await decodePNG(buffer);
        const { width, height, data } = decodedPNG;

        that.canvas_ = document.createElement('canvas');
        that.canvas_.width = width;
        that.canvas_.height = height;
        const ctx = that.canvas_.getContext('2d');
        const blankImageData = ctx.createImageData(width, height);
        const outputData = blankImageData.data;

        // Extract the pixel data
        const pixelData = data;

        if (decodedPNG?.tabs?.PLTE) {
          // Extract the colormap values
          const colorMapArr = getColormap(decodedPNG.tabs.PLTE);

          // Iterate through pixelData, setting colors directly on imageData
          for (let i = 0; i < pixelData.length; i += 1) {
            const outputIndex = i * 4;
            // Make sure the index is valid
            const index = Math.min(pixelData[i], (colorMapArr.length / 4) - 1);
            const lookupIndex = index * 4;

            // Determine desired RGBA for this pixel
            const r = colorMapArr[lookupIndex];
            const g = colorMapArr[lookupIndex + 1];
            const b = colorMapArr[lookupIndex + 2];
            const a = colorMapArr[lookupIndex + 3];

            // Concatenate to 'r,g,b,a' string & check if that color is in pixelsToDisplay
            const rgbaStr = `${r},${g},${b},${a}`;
            const drawThisColor = pixelsToDisplay[rgbaStr];

            // If the intended color exists in pixelsToDisplay obj, draw that color, otherwise transparent
            if (drawThisColor !== undefined) {
              outputData[outputIndex] = r;
              outputData[outputIndex + 1] = g;
              outputData[outputIndex + 2] = b;
              outputData[outputIndex + 3] = a;
            } else {
              outputData[outputIndex] = 0;
              outputData[outputIndex + 1] = 0;
              outputData[outputIndex + 2] = 0;
              outputData[outputIndex + 3] = 0;
            }
          }
        } else {
          // For non-indexed PNG, copy pixel data to output
          outputData.set(pixelData);

          // Apply transparency based on color proximity
          for (let i = 0; i < pixelData.length; i += 4) {
            const r = pixelData[i];
            const g = pixelData[i + 1];
            const b = pixelData[i + 2];

            // Calculate color difference
            let smallestDiff = 765; // Maximum difference
            Object.keys(pixelsToDisplay).forEach((pix) => {
              const pixSplit = pix.split(',');
              const biggestDiff = Math.max(
                Math.abs(parseInt(r, 10) - parseInt(pixSplit[0], 10)),
                Math.abs(parseInt(g, 10) - parseInt(pixSplit[1], 10)),
                Math.abs(parseInt(b, 10) - parseInt(pixSplit[2], 10)),
              );
              if (smallestDiff > biggestDiff) {
                smallestDiff = biggestDiff;
              }
            });

            // If difference is large enough, don't display the color
            if (smallestDiff > 10) {
              outputData[i + 3] = 0;
            }
          }
        }

        const newImageData = new ImageData(outputData, width, height);

        if (imageProcessed) {
          // Put imageData directly to canvas
          ctx.putImageData(newImageData, 0, 0);
        } else {
          // If pixels were processed already, we skip this transformation
          const octets = that.canvas_.width * that.canvas_.height * 4;
          const imageData = ctx.getImageData(
            0,
            0,
            that.canvas_.width,
            that.canvas_.height,
          );

          // Process each pixel to color-swap single color palettes
          const pixels = imageData.data;
          const colorLookupObj = structuredClone(that.lookup_);
          const defaultColor = Object.keys(that.lookup_)[0];
          const paletteColor = that.lookup_[Object.keys(that.lookup_)[0]];

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
          ctx.putImageData(imageData, 0, 0);
        }

        // Mark as loaded
        that.state = OlTileState.LOADED;
        that.changed();

        // Call custom tile load function if provided
        if (that.customTileLoadFunction_) {
          that.customTileLoadFunction_(that, that.src_);
        }
      } catch (error) {
        that.state = OlTileState.ERROR;
        that.changed();
        console.error('Error:', error);
      }
    } else {
      this.image_.src = this.src_;
      this.image_.addEventListener('load', onImageLoad);
    }
  }
};
export default function lookupFactory(lookup, sourceOptions) {
  return function(tileCoord, state, src, crossOrigin, tileLoadFunction) {
    return new LookupImageTile(
      lookup,
      tileCoord,
      state,
      src,
      crossOrigin,
      tileLoadFunction,
      sourceOptions,
    );
  };
}

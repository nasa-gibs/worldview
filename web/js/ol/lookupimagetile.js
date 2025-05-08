/* eslint-disable func-names */
import OlImageTile from 'ol/ImageTile';
import OlTileState from 'ol/TileState';
import { decodePNG, processImage } from './util';

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

      // If pixels were processed already, we skip this transformation
      if (!imageProcessed) processImage(that.canvas_, that.lookup_);

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

          // Iterate through pixelData, setting colors directly on outputData
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
          // For non-indexed PNG, copy pixel data to output, this will throw an error if the lengths differ
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
          processImage(that.canvas_, that.lookup_);
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

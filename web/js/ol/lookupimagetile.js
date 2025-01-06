import OlImageTile from 'ol/ImageTile';
import OlTileState from 'ol/TileState';
import UPNG from 'upng-js';
import { cloneDeep as lodashCloneDeep } from 'lodash';

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
  const colorMapArr = [];
  for (let i = 0; i < rawColormap.length; i += 3) {
    colorMapArr.push(rawColormap[i]);
    colorMapArr.push(rawColormap[i + 1]);
    colorMapArr.push(rawColormap[i + 2]);
    colorMapArr.push(255);
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
LookupImageTile.prototype.getImage = function() {
  return this.canvas_;
};
LookupImageTile.prototype.load = async function() {
  if (this.state === OlTileState.IDLE) {
    this.state = OlTileState.LOADING;
    const that = this;
    this.changed();
    let imageProcessed = false;

    const onImageLoad = function() {
      that.canvas_ = document.createElement('canvas');
      that.canvas_.width = that.image_.width;
      that.canvas_.height = that.image_.height;
      const octets = that.canvas_.width * that.canvas_.height * 4;
      const g = that.canvas_.getContext('2d');
      g.drawImage(that.image_, 0, 0);

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
        const colorLookupObj = lodashCloneDeep(that.lookup_);
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
          const pixelColor = `${pixels[i + 0]},${
            pixels[i + 1]},${
            pixels[i + 2]},${
            pixels[i + 3]}`;

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
        const decodedPNG = UPNG.decode(buffer);
        const { width, height } = decodedPNG;

        // Create an array buffer matching the pixel dimensions of the provided image
        const bufferSize = height * width * 4;
        const arrBuffer = new Uint32Array(bufferSize);

        // Extract the colormap values. This is an array of integers representing rgba values.
        // Used in sets of 4 (i.e. colorMapArr[0] = r, colorMapArr[1] = b, etc.)
        // colorMapArr assumes a max of 256 colors
        const colorMapArr = getColormap(decodedPNG.tabs.PLTE);

        // Extract the pixel data. This is an array of integers corresponding to the colormap
        // i.e. if pixelData[0] == 5, this pixel is the color of the 5th entry in the colormap
        const pixelData = decodedPNG.data;

        // iterate through the pixelData, drawing each pixel using the appropriate color
        for (let i = 0; i < pixelData.length; i += 1) {
          const arrBuffIndex = i * 4;
          const lookupIndex = pixelData[i] * 4;

          // Determine desired RGBA for this pixel
          const r = colorMapArr[lookupIndex];
          const g = colorMapArr[lookupIndex + 1];
          const b = colorMapArr[lookupIndex + 2];
          const a = 255;
          // Concatentate to 'r,g,b,a' string & check if that color is in the pixelsToDisplay array
          const rgbaStr = `${r},${g},${b},${a}`;
          const drawThisColor = pixelsToDisplay[rgbaStr];

          // If the intended color exists in pixelsToDisplay obj, draw that color, otherwise draw transparent
          if (drawThisColor !== undefined) {
            arrBuffer[arrBuffIndex + 0] = r;
            arrBuffer[arrBuffIndex + 1] = g;
            arrBuffer[arrBuffIndex + 2] = b;
            arrBuffer[arrBuffIndex + 3] = a;
          } else {
          // console.log('drawThisColor undefined, rgbaStr:', rgbaStr);
            arrBuffer[arrBuffIndex] = 0;
            arrBuffer[arrBuffIndex + 1] = 0;
            arrBuffer[arrBuffIndex + 2] = 0;
            arrBuffer[arrBuffIndex + 3] = 0;
          }
        }

        // Encode the image, creating a new PNG file
        const encodedBufferImage = UPNG.encode([arrBuffer], decodedPNG.width, decodedPNG.height, decodedPNG.depth);
        const blob = new Blob([encodedBufferImage], { type: 'image/png' });
        const dataURL = `${URL.createObjectURL(blob)}`;
        this.image_.src = dataURL;
        this.image_.addEventListener('load', onImageLoad);
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

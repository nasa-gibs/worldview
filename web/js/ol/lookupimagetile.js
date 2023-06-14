import OlImageTile from 'ol/ImageTile';
import OlTileState from 'ol/TileState';
import UPNG from 'upng-js';

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
LookupImageTile.prototype.load = function() {
  if (this.state === OlTileState.IDLE) {
    this.state = OlTileState.LOADING;
    const that = this;
    this.changed();
    const pixelsToDisplay = getPixelColorsToDisplay(this.lookup_);

    const onImageLoad = function() {
      that.canvas_ = document.createElement('canvas');
      that.canvas_.width = that.image_.width;
      that.canvas_.height = that.image_.height;
      const g = that.canvas_.getContext('2d');
      g.drawImage(that.image_, 0, 0);
      // uses the tileload function passed from layerbuilder
      if (that.customTileLoadFunction_) {
        that.customTileLoadFunction_(that, that.src_);
      }

      that.state = OlTileState.LOADED;
      that.changed();
      that.image_.removeEventListener('load', onImageLoad);
    };

    // Can this re-fetch be avoided...?
    fetch(this.src_)
      .then((response) => response.arrayBuffer())
      .then((buffer) => {
        // decode the buffer PNG file
        const decodedPNG = UPNG.decode(buffer);
        const { width, height } = decodedPNG;

        // Create an array buffer matching the pixel dimensions of the provided image
        const bufferSize = height * width * 4;
        const arrBuffer = new Uint32Array(bufferSize);

        // Extract the colormap values. This is an array of integers representing rgba values.
        // Used in sets of 4 (i.e. colorMapArr[0] = r, colorMapArr[1] = b, etc.)
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
        that.image_.src = dataURL;
        that.image_.addEventListener('load', onImageLoad);
      });
  }
};

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

/**
 * Create a new WMTS Layer
 * @method lookupFactory
 * @static
 * @param {object} lookup - The layer palette
 * @param {object} sourceOptions - Layer options
 * @returns {object} function to create LookupImageTile
 */
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

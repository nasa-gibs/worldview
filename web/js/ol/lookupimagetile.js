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


    const onImageLoad = function() {
      that.canvas_ = document.createElement('canvas');
      that.canvas_.width = that.image_.width;
      that.canvas_.height = that.image_.height;
      const g = that.canvas_.getContext('2d');
      g.drawImage(that.image_, 0, 0);
      that.state = OlTileState.LOADED;
      that.changed();
      that.image_.removeEventListener('load', onImageLoad);
    };

    // -----Swap in opaque code block--------------------
    if (true) {
      fetch(this.src_)
        .then((response) => response.arrayBuffer())
        .then((buffer) => {
          // decode the buffer PNG file
          const decodedPNG = UPNG.decode(buffer);
          const { width, height } = decodedPNG;

          // Extract the colormap values, and make all colors opaque
          const colorMapArr = getColormap(decodedPNG.tabs.PLTE);

          // Extract the data (colormap) lookup values
          const pixelData = decodedPNG.data;

          // Create an array buffer matching the pixel dimensions of the provided image
          const bufferSize = height * width * 4;
          const arrBuffer = new Uint32Array(bufferSize);

          console.log(`pixelData.length: ${pixelData.length}`);
          // iterate through the image, re-drawing each pixel with the alpha channel set to 1
          for (let i = 0; i < pixelData.length; i += 1) {
            const arrBuffIndex = i * 4;
            const lookupVal = pixelData[i] * 4;

            arrBuffer[arrBuffIndex] = colorMapArr[lookupVal]; // red channel
            arrBuffer[arrBuffIndex + 1] = colorMapArr[lookupVal + 1]; // green channel
            arrBuffer[arrBuffIndex + 2] = colorMapArr[lookupVal + 2]; // blue channel
            arrBuffer[arrBuffIndex + 3] = 255; // alpha channel
          }

          console.log(`arrBuffer.length: ${arrBuffer.length}`);

          // Encode the image, creating a PNG file
          const encodedBufferImage = UPNG.encode([arrBuffer], decodedPNG.width, decodedPNG.height, decodedPNG.depth);
          const blob = new Blob([encodedBufferImage], { type: 'image/png' });
          const dataURL = `${URL.createObjectURL(blob)}`;

          that.image_.src = dataURL;
          that.image_.addEventListener('load', onImageLoad);
        });
    }
    that.image_.src = this.src_;
    that.image_.addEventListener('load', onImageLoad);
  }
};

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

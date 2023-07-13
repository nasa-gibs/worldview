import OlImageTile from 'ol/ImageTile';
import OlTileState from 'ol/TileState';
import { cloneDeep as lodashCloneDeep } from 'lodash';

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
    this.changed();
    const that = this;
    const onImageLoad = function() {
      that.canvas_ = document.createElement('canvas');
      that.canvas_.width = that.image_.width;
      that.canvas_.height = that.image_.height;
      const octets = that.canvas_.width * that.canvas_.height * 4;
      const g = that.canvas_.getContext('2d');
      g.drawImage(that.image_, 0, 0);
      const imageData = g.getImageData(
        0,
        0,
        that.canvas_.width,
        that.canvas_.height,
      );
      const pixels = imageData.data;
      const colorLookupObj = lodashCloneDeep(that.lookup_);
      const defaultColor = Object.keys(that.lookup_)[0];
      const paletteColor = that.lookup_[Object.keys(that.lookup_)[0]];

      // Load black/transparent into the lookup
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

      // uses the tileload function passed from layerbuilder
      if (that.customTileLoadFunction_) {
        that.customTileLoadFunction_(that, that.src_);
      }

      that.state = OlTileState.LOADED;
      that.changed();
      that.image_.removeEventListener('load', onImageLoad);
    };
    this.image_.src = this.src_;
    this.image_.addEventListener('load', onImageLoad);
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

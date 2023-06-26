import OlImageTile from 'ol/ImageTile';
import OlTileState from 'ol/TileState';

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
      console.log('that.lookup_');
      console.log(that.lookup_);
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
      const colorLookupObj = that.lookup_;
      const defaultColor = Object.keys(that.lookup_)[0];
      const paletteColor = that.lookup_[Object.keys(that.lookup_)[0]];
      for (let i = 0; i < octets; i += 4) {
        const pixelColor = `${pixels[i + 0]},${
          pixels[i + 1]},${
          pixels[i + 2]},${
          pixels[i + 3]}`;

        const targetColor = colorLookupObj[pixelColor];

        if (targetColor) {
          pixels[i + 0] = targetColor.r;
          pixels[i + 1] = targetColor.g;
          pixels[i + 2] = targetColor.b;
          pixels[i + 3] = targetColor.a;
        } else if (pixelColor === '0,0,0,0') {
          pixels[i + 0] = 0;
          pixels[i + 1] = 0;
          pixels[i + 2] = 0;
          pixels[i + 3] = 0;
        } else {
          // the color of the pixel being processed
          const pixelColorArr = pixelColor.split(',');

          // The default color to compare with
          const defaultColorArr = defaultColor.split(',');

          // Determine difference of pixel from default to mimick anti-aliasing
          const rDifference = pixelColorArr[0] - defaultColorArr[0];
          const gDifference = pixelColorArr[1] - defaultColorArr[1];
          const bDifference = pixelColorArr[2] - defaultColorArr[2];

          // anti-aliased pixels
          pixels[i + 0] = paletteColor.r + rDifference;
          pixels[i + 1] = paletteColor.g + gDifference;
          pixels[i + 2] = paletteColor.b + bDifference;
          pixels[i + 3] = pixelColorArr[3];
        }
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

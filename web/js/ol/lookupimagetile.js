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

      for (let i = 0; i < octets; i += 4) {
        // This is the RGBA value of the pixel being processed
        const pixelColor = `${pixels[i + 0]},${
          pixels[i + 1]},${
          pixels[i + 2]},${
          pixels[i + 3]}`;

        // If the pixel color is not black, we force it to the palette color
        // This catches all variations of default palette color
        // if (pixelColor !== '0,0,0,0') {
        //   // eslint-disable-next-line prefer-destructuring
        //   pixelColor = Object.keys(that.lookup_)[0];
        // }

        // We check to see if the pixelColor exists in the lookup table
        const targetColor = that.lookup_[pixelColor];

        if (targetColor) {
        // if (pixelColor !== '0,0,0,0') {
          pixels[i + 0] = targetColor.r;
          pixels[i + 1] = targetColor.g;
          pixels[i + 2] = targetColor.b;
          pixels[i + 3] = targetColor.a;
        } else {
          // check deviation from targetColor & apply same differential to new palette color???
          // .
          // .
          // just make everything else black/transparent
          pixels[i + 0] = 0;
          pixels[i + 1] = 0;
          pixels[i + 2] = 0;
          pixels[i + 3] = 0;
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

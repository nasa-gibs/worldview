import OlImageTile from 'ol/ImageTile';
import OlTileState from 'ol/TileState';

class LookupImageTile extends OlImageTile {
  constructor(lookup, tileCoord, state, src, crossOrigin, tileLoadFunction, sourceOptions) {
    super(tileCoord, state, src, crossOrigin, tileLoadFunction, sourceOptions);
    this.lookup_ = lookup;
    this.canvas_ = null;
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
        const source = `${pixels[i + 0]},${
          pixels[i + 1]},${
          pixels[i + 2]},${
          pixels[i + 3]}`;
        const target = that.lookup_[source];

        if (target) {
          pixels[i + 0] = target.r;
          pixels[i + 1] = target.g;
          pixels[i + 2] = target.b;
          pixels[i + 3] = target.a;
        }
      }
      g.putImageData(imageData, 0, 0);
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

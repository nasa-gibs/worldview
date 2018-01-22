import OlImageTile from 'ol/imagetile';
import OlTileState from 'ol/tilestate';

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
    var that = this;
    var onImageLoad = function() {
      that.canvas_ = document.createElement('canvas');
      that.canvas_.width = that.image_.width;
      that.canvas_.height = that.image_.height;
      var octets = that.canvas_.width * that.canvas_.height * 4;
      var g = that.canvas_.getContext('2d');
      g.drawImage(that.image_, 0, 0);
      var imageData = g.getImageData(0, 0, that.canvas_.width,
        that.canvas_.height);
      var pixels = imageData.data;

      for (var i = 0; i < octets; i += 4) {
        var source = pixels[i + 0] + ',' +
          pixels[i + 1] + ',' +
          pixels[i + 2] + ',' +
          pixels[i + 3];
        var target = that.lookup_[source];

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

export function lookupFactory(lookup, sourceOptions) {
  return function (tileCoord, state, src, crossOrigin, tileLoadFunction) {
    return new LookupImageTile(lookup, tileCoord, state, src,
      crossOrigin, tileLoadFunction, sourceOptions);
  };
};

/*
 * NASA Worldview
 *
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project.
 *
 * Copyright (C) 2013 - 2015 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 */

ol.wv = {};
/**
 * @constructor
 * @extends {ol.ImageTile}
 */
ol.wv.LookupImageTile = function(lookup, tileCoord, state, src, crossOrigin, tileLoadFunction) {

  goog.base(this, tileCoord, state, src, "anonymous", tileLoadFunction);

  /**
   * @private
   */
  this.lookup_ = lookup;

  /**
   * @private
   */
  this.canvas_ = null;
};
goog.inherits(ol.wv.LookupImageTile, ol.ImageTile);

/**
 * @return (HTMLCanvasElement|HTMLImageElement|HTMLVideoElement|null)
 */
ol.wv.LookupImageTile.prototype.getImage = function(opt_context) {
  return this.canvas_;
};

ol.wv.LookupImageTile.prototype.load = function() {

  if (this.state === ol.TileState.IDLE) {
    this.state = ol.TileState.LOADING;
    var that = this;
    var onImageLoad = function(e) {
      that.canvas_ = document.createElement("canvas");
      that.canvas_.width = that.image_.width;
      that.canvas_.height = that.image_.height;
      var octets = that.canvas_.width * that.canvas_.height * 4;
      var g = that.canvas_.getContext("2d");
      g.drawImage(that.image_, 0, 0);
      var imageData = g.getImageData(0, 0, that.canvas_.width,
        that.canvas_.height);
      var pixels = imageData.data;

      for (var i = 0; i < octets; i += 4) {
        var source = pixels[i + 0] + "," +
          pixels[i + 1] + "," +
          pixels[i + 2] + "," +
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
      that.state = ol.TileState.LOADED;
      that.changed();
      that.image_.removeEventListener("load", onImageLoad);
    };
    this.image_.src = this.src_;
    this.image_.addEventListener("load", onImageLoad);
  }
};

/**
 * @api
 */
ol.wv.LookupImageTile.factory = function(lookup) {
  return function(tileCoord, state, src, crossOrigin, tileLoadFunction) {
    return new ol.wv.LookupImageTile(lookup, tileCoord, state, src,
      crossOrigin, tileLoadFunction);
  };
};

/**
 * @constructor
 * @extends {ol.ImageTile}
 */
ol.wv.LookupWMS = function(lookup, tileCoord, state, src, crossOrigin, tileLoadFunction) {

  goog.base(this, tileCoord, state, src, "anonymous", tileLoadFunction);

  /**
   * @private
   */
  this.lookup_ = lookup;

  /**
   * @private
   */
  this.canvas_ = null;
};
goog.inherits(ol.wv.LookupWMS, ol.ImageTile);

/**
 * @return (HTMLCanvasElement|HTMLImageElement|HTMLVideoElement|null)
 */
ol.wv.LookupWMS.prototype.getImage = function(opt_context) {
  return this.canvas_;
};

ol.wv.LookupWMS.prototype.load = function() {

  if (this.state === ol.TileState.IDLE) {
    this.state = ol.TileState.LOADING;
    var that = this;

    //default color
    var defaultRGBA = Object.keys(that.lookup_)[0];
    var defaultRGBAArray = JSON.parse("[" + defaultRGBA + "]");
    var defaultLookupHex = wv.util.rgbaToHex(defaultRGBAArray[0],defaultRGBAArray[1],defaultRGBAArray[2]);

    // var onImageLoad - On WMS / WMTS image load, convert the requested images into canvas
    var onImageLoad = function(e) {
      var newLookup = that.lookup_[defaultRGBA];

      // Create the canvas elements to copy source wms / wmts image from
      that.canvas_ = document.createElement("canvas");
      that.canvas_.width = that.image_.width;
      that.canvas_.height = that.image_.height;
      // Account for a RGBA value for each pixel.
      var octets = that.canvas_.width * that.canvas_.height * 4;
      // Set the type of canvas to draw
      var g = that.canvas_.getContext("2d");

      // Draw the wms/wmts image at x,y
      g.drawImage(that.image_, 0, 0);
      var imageData = g.getImageData(0, 0, that.canvas_.width, that.canvas_.height);

      var pixels = imageData.data;

      for (var i = 0; i < octets; i += 4) {
        var hexSource = wv.util.rgbaToHex(pixels[i + 0], pixels[i + 1], pixels[i + 2]);

        if (wv.util.hexColorDelta(hexSource, defaultLookupHex) < 125) { // If the two colors are close
          if (newLookup) {
            pixels[i + 0] = newLookup.r;
            pixels[i + 1] = newLookup.g;
            pixels[i + 2] = newLookup.b;
            pixels[i + 3] = newLookup.a;
          }
        }
      }
      g.putImageData(imageData, 0, 0);
      that.state = ol.TileState.LOADED;
      that.changed();
      that.image_.removeEventListener("load", onImageLoad);
    };
    this.image_.src = this.src_;
    this.image_.addEventListener("load", onImageLoad);
  }

};

/**
 * @api
 */
ol.wv.LookupWMS.factory = function(lookup) {
  return function(tileCoord, state, src, crossOrigin, tileLoadFunction) {
    return new ol.wv.LookupWMS(lookup, tileCoord, state, src, crossOrigin, tileLoadFunction);
  };
};

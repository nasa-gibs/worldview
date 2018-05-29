import GifWriter from 'gifwriter';
import NeuQuant from 'neuquant';
import Promise from 'bluebird';
import { ReadableStream } from 'web-streams-polyfill';
import lodashEach from 'lodash/each';

export default class GifStream {
  constructor() {
    this.canvas = null;
    this.ctx = null;
  }
  /**
   * Add frame contents to canvas
   *
   * https://github.com/yahoo/gifshot/blob/master/src/modules/core/AnimatedGIF.js
   *
   * @param {Object} ctx       2d Canvas Context
   * @param {Object} img       Image Element
   * @param {String} frameText Text to be applied to this string
   *
   * @return {Object}            2d Canvas Context
   */
  addFrameDetails(ctx, img) {
    const options = this.options;
    const frameText = img.text;
    const {
      fontColor,
      fontSize,
      fontFamily,
      fontWeight,
      gifHeight,
      gifWidth,
      text,
      textAlign,
      textBaseline,
      waterMark,
      waterMarkHeight,
      waterMarkWidth,
      waterMarkXCoordinate,
      waterMarkYCoordinate
    } = options;
    const textXCoordinate = options.textXCoordinate ? options.textXCoordinate : textAlign === 'left' ? 1 : textAlign === 'right' ? gifWidth : gifWidth / 2;
    const textYCoordinate = options.textYCoordinate ? options.textYCoordinate : textBaseline === 'top' ? 1 : textBaseline === 'center' ? gifHeight / 2 : gifHeight;
    const font = fontWeight + ' ' + fontSize + ' ' + fontFamily;
    const textToUse = (frameText && options.showFrameText) ? frameText : text;

    try {
      ctx.drawImage(img, 0, 0, gifWidth, gifHeight);
      if (textToUse) {
        ctx.font = font;
        ctx.fillStyle = fontColor;
        ctx.textAlign = textAlign;
        ctx.textBaseline = textBaseline;
        if (options.stroke) {
          const stroke = options.stroke;
          ctx.strokeStyle = stroke.color;
          ctx.lineWidth = stroke.pixels * 2;
          ctx.strokeText(frameText, textXCoordinate, textYCoordinate);
        }
        ctx.fillText(textToUse, textXCoordinate, textYCoordinate);
      }
      if (waterMark) {
        ctx.drawImage(waterMark, waterMarkXCoordinate, waterMarkYCoordinate, waterMarkWidth, waterMarkHeight);
      }
      return ctx;
    } catch (e) {
      return '' + e;
    }
  }
  /**
   * Create GIF from options
   *
   * @param  {Object}   options  GIF options
   * @param  {Function} callback Function to call once GIF is created
   * @return {void}
   */
  createGIF(options, callback) {
    if (this.canvas) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.options = options;
    this.canvas.width = options.gifWidth;
    this.canvas.height = options.gifHeight;

    var imagePromiseArray = [];
    lodashEach(options.images, (imageObj) => {
      imagePromiseArray.push(this.getImagePromise(imageObj).catch(returnError));
    });
    function returnError(e) {
      const callbackObj = {
        blob: null,
        error: e
      };
      callback(callbackObj);
    }
    Promise.all(imagePromiseArray).then((images) => {
      var gifStream = this.getStream(images, this.ctx);
      var reader = gifStream.getReader();
      var chunks = [];
      var processedImages = 1;
      function finished(chunks) {
        const callbackObj = {
          blob: new Blob(chunks, { type: 'image/gif' }),
          error: ''
        };
        callback(callbackObj);
      };

      function pull() {
        const imageLength = options.images.length;
        return reader.read().then(function (result) {
          const chunk = result.value;
          if (result.done) {
            finished(chunks);
          } else {
            chunks.push(new Uint8Array(chunk));
            options.progressCallback(Math.round((processedImages / imageLength) * 100));
            processedImages++;
            setTimeout(function() { // This was needed in order for callback to be applied
              return pull();
            }, 10);
          }
        });
      };
      options.progressCallback(0);
      pull();
    });
  }
  getImagePromise(frame) {
    return new Promise((resolve, reject) => {
      var img = new Image();
      img.width = this.options.gifWidth;
      img.height = this.options.gifHeight;
      img.text = frame.text;
      img.delay = frame.delay;
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        URL.revokeObjectURL(img.src); // Free up some memory
        resolve(img);
        delete img.onload;
        delete img.onerror;
      };
      img.onerror = (e) => {
        reject(e);
        delete img.onload;
        delete img.onerror;
      };
      img.src = frame.src;
    });
  }
  /**
   * Generate GIF-creating Stream
   * @param  {Array} frames Array of GIF image objects
   * @param  {Object} ctx    2d Canvas Cntext
   * @return {Object}        Returns GifWriter Stream
   */
  getStream(frames, ctx) {
    var options = this.options;
    var width = options.gifWidth;
    var height = options.gifHeight;
    var totalImages = frames.length;
    var processedImages = 0;
    var self = this;
    var rs = new ReadableStream({
      pull: function pull(controller) {
        var frame = frames.shift();
        if (!frame) controller.close();
        var imgData, rgbComponents, paletteRGB, nq, paletteArray, numberPixels, pixels;
        var r, g, b;
        var k = 0;
        var delay = (frame.delay) ? frame.delay / 10 : 100;
        processedImages++;
        delay = (processedImages === totalImages && options.extraLastFrameDelay) ? delay + (options.extraLastFrameDelay / 10) : delay;// Add an extra
        ctx = self.addFrameDetails(ctx, frame);
        imgData = ctx.getImageData(0, 0, width, height);
        rgbComponents = dataToRGB(imgData.data, imgData.width, imgData.height);
        nq = new NeuQuant(rgbComponents, rgbComponents.length, 15);
        paletteRGB = nq.process();
        paletteArray = new Uint32Array(componentizedPaletteToArray(paletteRGB));
        numberPixels = imgData.height * imgData.width;
        pixels = new Uint8Array(imgData.height * imgData.width);
        for (var i = 0; i < numberPixels; i++) {
          r = rgbComponents[k++];
          g = rgbComponents[k++];
          b = rgbComponents[k++];
          pixels[i] = nq.map(r, g, b);
        }
        controller.enqueue([0, 0, width, height, pixels, {
          palette: paletteArray,
          delay: delay
        }]);
      }
    });
    return new GifWriter(rs, width, height, {
      loop: options.loop || 0 // From GIF: 0 = loop forever, null = not looping, n > 0 = loop n times and stop
    });
  }
}

// part of neuquant conversion
function componentizedPaletteToArray(paletteRGB) {
  var paletteArray = [];
  var r, g, b;
  for (var i = 0; i < paletteRGB.length; i += 3) {
    r = paletteRGB[i];
    g = paletteRGB[i + 1];
    b = paletteRGB[i + 2];
    paletteArray.push(r << 16 | g << 8 | b);
  }
  return paletteArray;
};
// part of neuquant conversion
function dataToRGB(data, width, height) {
  var i = 0;
  var length = width * height * 4;
  var rgb = [];
  while (i < length) {
    rgb.push(data[i++]);
    rgb.push(data[i++]);
    rgb.push(data[i++]);
    i++;
  }
  return rgb;
}

import OlImageTile from 'ol/ImageTile';
import OlTileState from 'ol/TileState';
import UPNG from 'upng-js';

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
  console.log('LookupImageTile.prototype.load');
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

const getOpaquePNG = () => {
  fetch('https://gibs-a.earthdata.nasa.gov/wmts/epsg4326/best/wmts.cgi?TIME=2023-03-20T00:00:00Z&layer=MODIS_Terra_L3_Sea_Ice_Daily&style=default&tilematrixset=1km&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fpng&TileMatrix=0&TileCol=0&TileRow=0')
    .then((response) => response.arrayBuffer())
    .then((buffer) => {
      // decode the buffer PNG file
      const decodedPNG = UPNG.decode(buffer);
      // console.log(decodedPNG.data);

      // Extract the colormap values, and make all colors opaque
      const colorMapArr = getColormap(decodedPNG.tabs.PLTE);

      // Extract the data values, which are the colormap lookup values
      const pixelData = decodedPNG.data;

      // Create an array buffer matching the dimensions of the provided image
      const bufferSize = decodedPNG.height * decodedPNG.width * 4;
      const arrBuffer = new ArrayBuffer(bufferSize);

      // Create a view into the array buffer
      const arrBufferView = new Uint32Array(arrBuffer);

      // iterate through the original image, re-drawing each pixel with the alpha channel set to 1
      for (let i = 0; i < pixelData.length; i += 4) {
        const lookupVal = pixelData[i] * 4;
        // console.log(`lookupVal: ${lookupVal}`);
        // console.log(`colorMapArr[lookupVal]: ${colorMapArr[lookupVal]}`);

        arrBufferView[i] = colorMapArr[lookupVal]; // red channel
        arrBufferView[i + 1] = colorMapArr[lookupVal + 1]; // green channel
        arrBufferView[i + 2] = colorMapArr[lookupVal + 2]; // blue channel
        arrBufferView[i + 3] = 255; // alpha channel
      }

      const encodedBufferImage = UPNG.encode([arrBufferView], decodedPNG.width, decodedPNG.height, 256);
      return encodedBufferImage;
      // putItOnDom(encodedBufferImage);
    });
};

function putItOnDom(encodedImg) {
  // Convert the new PNG image to a Blob and create a URL for it
  const blob = new Blob([encodedImg], { type: 'image/png' });
  const url = URL.createObjectURL(blob);
  const img = document.createElement('img');
  img.src = url;
  const el = document.getElementById('wv-content');
  el.appendChild(img);
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

export default function lookupFactory(lookup, sourceOptions) {
  console.log('lookupFactory');
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

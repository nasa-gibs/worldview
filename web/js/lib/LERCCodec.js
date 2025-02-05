/* jshint forin: false, bitwise: false
Copyright 2015 Esri
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
A copy of the license and additional notices are located with the
source distribution at:
http://github.com/Esri/lerc/
Contributors:  Johannes Schmid,
               Chayanika Khatua,
               Wenxue Ju
*/

function LERC() {
  // WARNING: This decoder version can only read old version 1 Lerc blobs. Use with caution.
  // A new, updated js Lerc decoder is in the works.

  // Note: currently, this module only has an implementation for decoding LERC data, not encoding. The name of
  // the class was chosen to be future proof.

  const LercCodec = {};

  LercCodec.defaultNoDataValue = -3.4027999387901484e38; // smallest Float32 value

  const unstuff = function(src, bitsPerPixel, numPixels, offset, scale, dest, maxValue) {
    const bitMask = (1 << bitsPerPixel) - 1;
    let i = 0;
    let o;
    let bitsLeft = 0;
    let n; let
      buffer;
    const nmax = Math.ceil((maxValue - offset) / scale);
    // get rid of trailing bytes that are already part of next block
    const numInvalidTailBytes = (src.length * 4) - Math.ceil((bitsPerPixel * numPixels) / 8);
    src[src.length - 1] <<= 8 * numInvalidTailBytes;

    for (o = 0; o < numPixels; o += 1) {
      if (bitsLeft === 0) {
        buffer = src[i++];
        bitsLeft = 32;
      }
      if (bitsLeft >= bitsPerPixel) {
        n = (buffer >>> (bitsLeft - bitsPerPixel)) & bitMask;
        bitsLeft -= bitsPerPixel;
      } else {
        const missingBits = bitsPerPixel - bitsLeft;
        n = ((buffer & bitMask) << missingBits) & bitMask;
        buffer = src[i++];
        bitsLeft = 32 - missingBits;
        n += buffer >>> bitsLeft;
      }
      // pixel values may exceed max due to quantization
      dest[o] = n < nmax ? offset + n * scale : maxValue;
    }
    return dest;
  };

  const computeUsedBitDepths = function(data) {
    const numBlocks = data.pixels.numBlocksX * data.pixels.numBlocksY;
    const bitDepths = {};
    for (let i = 0; i < numBlocks; i++) {
      const block = data.pixels.blocks[i];
      if (block.encoding === 0) {
        bitDepths.float32 = true;
      } else if (block.encoding === 1) {
        bitDepths[block.bitsPerPixel] = true;
      } else {
        bitDepths[0] = true;
      }
    }

    return Object.keys(bitDepths);
  };

  const formatFileInfo = function(data) {
    return {
      fileIdentifierString: data.fileIdentifierString,
      fileVersion: data.fileVersion,
      imageType: data.imageType,
      height: data.height,
      width: data.width,
      maxZError: data.maxZError,
      eofOffset: data.eofOffset,
      mask: data.mask
        ? {
          numBlocksX: data.mask.numBlocksX,
          numBlocksY: data.mask.numBlocksY,
          numBytes: data.mask.numBytes,
          maxValue: data.mask.maxValue,
        }
        : null,
      pixels: {
        numBlocksX: data.pixels.numBlocksX,
        numBlocksY: data.pixels.numBlocksY,
        numBytes: data.pixels.numBytes,
        maxValue: data.pixels.maxValue,
        minValue: data.pixels.minValue,
        noDataValue: this.noDataValue,
      },
    };
  };

  const parse = function(input, fp, skipMask) {
    const data = {};

    // File header
    const fileIdView = new Uint8Array(input, fp, 10);
    // console.log(fileIdView);
    data.fileIdentifierString = String.fromCharCode.apply(null, fileIdView);
    if (data.fileIdentifierString.trim() !== 'CntZImage') {
      console.error(`Unexpected file identifier string: ${data.fileIdentifierString}`);
      return null;
    }
    fp += 10;
    let view = new DataView(input, fp, 24);
    data.fileVersion = view.getInt32(0, true);
    data.imageType = view.getInt32(4, true);
    data.height = view.getUint32(8, true);
    data.width = view.getUint32(12, true);
    data.maxZError = view.getFloat64(16, true);
    fp += 24;

    // Mask Header
    if (!skipMask) {
      view = new DataView(input, fp, 16);
      data.mask = {};
      data.mask.numBlocksY = view.getUint32(0, true);
      data.mask.numBlocksX = view.getUint32(4, true);
      data.mask.numBytes = view.getUint32(8, true);
      data.mask.maxValue = view.getFloat32(12, true);
      fp += 16;

      // Mask Data
      if (data.mask.numBytes > 0) {
        const bitset = new Uint8Array(Math.ceil((data.width * data.height) / 8));
        view = new DataView(input, fp, data.mask.numBytes);
        let cnt = view.getInt16(0, true);
        let ip = 2;
        let op = 0;
        do {
          if (cnt > 0) {
            while (cnt--) {
              bitset[op++] = view.getUint8(ip++);
            }
          } else {
            const val = view.getUint8(ip++);
            cnt = -cnt;
            while (cnt--) {
              bitset[op++] = val;
            }
          }
          cnt = view.getInt16(ip, true);
          ip += 2;
        } while (ip < data.mask.numBytes);
        if (cnt !== -32768 || op < bitset.length) {
          console.error('Unexpected end of mask RLE encoding');
          return null;
        }
        data.mask.bitset = bitset;
        fp += data.mask.numBytes;
      } else if ((data.mask.numBytes | data.mask.numBlocksY | data.mask.maxValue) === 0) {
        // Special case, all nodata
        const bitset = new Uint8Array(Math.ceil((data.width * data.height) / 8));
        data.mask.bitset = bitset;
      }
    }

    // Pixel Header
    view = new DataView(input, fp, 16);
    data.pixels = {};
    data.pixels.numBlocksY = view.getUint32(0, true);
    data.pixels.numBlocksX = view.getUint32(4, true);
    data.pixels.numBytes = view.getUint32(8, true);
    data.pixels.maxValue = view.getFloat32(12, true);
    fp += 16;

    const { numBlocksX } = data.pixels;
    const { numBlocksY } = data.pixels;
    // the number of blocks specified in the header does not take into account the blocks at the end of
    // each row/column with a special width/height that make the image complete in case the width is not
    // evenly divisible by the number of blocks.
    const actualNumBlocksX = numBlocksX + (data.width % numBlocksX > 0 ? 1 : 0);
    const actualNumBlocksY = numBlocksY + (data.height % numBlocksY > 0 ? 1 : 0);
    data.pixels.blocks = new Array(actualNumBlocksX * actualNumBlocksY);
    let minValue = 1000000000;
    let blockI = 0;
    for (let blockY = 0; blockY < actualNumBlocksY; blockY++) {
      for (let blockX = 0; blockX < actualNumBlocksX; blockX++) {
        // Block
        let size = 0;
        const bytesLeft = input.byteLength - fp;
        view = new DataView(input, fp, Math.min(10, bytesLeft));
        const block = {};
        data.pixels.blocks[blockI++] = block;
        let headerByte = view.getUint8(0);
        size++;
        block.encoding = headerByte & 63;
        if (block.encoding > 3) {
          console.error(`Invalid block encoding (${block.encoding})`);
          return null;
        }
        if (block.encoding === 2) {
          fp++;
          minValue = Math.min(minValue, 0);
          continue;
        }
        if (headerByte !== 0 && headerByte !== 2) {
          headerByte >>= 6;
          block.offsetType = headerByte;
          if (headerByte === 2) {
            block.offset = view.getInt8(1);
            size++;
          } else if (headerByte === 1) {
            block.offset = view.getInt16(1, true);
            size += 2;
          } else if (headerByte === 0) {
            block.offset = view.getFloat32(1, true);
            size += 4;
          } else {
            console.error('Invalid block offset type');
            return null;
          }
          minValue = Math.min(block.offset, minValue);

          if (block.encoding === 1) {
            headerByte = view.getUint8(size);
            size++;
            block.bitsPerPixel = headerByte & 63;
            headerByte >>= 6;
            block.numValidPixelsType = headerByte;
            if (headerByte === 2) {
              block.numValidPixels = view.getUint8(size);
              size++;
            } else if (headerByte === 1) {
              block.numValidPixels = view.getUint16(size, true);
              size += 2;
            } else if (headerByte === 0) {
              block.numValidPixels = view.getUint32(size, true);
              size += 4;
            } else {
              console.error('Invalid valid pixel count type');
              return null;
            }
          }
        }
        fp += size;

        if (block.encoding === 3) {
          continue;
        }

        let arrayBuf; let
          store8;
        if (block.encoding === 0) {
          const numPixels = (data.pixels.numBytes - 1) / 4;
          if (numPixels !== Math.floor(numPixels)) {
            console.error('uncompressed block has invalid length');
            return null;
          }
          arrayBuf = new ArrayBuffer(numPixels * 4);
          store8 = new Uint8Array(arrayBuf);
          store8.set(new Uint8Array(input, fp, numPixels * 4));
          const rawData = new Float32Array(arrayBuf);
          for (let j = 0; j < rawData.length; j++) {
            minValue = Math.min(minValue, rawData[j]);
          }
          block.rawData = rawData;
          fp += numPixels * 4;
        } else if (block.encoding === 1) {
          const dataBytes = Math.ceil((block.numValidPixels * block.bitsPerPixel) / 8);
          const dataWords = Math.ceil(dataBytes / 4);
          arrayBuf = new ArrayBuffer(dataWords * 4);
          store8 = new Uint8Array(arrayBuf);
          store8.set(new Uint8Array(input, fp, dataBytes));
          block.stuffedData = new Uint32Array(arrayBuf);
          fp += dataBytes;
        }
      }
    }
    data.pixels.minValue = minValue;
    data.eofOffset = fp;
    return data;
  };

  const uncompressPixelValues = function(
    data,
    TypedArrayClass,
    maskBitset,
    noDataValue,
    storeDecodedMask,
  ) {
    let blockIdx = 0;
    const numX = data.pixels.numBlocksX;
    const numY = data.pixels.numBlocksY;
    const blockWidth = Math.floor(data.width / numX);
    const blockHeight = Math.floor(data.height / numY);
    const scale = 2 * data.maxZError;
    maskBitset = maskBitset || (data.mask ? data.mask.bitset : null);

    let resultMask;
    const resultPixels = new TypedArrayClass(data.width * data.height);
    if (storeDecodedMask && maskBitset) {
      resultMask = new Uint8Array(data.width * data.height);
    }
    const blockDataBuffer = new Float32Array(blockWidth * blockHeight);

    let xx; let
      yy;
    for (let y = 0; y <= numY; y++) {
      const thisBlockHeight = y !== numY ? blockHeight : data.height % numY;
      if (thisBlockHeight === 0) {
        continue;
      }
      for (let x = 0; x <= numX; x++) {
        const thisBlockWidth = x !== numX ? blockWidth : data.width % numX;
        if (thisBlockWidth === 0) {
          continue;
        }

        let outPtr = y * data.width * blockHeight + x * blockWidth;
        const outStride = data.width - thisBlockWidth;

        const block = data.pixels.blocks[blockIdx];

        let blockData; let blockPtr; let
          constValue;
        if (block.encoding < 2) {
          // block is either uncompressed or bit-stuffed (encodings 0 and 1)
          if (block.encoding === 0) {
            // block is uncompressed
            blockData = block.rawData;
          } else {
            // block is bit-stuffed
            unstuff(
              block.stuffedData,
              block.bitsPerPixel,
              block.numValidPixels,
              block.offset,
              scale,
              blockDataBuffer,
              data.pixels.maxValue,
            );
            blockData = blockDataBuffer;
          }
          blockPtr = 0;
        } else if (block.encoding === 2) {
          // block is all 0
          constValue = 0;
        } else {
          // block has constant value (encoding === 3)
          constValue = block.offset;
        }

        let maskByte;
        if (maskBitset) {
          for (yy = 0; yy < thisBlockHeight; yy++) {
            if (outPtr & 7) {
              //
              maskByte = maskBitset[outPtr >> 3];
              maskByte <<= outPtr & 7;
            }
            for (xx = 0; xx < thisBlockWidth; xx++) {
              if (!(outPtr & 7)) {
                // read next byte from mask
                maskByte = maskBitset[outPtr >> 3];
              }
              if (maskByte & 128) {
                // pixel data present
                if (resultMask) {
                  resultMask[outPtr] = 1;
                }
                resultPixels[outPtr++] = block.encoding < 2 ? blockData[blockPtr++] : constValue;
              } else {
                // pixel data not present
                if (resultMask) {
                  resultMask[outPtr] = 0;
                }
                resultPixels[outPtr++] = noDataValue;
              }
              maskByte <<= 1;
            }
            outPtr += outStride;
          }
        } else {
          // mask not present, simply copy block over
          if (block.encoding < 2) {
            // duplicating this code block for performance reasons
            // blockData case:
            for (yy = 0; yy < thisBlockHeight; yy += 1) {
              for (xx = 0; xx < thisBlockWidth; xx += 1) {
                resultPixels[outPtr++] = blockData[blockPtr++];
              }
              outPtr += outStride;
            }
          } else {
            // constValue case:
            for (yy = 0; yy < thisBlockHeight; yy += 1) {
              for (xx = 0; xx < thisBlockWidth; xx += 1) {
                resultPixels[outPtr++] = constValue;
              }
              outPtr += outStride;
            }
          }
        }
        if (block.encoding === 1 && blockPtr !== block.numValidPixels) {
          console.error('Block and Mask do not match');
          return null;
        }
        blockIdx++;
      }
    }

    return {
      resultPixels,
      resultMask,
    };
  };

  /**
   * Decode a LERC byte stream and return an object containing the pixel data and some required and optional
   * information about it, such as the image's width and height.
   *
   * @param {ArrayBuffer} input The LERC input byte stream
   * @param {object} [options] Decoding options, containing any of the following properties:
   * @config {number} [inputOffset = 0]
   *        Skip the first inputOffset bytes of the input byte stream. A valid LERC file is expected at that position.
   * @config {Uint8Array} [encodedMask = null]
   *        If specified, the decoder will not read mask information from the input and use the specified encoded
   *        mask data instead. Mask header/data must not be present in the LERC byte stream in this case.
   * @config {number} [noDataValue = LercCode.defaultNoDataValue]
   *        Pixel value to use for masked pixels.
   * @config {ArrayBufferView|Array} [pixelType = Float32Array]
   *        The desired type of the pixelData array in the return value. Note that it is the caller's responsibility to
   *        provide an appropriate noDataValue if the default pixelType is overridden.
   * @config {boolean} [returnMask = false]
   *        If true, the return value will contain a maskData property of type Uint8Array which has one element per
   *        pixel, the value of which is 1 or 0 depending on whether that pixel's data is present or masked. If the
   *        input LERC data does not contain a mask, maskData will not be returned.
   * @config {boolean} [returnEncodedMask = false]
   *        If true, the return value will contain a encodedMaskData property, which can be passed into encode() as
   *        encodedMask.
   * @config {boolean} [returnFileInfo = false]
   *        If true, the return value will have a fileInfo property that contains metadata obtained from the
   *        LERC headers and the decoding process.
   * @config {boolean} [computeUsedBitDepths = false]
   *        If true, the fileInfo property in the return value will contain the set of all block bit depths
   *        encountered during decoding. Will only have an effect if returnFileInfo option is true.
   * @returns {{width, height, pixelData, minValue, maxValue, noDataValue, [maskData], [encodedMaskData], [fileInfo]}}
   */
  LercCodec.decode = function(input, options) {
    options = options || {};

    const skipMask = options.encodedMaskData || options.encodedMaskData === null;
    const parsedData = parse(input, options.inputOffset || 0, skipMask);
    if (!parsedData) return null;

    const noDataValue = options.noDataValue != null ? options.noDataValue : LercCodec.defaultNoDataValue;

    const uncompressedData = uncompressPixelValues(
      parsedData,
      options.pixelType || Float32Array,
      options.encodedMaskData,
      noDataValue,
      options.returnMask,
    );
    if (!uncompressedData) return null;

    const result = {
      width: parsedData.width,
      height: parsedData.height,
      pixelData: uncompressedData.resultPixels,
      minValue: parsedData.pixels.minValue,
      maxValue: parsedData.pixels.maxValue,
      noDataValue,
    };

    if (uncompressedData.resultMask) {
      result.maskData = uncompressedData.resultMask;
    }

    if (options.returnEncodedMask && parsedData.mask) {
      result.encodedMaskData = parsedData.mask.bitset ? parsedData.mask.bitset : null;
    }

    if (options.returnFileInfo) {
      result.fileInfo = formatFileInfo(parsedData);
      if (options.computeUsedBitDepths) {
        result.fileInfo.bitDepths = computeUsedBitDepths(parsedData);
      }
    }

    return result;
  };

  return LercCodec;
}

export default LERC;

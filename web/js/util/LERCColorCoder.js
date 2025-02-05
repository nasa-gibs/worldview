/*
* This is the basic client that will attempt to get data out of LERC tiles.
* The data from each tile of the LERC data set is stored into an array under the
* correct layer during tile load, and each time the map is moved around, zoomed, etc.,
* the visible lerc tiles are drawn based on user given parameters like color and
* range.
*/
import { cloneDeep as lodashCloneDeep } from 'lodash';
import LERC from './LERCCodec';
import {
  getPalette,
  getPaletteLegend,
  getLookup as getPaletteLookup,
} from '../modules/palettes/selectors';

const STATE_LOADING = 1;
const STATE_LOADED = 2;
const STATE_ERROR = 3;

/**
 * Only called if the user has changed the palette for the layer. Then does a translation from the default
 * coloring to this new coloring
 * @param {object} imageData
 * @param {object} lookup Lookup from getPaletteLookup
 * @param {object} newCanvas Having newCanvas Fixes issues with retina displays by drawing and scaling on a different canvas
 * @param {object} context
 */
function changeColorPalette(imageData, lookup, newCanvas, context) {
  const octets = newCanvas.width * newCanvas.height * 4;

  // Process each pixel to color-swap single color palettes
  const pixels = imageData.data;
  const colorLookupObj = lodashCloneDeep(lookup);
  const defaultColor = Object.keys(lookup)[0];
  const paletteColor = lookup[Object.keys(lookup)[0]];

  // Load black/transparent into the lookup object
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
    imageData.data[i + 0] = colorLookupObj[pixelColor].r;
    imageData.data[i + 1] = colorLookupObj[pixelColor].g;
    imageData.data[i + 2] = colorLookupObj[pixelColor].b;
    imageData.data[i + 3] = colorLookupObj[pixelColor].a;
  }
  context.putImageData(imageData, 0, 0);
}

function getImgData(mapLayer, tileCoord) {
  return mapLayer
    .getSource()
    .tileCache.get(tileCoord.join('/'))
    .getImage().decodedPixels;
}

// most basic color function that will be used for LERC unless the palette is changed
function getGreyScalar(val, min, max) {
  const colors = [];
  colors[0] = 255 * (val - min) / (max - min);
  colors[1] = colors[0];
  colors[2] = colors[0];
  return colors;
}

/*
* Draws a tile at the starting pixel with the given size, opacity, and
* using the color_scale and min, max specified.
*/
function drawTile(
  pixelData,
  layer,
  context,
  size,
  min,
  max,
  opacity,
  filter,
  state,
  noDataValue,
  groupString,
) {
  const image = context.createImageData(size, size);
  const values = pixelData;

  /* If the filter is not on, display everything, just make numbers above max max color and below min min color */
  if (!filter) {
    for (let j = 0; j < values.length; j+=1) {
      let value = values[j];
      if (value !== noDataValue) {
        if (value < min) {
          value = min;
        }
        if (value > max) {
          value = max;
        }
        const colors = getGreyScalar(value, min, max);
        image.data[j * 4] = colors[0];
        image.data[j * 4 + 1] = colors[1];
        image.data[j * 4 + 2] = colors[2];
        image.data[j * 4 + 3] = opacity;
      } else {
        image.data[j * 4] = 0;
        image.data[j * 4 + 1] = 0;
        image.data[j * 4 + 2] = 0;
        image.data[j * 4 + 3] = 0;
      }
    }
  } else {
    /* If the filter is on, do not display pixels below min and above max */
    for (let j = 0; j < values.length; j+=1) {
      let value = values[j];
      if (value !== noDataValue && value > min && value < max) {
        const colors = getGreyScalar(value, min, max);
        image.data[j * 4] = colors[0];
        image.data[j * 4 + 1] = colors[1];
        image.data[j * 4 + 2] = colors[2];
        image.data[j * 4 + 3] = opacity;
      } else {
        image.data[j * 4] = 0;
        image.data[j * 4 + 1] = 0;
        image.data[j * 4 + 2] = 0;
        image.data[j * 4 + 3] = 0;
      }
    }
  }
  /* Fixes issues with retina displays by drawing and scaling on a different canvas */
  const newCanvas = document.createElement('canvas');
  newCanvas.width = size * devicePixelRatio;
  newCanvas.height = size * devicePixelRatio;

  context.putImageData(image, 0, 0);

  /* if the user has changed the palette, make sure to update the color */
  if (layer.custom) {
    const lookup = getPaletteLookup(layer.id, groupString || 'active', state);
    changeColorPalette(image, lookup, newCanvas, context);
  }
}

/**
 * Loads a lerc layer tile to the map
 * @param {object} tile
 * @param {object} src Link to LERC layer
 * @param {map} layer information about properties of the layer
 * @param {object} map OpenLayers map
 * @param {object} state State of the map
 * @param {object} tilegrid OlTileGridWMTS
 */
export function tileLoader(tile, src, layer, state, tilegrid, groupString) {
  const lercCodec = new LERC();
  const img = tile.getImage();
  const map = state.map.ui.selected;

  // load in the image with crossOrigin allowances
  tile.state = STATE_LOADING;
  tile.changed();
  const view = map.getView();
  fetch(src)
    .then((response) => response.arrayBuffer())
    .then((buffer) => {
      const palette = getPalette(layer.id, 0, groupString || 'active', state);
      const legend = getPaletteLegend(layer.id, 0, groupString || 'active', state);

      const noDataValue = parseFloat(palette.noDataValue);
      if (Number.isNaN(noDataValue)) console.error(`No Data value incorrect for layer ${layer.id}. Layer might not display correctly`);
      const decodedData = lercCodec.decode(buffer, { returnMask: true, noDataValue });
      const { pixelData, width, height } = decodedData;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      const zoom = tilegrid.getZForResolution(view.getResolution(), 0);

      // copy pixelData to new array with a deep copy, and pass that into drawTiles
      const size = tilegrid.getTileSize(zoom);
      const opacity = 255;

      const max = palette.legend.colors.length - 1;
      const start = palette.min ? legend.refs.indexOf(palette.entries.refs[palette.min]) : 0;
      const end = palette.max ? legend.refs.indexOf(palette.entries.refs[palette.max]) : max;

      const filter = start !== 0 || end !== max;

      drawTile(
        pixelData,
        layer,
        ctx,
        size,
        start,
        end,
        opacity,
        filter,
        state,
        noDataValue,
        groupString,
      );

      img.decodedPixels = pixelData;
      img.src = canvas.toDataURL();
      tile.state = STATE_LOADED;
      tile.changed();
    })
    .catch((error) => {
      console.error('Tile loading error:', error);
      tile.state = STATE_ERROR;
      tile.changed();
    });
}

/**
 * Finds the value where the mouse currently is
 * This function is not currently in use, but left in for future potential use
 */
export function findValue(map, pixel, layer) {
  const coord = map.getCoordinateFromPixel(pixel); // this line seems to be correct
  const tilegrid = layer.getSource().getTileGrid();
  const tileCoord = tilegrid.getTileCoordForCoordAndResolution(
    coord,
    map.getView().getResolution(),
  );

  const tileExtent = tilegrid.getTileCoordExtent(tileCoord); // this seems right
  const tilePixel = map.getPixelFromCoordinate([tileExtent[0], tileExtent[3]]);
  const row = pixel[0] - tilePixel[0];
  const column = pixel[1] - Math.round(tilePixel[1]);
  const zoom = tilegrid.getZForResolution(map.getView().getResolution()); // this seems to be correct
  const i = Math.round(column * tilegrid.getTileSize(zoom) + row);
  const value = getImgData(layer, tileCoord)[i];

  // if the value equals the no data value, set value to N/A. Need to find way to get the layer's no data value
  /* if (value == getNoDataValue(layer, tileCoord)) {
        value = "N/A";
    } */
  return value;
}

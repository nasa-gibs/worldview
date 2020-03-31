import OlTileGridWMTS from 'ol/tilegrid/WMTS';
import OlSourceWMTS from 'ol/source/WMTS';
import OlLayerTile from 'ol/layer/Tile';
import util from '../util/util';
import {
  isActive as isPaletteActive,
  getLookup as getPaletteLookup,
} from '../modules/palettes/selectors';

const ZOOM_DURATION = 250;

/*
 * Setting a zoom action
 *
 * @function self.zoomAction
 * @static
 *
 * @param {Object} map - OpenLayers Map Object
 * @param {number} amount - Direction and
 *  amount to zoom
 * @param {number} duation - length of animation
 * @param {array} center - point to center zoom
 *
 * @returns {void}
 */
export function mapUtilZoomAction(map, amount, duration, center) {
  const zoomDuration = duration || ZOOM_DURATION;
  const centerPoint = center || undefined;
  const view = map.getView();
  const zoom = view.getZoom();
  view.animate({
    zoom: zoom + amount,
    duration: zoomDuration,
    center: centerPoint,
  });
}
export function getActiveLayerGroup(map, layerGroupString) {
  let group = null;
  const array = map.getLayers().getArray();
  for (let i = 0, len = array.length; i < len; i++) {
    const layerGroup = array[i];
    if (layerGroup.get('group') === layerGroupString) {
      group = layerGroup;
      break;
    }
  }
  return group;
}
export function clearLayers(map) {
  const layersArray = map.getLayers().getArray();
  layersArray.forEach((layer) => {
    map.removeLayer(layer);
  });
  return map;
}
/**
   * Create a new WMTS Layer
   * @method createLayerWMTS
   * @static
   * @param {object} def - Layer Specs
   * @param {object} options - Layer options
   * @returns {object} OpenLayers WMTS layer
   */
// export function createLayerWMTS(def, options, date, extent, state) {
//   const { config } = state;
//   const source = config.sources[def.source];
//   const { day } = options;
//   if (!source) {
//     throw new Error(`${def.id}: Invalid source: ${def.source}`);
//   }
//   const matrixSet = source.matrixSets[def.matrixSet];
//   if (!matrixSet) {
//     throw new Error(`${def.id}: Undefined matrix set: ${def.matrixSet}`);
//   }
//   const { tileMatrices, resolutions, tileSize } = matrixSet;
//   const { origin, extent } = calcExtentsFromLimits(matrixSet, def.matrixSetLimits, day, proj);

//   const sizes = !tileMatrices ? [] : tileMatrices.map(({ matrixWidth, matrixHeight }) => [matrixWidth, -matrixHeight]);
//   const tileGridOptions = {
//     origin: options.origin || [extent[0] + 180, 90],
//     extent,
//     sizes,
//     resolutions,
//     matrixIds: def.matrixIds || resolutions.map((set, index) => index),
//     tileSize: tileSize[0],
//   };
//   const urlParameters = `?TIME=${util.toISOStringSeconds(util.roundTimeOneMinute(date))}`;
//   const sourceOptions = {
//     url: source.url + urlParameters,
//     layer: def.layer || def.id,
//     cacheSize: 4096,
//     crossOrigin: 'anonymous',
//     format: def.format,
//     transition: 0,
//     matrixSet: matrixSet.id,
//     tileGrid: new OlTileGridWMTS(tileGridOptions),
//     wrapX: false,
//     style: typeof def.style === 'undefined' ? 'default' : def.style,
//   };
//   if (isPaletteActive(def.id, options.group, state)) {
//     const lookup = getPaletteLookup(def.id, options.group, state);
//     sourceOptions.tileClass = lookupFactory(lookup, sourceOptions);
//   }
//   return new OlLayerTile({
//     preload: Infinity,
//     extent,
//     source: new OlSourceWMTS(sourceOptions),
//   });
// }
/**
     * Create a new Vector Layer
     *
     * @method createLayerVector
     * @static
     * @param {object} def - Layer Specs
     * @param {object} options - Layer options
     * @returns {object} OpenLayers Vector layer
     */
// export function createLayerVector(def, options, date, extent, state) {
//   let urlParameters; let gridExtent; let matrixIds; let start; let
//     layerExtent;
//   const { proj, config, compare } = state;
//   const selectedProj = proj.selected;
//   const activeDateStr = compare.isCompareA ? 'selected' : 'selectedB';
//   const activeGroupStr = options.group ? options.group : compare.activeString;
//   const source = config.sources[def.source];
//   const matrixSet = source.matrixSets[def.matrixSet];
//   gridExtent = selectedProj.maxExtent;
//   layerExtent = gridExtent;
//   start = [selectedProj.maxExtent[0], selectedProj.maxExtent[3]];

//   if (!source) {
//     throw new Error(`${def.id}: Invalid source: ${def.source}`);
//   }

//   if (!matrixSet) {
//     throw new Error(`${def.id}: Undefined matrix set: ${def.matrixSet}`);
//   }
//   if (typeof def.matrixIds === 'undefined') {
//     matrixIds = [];
//     lodashEach(matrixSet.resolutions, (resolution, index) => {
//       matrixIds.push(index);
//     });
//   } else {
//     matrixIds = def.matrixIds;
//   }

//   if (day) {
//     if (day === 1) {
//       layerExtent = [-250, -90, -180, 90];
//       start = [-180, 90];
//       gridExtent = [110, -90, 180, 90];
//     } else {
//       gridExtent = [-180, -90, -110, 90];
//       layerExtent = [180, -90, 250, 90];
//       start = [-180, 90];
//     }
//   }

//   const layerName = def.layer || def.id;
//   const tms = def.matrixSet;

//   date = options.date || state.date[activeDateStr];
//   if (day && def.wrapadjacentdays) {
//     date = util.dateAdd(date, 'day', day);
//   }

//   urlParameters = `${'?'
//         + 'TIME='}${
//     util.toISOStringSeconds(util.roundTimeOneMinute(date))
//   }&layer=${
//     layerName
//   }&tilematrixset=${
//     tms
//   }&Service=WMTS`
//         + '&Request=GetTile'
//         + '&Version=1.0.0'
//         + '&FORMAT=application%2Fvnd.mapbox-vector-tile'
//         + '&TileMatrix={z}&TileCol={x}&TileRow={y}';
//   const wrapX = !!(day === 1 || day === -1);
//   const sourceOptions = new SourceVectorTile({
//     url: source.url + urlParameters,
//     layer: layerName,
//     day,
//     format: new MVT(),
//     matrixSet: tms,
//     wrapX,
//     tileGrid: new OlTileGridTileGrid({
//       extent: gridExtent,
//       resolutions: matrixSet.resolutions,
//       tileSize: matrixSet.tileSize,
//       origin: start,
//     }),
//   });

//   const layer = new LayerVectorTile({
//     extent: layerExtent,
//     source: sourceOptions,
//     renderMode: wrapX ? 'image' : 'hybrid', // Todo: revert to just 'image' when styles are updated
//   });

//   if (config.vectorStyles && def.vectorStyle && def.vectorStyle.id) {
//     const { vectorStyles } = config;
//     let vectorStyleId;

//     vectorStyleId = def.vectorStyle.id;
//     if (state.layers[activeGroupStr]) {
//       const layers = state.layers[activeGroupStr];
//       layers.forEach((layer) => {
//         if (layer.id === layerName && layer.custom) {
//           vectorStyleId = layer.custom;
//         }
//       });
//     }
//     setStyleFunction(def, vectorStyleId, vectorStyles, layer, state);
//   }
//   layer.wrap = day;
//   return layer;
// }
/**
     * Determine the extent based on TileMatrixSetLimits defined in GetCapabilities response
     * @param {*} matrixSet - from GetCapabilities
     * @param {*} matrixSetLimits - from GetCapabilities
     * @param {*} day
     * @param {*} proj - current projection
     */
const calcExtentsFromLimits = (matrixSet, matrixSetLimits, day, proj) => {
  let extent; let
    origin;

  switch (day) {
    case 1:
      extent = [-250, -90, -180, 90];
      origin = [-540, 90];
      break;
    case -1:
      extent = [180, -90, 250, 90];
      origin = [180, 90];
      break;
    default:
      extent = proj.maxExtent;
      origin = [extent[0], extent[3]];
      break;
  }

  const resolutionLen = matrixSet.resolutions.length;
  const setlimitsLen = matrixSetLimits && matrixSetLimits.length;

  // If number of set limits doens't match sets, we are assuming this product
  // crosses the antimeridian and don't have a reliable way to calculate a single
  // extent based on multiple set limits.
  if (!matrixSetLimits || setlimitsLen !== resolutionLen || day) {
    return { origin, extent };
  }

  const limitIndex = resolutionLen - 1;
  const resolution = matrixSet.resolutions[limitIndex];
  const tileWidth = matrixSet.tileSize[0] * resolution;
  const tileHeight = matrixSet.tileSize[1] * resolution;
  const {
    minTileCol,
    maxTileRow,
    maxTileCol,
    minTileRow,
  } = matrixSetLimits[limitIndex];
  const minX = extent[0] + (minTileCol * tileWidth);
  const minY = extent[3] - ((maxTileRow + 1) * tileHeight);
  const maxX = extent[0] + ((maxTileCol + 1) * tileWidth);
  const maxY = extent[3] - (minTileRow * tileHeight);

  return {
    origin,
    extent: [minX, minY, maxX, maxY],
  };
};

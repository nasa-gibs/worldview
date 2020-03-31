import OlTileGridWMTS from 'ol/tilegrid/WMTS';
import OlSourceWMTS from 'ol/source/WMTS';
import OlLayerTile from 'ol/layer/Tile';
import OlSourceTileWMS from 'ol/source/TileWMS';
import OlTileGridTileGrid from 'ol/tilegrid/TileGrid';
import util from '../../util/util';
// import MVT from 'ol/format/MVT';
// import LayerVectorTile from 'ol/layer/VectorTile';
// import SourceVectorTile from 'ol/source/VectorTile';
// import { lookupFactory } from '../ol/lookupimagetile';

import { promiseLayerGroup } from './util';

/*
 * @method promiseImageryForTime
 * @param  {object} time of data to be displayed on the map.
 * @return {object}      Promise.all
 */
export function promiseImageryForTime(date, layers, state) {
  const { map } = state;
  const { cache } = map.ui;
  const mapUi = map.ui;
  const selectedMap = map.ui.selected;
  const { pixelRatio, viewState } = selectedMap.frameState_; // OL object describing the current map frame

  const promiseArray = layers.map((def) => {
    const key = mapUi.layerKey(def, { date }, state);
    let layer = cache.getItem(key);

    if (!layer) {
      layer = mapUi.createLayer(def, { date, precache: true });
    }
    return promiseLayerGroup(layer, viewState, pixelRatio, selectedMap, def);
  });
  return new Promise((resolve) => {
    Promise.all(promiseArray).then(() => resolve(date));
  });
}
/**
   * Create a new WMS Layer
   *
   * @method createLayerWMTS
   * @static
   * @param {object} def - Layer Specs
   * @param {object} options - Layer options
   * @returns {object} OpenLayers WMS layer
   */
export function createLayerWMS(def, options, date, extent, state) {
  const { proj, config } = state;
  const selectedProj = proj.selected;
  const source = config.sources[def.source];
  let urlParameters;
  let res;

  res = selectedProj.resolutions;
  if (!source) {
    throw new Error(`${def.id}: Invalid source: ${def.source}`);
  }

  const transparent = def.format === 'image/png';
  if (selectedProj.id === 'geographic') {
    res = [
      0.28125,
      0.140625,
      0.0703125,
      0.03515625,
      0.017578125,
      0.0087890625,
      0.00439453125,
      0.002197265625,
      0.0010986328125,
      0.00054931640625,
      0.00027465820313,
    ];
  }
  // if (day) {
  //   if (day === 1) {
  //     extent = [-250, -90, -180, 90];
  //     start = [-540, 90];
  //   } else {
  //     extent = [180, -90, 250, 90];
  //     start = [180, 90];
  //   }
  // }
  const parameters = {
    LAYERS: def.layer || def.id,
    FORMAT: def.format,
    TRANSPARENT: transparent,
    VERSION: '1.1.1',
  };
  if (def.styles) {
    parameters.STYLES = def.styles;
  }

  urlParameters = '';

  // date = options.date || state.date[activeDateStr];
  // if (day && def.wrapadjacentdays) {
  //   date = util.dateAdd(date, 'day', day);
  // }
  urlParameters = `?TIME=${util.toISOStringSeconds(util.roundTimeOneMinute(date))}`;

  const sourceOptions = {
    url: source.url + urlParameters,
    cacheSize: 4096,
    wrapX: true,
    style: 'default',
    crossOrigin: 'anonymous',
    params: parameters,
    transition: 0,
    tileGrid: new OlTileGridTileGrid({
      origin: options.origin || [extent[0] + 180, 90],
      resolutions: res,
    }),
  };
  // if (isPaletteActive(def.id, options.group, state)) {
  //   const lookup = getPaletteLookup(def.id, options.group, state);
  //   sourceOptions.tileClass = lookupFactory(lookup, sourceOptions);
  // }
  const layer = new OlLayerTile({
    preload: Infinity,
    extent,
    source: new OlSourceTileWMS(sourceOptions),
  });
  return layer;
}
/**
   * Create a new WMTS Layer
   * @method createLayerWMTS
   * @static
   * @param {object} def - Layer Specs
   * @param {object} options - Layer options
   * @returns {object} OpenLayers WMTS layer
   */
export function createLayerWMTS(def, options, date, extent, state) {
  const { config } = state;
  const source = config.sources[def.source];
  if (!source) {
    throw new Error(`${def.id}: Invalid source: ${def.source}`);
  }
  const matrixSet = source.matrixSets[def.matrixSet];
  if (!matrixSet) {
    throw new Error(`${def.id}: Undefined matrix set: ${def.matrixSet}`);
  }
  if (def.period === 'subdaily') {
    // date = self.getRequestDates(def, options).closestDate;
    // date = new Date(date.getTime());
  }
  // if (day && def.wrapadjacentdays && def.period !== 'subdaily') {
  // date = util.dateAdd(date, 'day', day);
  // }
  const { tileMatrices, resolutions, tileSize } = matrixSet;
  const sizes = !tileMatrices ? [] : tileMatrices.map(({ matrixWidth, matrixHeight }) => [matrixWidth, -matrixHeight]);
  const tileGridOptions = {
    origin: options.origin || [extent[0] + 180, 90],
    extent,
    sizes,
    resolutions,
    matrixIds: def.matrixIds || resolutions.map((set, index) => index),
    tileSize: tileSize[0],
  };
  const urlParameters = `?TIME=${util.toISOStringSeconds(util.roundTimeOneMinute(date))}`;
  const sourceOptions = {
    url: source.url + urlParameters,
    layer: def.layer || def.id,
    cacheSize: 4096,
    crossOrigin: 'anonymous',
    format: def.format,
    transition: 0,
    matrixSet: matrixSet.id,
    tileGrid: new OlTileGridWMTS(tileGridOptions),
    wrapX: false,
    style: typeof def.style === 'undefined' ? 'default' : def.style,
  };
  // if (isPaletteActive(def.id, options.group, state)) {
  //   const lookup = getPaletteLookup(def.id, options.group, state);
  //   sourceOptions.tileClass = lookupFactory(lookup, sourceOptions);
  // }
  return new OlLayerTile({
    preload: Infinity,
    extent,
    source: new OlSourceWMTS(sourceOptions),
  });
}
/**
   * Create a new Vector Layer
   *
   * @method createLayerVector
   * @static
   * @param {object} def - Layer Specs
   * @param {object} options - Layer options
   * @returns {object} OpenLayers Vector layer
   */
export function createLayerVector(def, options, date, extent, state) {
  // let urlParameters; let gridExtent; let matrixIds; let start; let
  //   layerExtent;
  // const { proj, config, compare } = state;
  // const selectedProj = proj.selected;
  // const activeGroupStr = options.group ? options.group : compare.activeString;
  // const source = config.sources[def.source];
  // const matrixSet = source.matrixSets[def.matrixSet];
  // gridExtent = selectedProj.maxExtent;
  // layerExtent = gridExtent;
  // start = [selectedProj.maxExtent[0], selectedProj.maxExtent[3]];

  // if (!source) {
  //   throw new Error(`${def.id}: Invalid source: ${def.source}`);
  // }

  // if (!matrixSet) {
  //   throw new Error(`${def.id}: Undefined matrix set: ${def.matrixSet}`);
  // }
  // if (typeof def.matrixIds === 'undefined') {
  //   matrixIds = [];
  //   lodashEach(matrixSet.resolutions, (resolution, index) => {
  //     matrixIds.push(index);
  //   });
  // } else {
  //   matrixIds = def.matrixIds;
  // }

  // if (day) {
  //   if (day === 1) {
  //     layerExtent = [-250, -90, -180, 90];
  //     start = [-180, 90];
  //     gridExtent = [110, -90, 180, 90];
  //   } else {
  //     gridExtent = [-180, -90, -110, 90];
  //     layerExtent = [180, -90, 250, 90];
  //     start = [-180, 90];
  //   }
  // }

  // const layerName = def.layer || def.id;
  // const tms = def.matrixSet;

  // date = options.date || state.date[activeDateStr];
  // if (day && def.wrapadjacentdays) {
  //   date = util.dateAdd(date, 'day', day);
  // }

  // urlParameters = `${'?'
  //     + 'TIME='}${
  //   util.toISOStringSeconds(util.roundTimeOneMinute(date))
  // }&layer=${
  //   layerName
  // }&tilematrixset=${
  //   tms
  // }&Service=WMTS`
  //     + '&Request=GetTile'
  //     + '&Version=1.0.0'
  //     + '&FORMAT=application%2Fvnd.mapbox-vector-tile'
  //     + '&TileMatrix={z}&TileCol={x}&TileRow={y}';
  // const wrapX = !!(day === 1 || day === -1);
  // const sourceOptions = new SourceVectorTile({
  //   url: source.url + urlParameters,
  //   layer: layerName,
  //   day,
  //   format: new MVT(),
  //   matrixSet: tms,
  //   wrapX,
  //   tileGrid: new OlTileGridTileGrid({
  //     extent: gridExtent,
  //     resolutions: matrixSet.resolutions,
  //     tileSize: matrixSet.tileSize,
  //     origin: start,
  //   }),
  // });

  // const layer = new LayerVectorTile({
  //   extent: layerExtent,
  //   source: sourceOptions,
  //   renderMode: wrapX ? 'image' : 'hybrid', // Todo: revert to just 'image' when styles are updated
  // });

  // if (config.vectorStyles && def.vectorStyle && def.vectorStyle.id) {
  //   const { vectorStyles } = config;
  //   let vectorStyleId;

  //   vectorStyleId = def.vectorStyle.id;
  //   if (state.layers[activeGroupStr]) {
  //     const layers = state.layers[activeGroupStr];
  //     layers.forEach((layer) => {
  //       if (layer.id === layerName && layer.custom) {
  //         vectorStyleId = layer.custom;
  //       }
  //     });
  //   }
  //   setStyleFunction(def, vectorStyleId, vectorStyles, layer, state);
  // }
  // layer.wrap = day;
  // return layer;
}

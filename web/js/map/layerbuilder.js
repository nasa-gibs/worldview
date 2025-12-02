/* eslint-disable import/no-duplicates */
/* eslint-disable no-multi-assign */
import OlTileGridWMTS from 'ol/tilegrid/WMTS';
import OlSourceWMTS from 'ol/source/WMTS';
import OlSourceTileWMS from 'ol/source/TileWMS';
import OlSourceXYZ from 'ol/source/XYZ';
import OlLayerGroup from 'ol/layer/Group';
import OlLayerTile from 'ol/layer/Tile';
import { get } from 'ol/proj';
import { TileGrid as OlTileGridTileGrid, createXYZ } from 'ol/tilegrid';
import MVT from 'ol/format/MVT';
import GeoJSON from 'ol/format/GeoJSON';
import SourceVectorTile from 'ol/source/VectorTile';
import OlLayerVector from 'ol/layer/Vector';
import OlSourceVector from 'ol/source/Vector';
import LayerVectorTile from 'ol/layer/VectorTile';
import {
  Circle, Fill, Stroke, Style,
} from 'ol/style';
import ImageLayer from 'ol/layer/Image';
import Static from 'ol/source/ImageStatic';
import lodashMerge from 'lodash/merge';
import lodashEach from 'lodash/each';
import lodashGet from 'lodash/get';
import lodashCloneDeep from 'lodash/cloneDeep';
import { applyBackground, applyStyle as olmsApplyStyle } from 'ol-mapbox-style';
import util from '../util/util';
import lookupFactory from '../ol/lookupimagetile';
import granuleLayerBuilder from './granule/granule-layer-builder';
import { getGranuleTileLayerExtent } from './granule/util';
import {
  createVectorUrl,
  getGeographicResolutionWMS,
  mergeBreakpointLayerAttributes,
} from './util';
import { datesInDateRanges, prevDateInDateRange } from '../modules/layers/util';
import { getSelectedDate } from '../modules/date/selectors';
import {
  isActive as isPaletteActive,
  getKey as getPaletteKeys,
  getLookup as getPaletteLookup,
} from '../modules/palettes/selectors';
import {
  isActive as isVectorStyleActive,
  getKey as getVectorStyleKeys,
  applyStyle,
} from '../modules/vector-styles/selectors';
import { nearestInterval } from '../modules/layers/util';
import {
  LEFT_WING_EXTENT, RIGHT_WING_EXTENT, LEFT_WING_ORIGIN, RIGHT_WING_ORIGIN, CENTER_MAP_ORIGIN,
} from '../modules/map/constants';

const componentToHex = (c) => {
  const hex = c.toString(16);
  return hex.length === 1 ? `0${hex}` : hex;
};

export default function mapLayerBuilder(config, cache, store) {
  /**
   * Return a layer, or layergroup, created with the supplied function
   * @param {*} createLayerFunc
   * @param {*} def
   * @param {*} options
   * @param {*} attributes
   * @param {*} wrapLayer
   */
  const getLayer = async (createLayerFunc, def, options, attributes, wrapLayer) => {
    const state = store.getState();
    const layer = await createLayerFunc(def, options, null, state, attributes);
    layer.wv = attributes;
    if (!wrapLayer) {
      return layer;
    }
    const layerNext = await createLayerFunc(def, options, 1, state, attributes);
    const layerPrior = await createLayerFunc(def, options, -1, state, attributes);

    layerPrior.wv = attributes;
    layerNext.wv = attributes;
    return new OlLayerGroup({
      layers: [layer, layerNext, layerPrior],
    });
  };

  /**
   * For subdaily layers, if the layer date is within 30 minutes of current
   * time, set expiration to ten minutes from now
   */
  const getCacheOptions = (period, date) => {
    const tenMin = 10 * 60000;
    const thirtyMin = 30 * 60000;
    const now = Date.now();
    const recentTime = Math.abs(now - date.getTime()) < thirtyMin;
    if (period !== 'subdaily' || !recentTime) {
      return {};
    }
    return {
      expirationAbsolute: new Date(now + tenMin),
    };
  };

  /**
   *
   * @function layerKey
   * @static
   * @param {Object} def - Layer properties
   * @param {number} options - Layer options
   * @param {boolean} precache
   * @returns {object} layer key Object
   */
  const layerKey = (def, options, state) => {
    const { compare } = state;
    let date;
    const layerId = def.id;
    const projId = state.proj.id;
    let style = '';
    const activeGroupStr = options.group ? options.group : compare.activeString;

    // Don't key by time if this is a static layer
    if (def.period) {
      const isSubdaily = def.period === 'subdaily';
      date = util.toISOStringSeconds(util.roundTimeOneMinute(options.date), !isSubdaily);
    }
    if (isPaletteActive(def.id, activeGroupStr, state)) {
      style = getPaletteKeys(def.id, undefined, state);
    }
    if (isVectorStyleActive(def.id, activeGroupStr, state)) {
      style = getVectorStyleKeys(def.id, undefined, state);
    }
    return [layerId, projId, date, style, activeGroupStr].join(':');
  };

  /**
   * Returns the closest date, from the layer's array of availableDates
   *
   * @param  {object} def     Layer definition
   * @param  {object} options Layer options
   * @return {object}         Closest date
   */
  const getRequestDates = (def, options) => {
    const state = store.getState();
    const { date } = state;
    const { appNow } = date;
    const stateCurrentDate = new Date(getSelectedDate(state));
    const previousLayer = options.previousLayer || {};
    let closestDate = options.date || stateCurrentDate;

    let previousDateFromRange;
    let previousLayerDate = previousLayer.previousDate;
    let nextLayerDate = previousLayer.nextDate;

    const dateTime = closestDate.getTime();
    // if current date is outside previous and next available dates, recheck date range
    if (previousLayerDate && nextLayerDate
      && dateTime > previousLayerDate.getTime()
      && dateTime < nextLayerDate.getTime()
    ) {
      previousDateFromRange = previousLayerDate;
    } else {
      const { dateRanges, ongoing, period } = def;
      let dateRange;
      if (!ongoing) {
        dateRange = datesInDateRanges(def, closestDate);
      } else {
        let endDateLimit;
        let startDateLimit;

        let interval = 1;
        if (dateRanges && dateRanges.length > 0) {
          for (let i = 0; i < dateRanges.length; i += 1) {
            const d = dateRanges[i];
            const int = Number(d.dateInterval);
            if (int > interval) {
              interval = int;
            }
          }
        }

        if (period === 'daily') {
          endDateLimit = util.dateAdd(closestDate, 'day', interval);
          startDateLimit = util.dateAdd(closestDate, 'day', -interval);
        } else if (period === 'monthly') {
          endDateLimit = util.dateAdd(closestDate, 'month', interval);
          startDateLimit = util.dateAdd(closestDate, 'month', -interval);
        } else if (period === 'yearly') {
          endDateLimit = util.dateAdd(closestDate, 'year', interval);
          startDateLimit = util.dateAdd(closestDate, 'year', -interval);
        } else {
          endDateLimit = new Date(closestDate);
          startDateLimit = new Date(closestDate);
        }
        dateRange = datesInDateRanges(def, closestDate, startDateLimit, endDateLimit, appNow);
      }
      const { next, previous } = prevDateInDateRange(def, closestDate, dateRange);
      previousDateFromRange = previous;
      previousLayerDate = previous;
      nextLayerDate = next;
    }

    if (def.period === 'subdaily') {
      closestDate = def.id.includes('TEMPO') ? closestDate : nearestInterval(def, closestDate);
    } else if (previousDateFromRange) {
      closestDate = util.clearTimeUTC(previousDateFromRange);
    } else {
      closestDate = util.clearTimeUTC(closestDate);
    }

    return { closestDate, previousDate: previousLayerDate, nextDate: nextLayerDate };
  };

  const createStaticImageLayer = async() => {
    const state = store.getState();
    const { proj: { selected: { id, crs, maxExtent } } } = state;

    const projectionURL = `images/map/bluemarble-${id}.jpg`;

    const layer = new ImageLayer({
      source: new Static({
        url: projectionURL,
        projection: crs,
        imageExtent: maxExtent,
      }),
    });

    return layer;
  };

  /**
   * Create a new OpenLayers Layer
   *
   * @method createLayer
   * @static
   * @param {object} def - Layer Specs
   * @param {object} options - Layer options
   * @returns {object} OpenLayers layer
   */
  const createLayer = async (def, options = {}) => {
    const state = store.getState();
    const { compare: { activeString } } = state;
    const { ui: { isKioskModeActive, displayStaticMap } } = state;

    options.group = options.group || activeString;

    // if gibs/dns failure, display static image layer
    if (displayStaticMap && isKioskModeActive) {
      const layer = await createStaticImageLayer();
      return layer;
    }

    const {
      closestDate,
      nextDate,
      previousDate,
    } = getRequestDates(def, options);
    const date = closestDate;
    if (date && !options.date) {
      options.date = date;
    }
    const dateOptions = { date, nextDate, previousDate };
    const key = layerKey(def, options, state);
    // eslint-disable-next-line no-use-before-define
    const layer = await createLayerWrapper(def, key, options, dateOptions);

    return layer;
  };

  /**
   * Determine the extent based on TileMatrixSetLimits defined in GetCapabilities response
   * @param {*} matrixSet - from GetCapabilities
   * @param {*} matrixSetLimits - from GetCapabilities
   * @param {*} day
   * @param {*} proj - current projection
   */
  const calcExtentsFromLimits = (matrixSet, matrixSetLimits, day, proj) => {
    let extent;
    let origin;

    switch (day) {
      case 1:
        extent = LEFT_WING_EXTENT;
        origin = LEFT_WING_ORIGIN;
        break;
      case -1:
        extent = RIGHT_WING_EXTENT;
        origin = RIGHT_WING_ORIGIN;
        break;
      default:
        extent = proj.maxExtent;
        origin = [extent[0], extent[3]];
        break;
    }

    const resolutionLen = matrixSet.resolutions.length;
    const setlimitsLen = matrixSetLimits && matrixSetLimits.length;

    // If number of set limits doesn't match sets, we are assuming this product
    // crosses the anti-meridian and don't have a reliable way to calculate a single
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

  /**
   * Create a new WMTS Layer
   * @method createLayerWMTS
   * @static
   * @param {object} def - Layer Specs
   * @param {object} options - Layer options
   * @param {number/null} day
   * @param {object} state
   * @returns {object} OpenLayers WMTS layer
   */
  const createLayerWMTS = (def, options, day, state) => {
    const { proj } = state;
    const {
      id, layer, format, matrixIds, matrixSet, matrixSetLimits, period, source, style, wrapadjacentdays, type,
    } = def;
    const configSource = config.sources[source];
    const { date, polygon, shifted } = options;
    const isSubdaily = period === 'subdaily';
    const isGranule = type === 'granule';

    if (!source) {
      throw new Error(`${id}: Invalid source: ${source}`);
    }
    const configMatrixSet = configSource.matrixSets[matrixSet];
    if (!configMatrixSet) {
      throw new Error(`${id}: Undefined matrix set: ${matrixSet}`);
    }

    let layerDate = date || getSelectedDate(state);
    if (isSubdaily && !layerDate) {
      layerDate = getRequestDates(def, options).closestDate;
      layerDate = new Date(layerDate.getTime());
    }
    if (day && wrapadjacentdays && !isSubdaily) {
      layerDate = util.dateAdd(layerDate, 'day', day);
    }

    const { tileMatrices, resolutions, tileSize } = configMatrixSet;
    const { origin, extent } = calcExtentsFromLimits(configMatrixSet, matrixSetLimits, day, proj.selected);
    const sizes = !tileMatrices ? [] : tileMatrices.map(({ matrixWidth, matrixHeight }) => [matrixWidth, matrixHeight]);

    // Also need to shift this if granule is shifted
    const tileGridOptions = {
      origin: shifted ? RIGHT_WING_ORIGIN : origin,
      extent: shifted ? RIGHT_WING_EXTENT : extent,
      sizes,
      resolutions,
      matrixIds: matrixIds || resolutions.map((set, index) => index),
      tileSize: tileSize[0],
    };

    layerDate.setSeconds(59); // force currently selected time to be 59 seconds. This is to compensate for the inability to select seconds in the timeline
    const urlParameters = `?TIME=${util.toISOStringSeconds(layerDate, !isSubdaily)}`;
    const sourceURL = def.sourceOverride || configSource.url;
    const sourceOptions = {
      url: sourceURL + urlParameters,
      layer: layer || id,
      cacheSize: 4096,
      crossOrigin: 'anonymous',
      format,
      transition: isGranule ? 350 : 0,
      matrixSet: configMatrixSet.id,
      tileGrid: new OlTileGridWMTS(tileGridOptions),
      wrapX: false,
      style: typeof style === 'undefined' ? 'default' : style,
    };
    if (isPaletteActive(id, options.group, state)) {
      const lookup = getPaletteLookup(id, options.group, state);
      sourceOptions.tileClass = lookupFactory(lookup, sourceOptions);
    }
    const tileSource = new OlSourceWMTS(sourceOptions);

    const granuleExtent = polygon && getGranuleTileLayerExtent(polygon, extent);

    return new OlLayerTile({
      extent: polygon ? granuleExtent : extent,
      preload: 0,
      source: tileSource,
    });
  };

  const { getGranuleLayer } = granuleLayerBuilder(cache, store, createLayerWMTS);

  /**
   * Create a new WMS Layer
   *
   * @method createLayerWMS
   * @static
   * @param {object} def - Layer Specs
   * @param {object} options - Layer options
   * @returns {object} OpenLayers WMS layer
   */
  const createLayerWMS = (def, options, day, state) => {
    const { proj } = state;
    const selectedProj = proj.selected;
    let urlParameters;
    let date;
    let extent;
    let start;
    let res;
    const isSubdaily = def.period === 'subdaily';

    const source = config.sources[def.source];
    extent = selectedProj.maxExtent;
    start = [selectedProj.maxExtent[0], selectedProj.maxExtent[3]];
    res = selectedProj.resolutions;
    if (!source) {
      throw new Error(`${def.id}: Invalid source: ${def.source}`);
    }

    const transparent = def.format === 'image/png';
    if (selectedProj.id === 'geographic') {
      res = getGeographicResolutionWMS(def.tileSize);
    }
    if (day) {
      if (day === 1) {
        extent = LEFT_WING_EXTENT;
        start = LEFT_WING_ORIGIN;
      } else {
        extent = RIGHT_WING_EXTENT;
        start = RIGHT_WING_ORIGIN;
      }
    }
    const parameters = {
      LAYERS: def.layer || def.id,
      FORMAT: def.format,
      TRANSPARENT: transparent,
      VERSION: '1.1.1',
    };
    if (def.source === 'EUMETSAT:wms') {
      parameters.VERSION = '1.3.0';
    }
    if (def.styles) {
      parameters.STYLES = def.styles;
    }

    urlParameters = '';

    date = options.date || getSelectedDate(state);
    if (day && def.wrapadjacentdays) {
      date = util.dateAdd(date, 'day', day);
    }
    urlParameters = `?TIME=${util.toISOStringSeconds(util.roundTimeOneMinute(date), !isSubdaily)}`;

    const sourceOptions = {
      url: source.url + urlParameters,
      cacheSize: 4096,
      wrapX: true,
      style: 'default',
      crossOrigin: 'anonymous',
      params: parameters,
      transition: 0,
      tileGrid: new OlTileGridTileGrid({
        origin: start,
        resolutions: res,
        tileSize: def.tileSize || [512, 512],
      }),
    };
    if (isPaletteActive(def.id, options.group, state)) {
      const lookup = getPaletteLookup(def.id, options.group, state);
      sourceOptions.tileClass = lookupFactory(lookup, sourceOptions);
    }
    const resolutionBreakPoint = lodashGet(def, `breakPointLayer.projections.${proj.id}.resolutionBreakPoint`);
    const tileSource = new OlSourceTileWMS(sourceOptions);

    const layer = new OlLayerTile({
      preload: 0,
      extent,
      ...!!resolutionBreakPoint && { minResolution: resolutionBreakPoint },
      source: tileSource,
    });
    layer.isWMS = true;
    return layer;
  };

  /**
    *
    * @param {object} def - Layer Specs
    * @param {object} options - Layer options
    * @param {number} day
    * @param {object} state
    * @param {object} attributes
    */
  const createLayerVectorAeronet = (def, options, day, state, attributes) => {
    const { proj, animation } = state;
    let date;
    let gridExtent;
    let layerExtent;
    const selectedProj = proj.selected;
    const source = config.sources[def.source];
    const animationIsPlaying = animation.isPlaying;
    const isSubdaily = def.period === 'subdaily';
    gridExtent = selectedProj.maxExtent;
    layerExtent = gridExtent;

    if (!source) {
      throw new Error(`${def.id}: Invalid source: ${def.source}`);
    }

    if (day) {
      if (day === 1) {
        layerExtent = LEFT_WING_EXTENT;
        gridExtent = [110, -90, 180, 90];
      } else {
        gridExtent = [-180, -90, -110, 90];
        layerExtent = RIGHT_WING_EXTENT;
      }
    }

    date = getSelectedDate(state);

    if (isSubdaily && !date) {
      date = getRequestDates(def, options).closestDate;
      date = new Date(date.getTime());
    }
    if (day && def.wrapadjacentdays) date = util.dateAdd(date, 'day', day);
    const breakPointLayerDef = def.breakPointLayer;
    const breakPointResolution = lodashGet(def, `breakPointLayer.projections.${proj.id}.resolutionBreakPoint`);

    const vectorSource = new OlSourceVector({
      format: new GeoJSON(),
      loader: async () => {
        // Get data from all locations of the current year (both active and inactive)
        const getAllData = async () => {
          const url = `https://aeronet.gsfc.nasa.gov/Site_Lists_V3/aeronet_locations_v3_${date.getFullYear()}_lev15.txt`;
          const res = await fetch(url);
          const data = await res.text();
          return data;
        };

        // Get data from all active locations given the date
        const getActiveData = async () => {
          const avg = def.id.includes('DAILY') ? 20 : 10;
          const date2 = new Date(date.toString());
          date2.setHours(date.getHours() + 1);
          const urlParameters = `?year=${date.getUTCFullYear()}&month=${date.getUTCMonth() + 1}&day=${date.getUTCDate()}&year2=${date2.getUTCFullYear()}&month2=${date2.getUTCMonth() + 1}&day2=${date2.getUTCDate()}${isSubdaily ? `&hour=${date.getUTCHours()}&hour2=${date2.getUTCHours()}` : ''}&AOD15=1&AVG=${avg}&if_no_html=1`;
          const res = await fetch(`${source.url}${urlParameters}`);
          const data = await res.text();
          return data;
        };

        const allData = await getAllData();
        const activeData = await getActiveData();

        const featuresObj = [];
        const takenNamesActive = {};
        // Split the input data by rows (one data point per row)
        const splitActive = activeData.split('\n');
        if (splitActive.length > 6) {
          // Split the key row into an array of keys
          const key = splitActive[5].split(',');
          // Actual data starts at row index 6, loop through all data points
          for (let i = 6; i < splitActive.length; i += 1) {
            // Split the current data point into each value, and assign them their respective key based on the key from row index 5
            const split2 = splitActive[i].split(',');
            const rowObj = {};
            for (let j = 0; j < split2.length; j += 1) {
              rowObj[key[j]] = split2[j];
            }
            if (!!rowObj.AERONET_Site_Name && rowObj.AERONET_Site_Name !== '' && !takenNamesActive[rowObj.AERONET_Site_Name] && parseInt(rowObj['Date(dd:mm:yyyy)'].split(':')[0], 10) === date.getUTCDate()) {
              featuresObj[rowObj.AERONET_Site_Name] = {};
              featuresObj[rowObj.AERONET_Site_Name].type = 'Feature';
              featuresObj[rowObj.AERONET_Site_Name].geometry = { type: 'Point' };
              featuresObj[rowObj.AERONET_Site_Name].geometry.coordinates = [parseFloat(rowObj['Site_Longitude(Degrees)']), parseFloat(rowObj['Site_Latitude(Degrees)'])];
              featuresObj[rowObj.AERONET_Site_Name].properties = {
                name: rowObj.AERONET_Site_Name,
                value: def.id.includes('ANGSTROM') ? rowObj['440-870_Angstrom_Exponent'] : rowObj.AOD_500nm,
                date: new Date(Date.UTC(rowObj['Date(dd:mm:yyyy)'].split(':')[2], rowObj['Date(dd:mm:yyyy)'].split(':')[1] - 1, rowObj['Date(dd:mm:yyyy)'].split(':')[0], rowObj['Time(hh:mm:ss)'].split(':')[0], rowObj['Time(hh:mm:ss)'].split(':')[1], rowObj['Time(hh:mm:ss)'].split(':')[2])),
              };
              if (featuresObj[rowObj.AERONET_Site_Name].properties.value < 0) {
                delete featuresObj[rowObj.AERONET_Site_Name];
              } else {
                takenNamesActive[rowObj.AERONET_Site_Name] = true;
              }
            }
          }
        }

        const takenNamesAll = {};
        // Split the input data by rows (one data point per row)
        const splitAll = allData.split('\n');
        if (splitAll.length > 2) {
          // Split the key row into an array of keys
          const key = splitAll[1].split(',');
          // Actual data starts at row index 2, loop through all data points
          for (let i = 2; i < splitAll.length; i += 1) {
            // Split the current data point into each value, and assign them their respective key based on the key from row index 1
            const split2 = splitAll[i].split(',');
            const rowObj = {};
            for (let j = 0; j < split2.length; j += 1) {
              rowObj[key[j]] = split2[j];
            }
            if (!!rowObj.Site_Name && rowObj.Site_Name !== '' && !takenNamesAll[rowObj.Site_Name]) {
              if (!featuresObj[rowObj.Site_Name]) {
                featuresObj[rowObj.Site_Name] = {};
              }
              featuresObj[rowObj.Site_Name].type = 'Feature';
              featuresObj[rowObj.Site_Name].geometry = { type: 'Point' };
              featuresObj[rowObj.Site_Name].geometry.coordinates = [parseFloat(rowObj['Longitude(decimal_degrees)']), parseFloat(rowObj['Latitude(decimal_degrees)'])];
              featuresObj[rowObj.Site_Name].properties = {
                ...featuresObj[rowObj.Site_Name].properties,
                name: rowObj.Site_Name,
                active: !!takenNamesActive[rowObj.Site_Name],
                coordinates: [parseFloat(rowObj['Longitude(decimal_degrees)']), parseFloat(rowObj['Latitude(decimal_degrees)'])],
                MAIN_USE: featuresObj[rowObj.Site_Name].properties ? featuresObj[rowObj.Site_Name].properties.value : 'inactivesite',
                date: featuresObj[rowObj.Site_Name].properties ? featuresObj[rowObj.Site_Name].properties.date : new Date(date.toUTCString()),
              };
              takenNamesAll[rowObj.Site_Name] = true;
            }
          }
        }

        const geoJson = {
          type: 'FeatureCollection',
          features: Object.values(featuresObj).sort((a, b) => a.properties.active > b.properties.active),
        };
        const formattedFeatures = vectorSource.getFormat().readFeatures(geoJson);
        vectorSource.addFeatures(formattedFeatures);
      },
    });

    let colors = [];
    let values = [];
    if (state.palettes.rendered[def.id]) {
      colors = state.palettes.rendered[def.id].maps[1].entries.colors;
      values = state.palettes.rendered[def.id].maps[1].entries.values;
    }

    const layer = new OlLayerVector({
      extent: layerExtent,
      source: vectorSource,
      style (feature, resolution) {
        const customStyle = !def.custom || typeof def.custom[0] === 'undefined' ? 'default' : def.custom[0];
        // Access the properties of the feature
        const featureProperties = feature.getProperties();
        // Extract the feature name
        const { active, value } = featureProperties;
        // Define styles based on the feature properties
        const radius = 7;
        let fillColor;
        const strokeColor = 'white';
        if (isPaletteActive(def.id, options.group, state)) {
          const lookup = getPaletteLookup(def.id, options.group, state);
          colors = Object.values(lookup).map((rgbaObj) => `${componentToHex(rgbaObj.r)}${componentToHex(rgbaObj.g)}${componentToHex(rgbaObj.b)}ff`);
        } else if (customStyle !== 'default') {
          colors = state.palettes.custom[customStyle].colors;
        }

        let valueIndex;
        // For active data points, define a color based on their value via the color palette
        if (active) {
          valueIndex = values.findIndex((range) => value >= range[0] && (range.length < 2 || value < range[1]));
          fillColor = `#${colors[valueIndex]}`;
          fillColor = fillColor.substring(0, fillColor.length - 2);
        } else {
          // For inactive data points, either hide or color them gray depending on if disabled
          if (def.disabled === true || (Array.isArray(def.disabled) && def.disabled.includes('0'))) {
            return null;
          }
          valueIndex = -1;
          fillColor = '#808080';
        }
        // Ignore data points that fall outside of the defined range
        if (fillColor === '#000000'
          || (def.min && Array.isArray(def.min) && def.min[0] > parseFloat(value))
          || (def.max && Array.isArray(def.max) && def.max[0] < parseFloat(value))
          || (def.min && !Array.isArray(def.min) && def.min > valueIndex)
          || (def.max && !Array.isArray(def.max) && def.max < valueIndex)) {
          return null;
        }
        // Return the style for the current feature
        return new Style({
          image: new Circle({
            radius,
            fill: new Fill({
              color: fillColor,
            }),
            stroke: new Stroke({
              color: strokeColor,
            }),
          }),
        });
      },
    });

    layer.vectorData = {
      id: def.id,
    };

    layer.wrap = day;
    layer.wv = attributes;
    layer.isVector = true;

    if (breakPointLayerDef && !animationIsPlaying) {
      const newDef = { ...def, ...breakPointLayerDef };
      const wmsLayer = createLayerWMS(newDef, options, day, state);
      const layerGroup = new OlLayerGroup({
        layers: [layer, wmsLayer],
      });
      wmsLayer.wv = attributes;
      return layerGroup;
    }

    if (breakPointResolution && animationIsPlaying) {
      delete breakPointLayerDef.projections[proj.id].resolutionBreakPoint;
      const newDef = { ...def, ...breakPointLayerDef };
      const wmsLayer = createLayerWMS(newDef, options, day, state);
      wmsLayer.wv = attributes;
      return wmsLayer;
    }

    return layer;
  };

  /**
    *
    * @param {object} def - Layer Specs
    * @param {object} options - Layer options
    * @param {number} day
    * @param {object} state
    * @param {object} attributes
    */
  const createLayerVector = (def, options, day, state, attributes) => {
    if (def.source === 'AERONET') {
      return createLayerVectorAeronet(def, options, day, state, attributes);
    }
    const { proj, animation } = state;
    let date;
    let gridExtent;
    let matrixIds;
    let start;
    let layerExtent;
    const selectedProj = proj.selected;
    const source = config.sources[def.source];
    const animationIsPlaying = animation.isPlaying;
    gridExtent = selectedProj.maxExtent;
    layerExtent = gridExtent;
    start = [selectedProj.maxExtent[0], selectedProj.maxExtent[3]];

    if (!source) {
      throw new Error(`${def.id}: Invalid source: ${def.source}`);
    }
    const matrixSet = source.matrixSets[def.matrixSet];
    if (!matrixSet) {
      throw new Error(`${def.id}: Undefined matrix set: ${def.matrixSet}`);
    }
    if (typeof def.matrixIds === 'undefined') {
      matrixIds = [];
      lodashEach(matrixSet.resolutions, (resolution, index) => {
        matrixIds.push(index);
      });
    } else {
      matrixIds = def.matrixIds;
    }

    if (day) {
      if (day === 1) {
        layerExtent = LEFT_WING_EXTENT;
        start = CENTER_MAP_ORIGIN;
        gridExtent = [110, -90, 180, 90];
      } else {
        gridExtent = [-180, -90, -110, 90];
        layerExtent = RIGHT_WING_EXTENT;
        start = CENTER_MAP_ORIGIN;
      }
    }

    const layerName = def.layer || def.id;
    const tileMatrixSet = def.matrixSet;
    date = options.date || getSelectedDate(state);

    if (day && def.wrapadjacentdays) date = util.dateAdd(date, 'day', day);
    const urlParameters = createVectorUrl(date, layerName, tileMatrixSet);
    const wrapX = !!(day === 1 || day === -1);
    const breakPointLayerDef = def.breakPointLayer;
    const breakPointResolution = lodashGet(def, `breakPointLayer.projections.${proj.id}.resolutionBreakPoint`);
    const breakPointType = lodashGet(def, 'breakPointLayer.breakPointType');
    const isMaxBreakPoint = breakPointType === 'max';
    const isMinBreakPoint = breakPointType === 'min';

    const tileSource = new SourceVectorTile({
      url: source.url + urlParameters,
      layer: layerName,
      day,
      format: new MVT(),
      matrixSet: tileMatrixSet,
      wrapX,
      projection: proj.selected.crs,
      tileGrid: new OlTileGridTileGrid({
        extent: gridExtent,
        resolutions: matrixSet.resolutions,
        tileSize: matrixSet.tileSize,
        origin: start,
        sizes: matrixSet.tileMatrices,
      }),
    });

    const sortMethods = {
      descending: (a, b) => a - b,
      ascending: (a, b) => b - a,
    };

    const orderFunction = (a, b) => {
      const { renderOrder } = def;
      if (!renderOrder) return null;
      const { property, order } = renderOrder;
      const aProps = a.getProperties();
      const bProps = b.getProperties();
      const aValue = aProps?.[property] || 0;
      const bValue = bProps?.[property] || 0;

      return sortMethods[order]?.(aValue, bValue);
    };

    const layer = new LayerVectorTile({
      renderOrder: orderFunction,
      extent: layerExtent,
      source: tileSource,
      renderMode: 'vector',
      preload: 0,
      ...isMaxBreakPoint && { maxResolution: breakPointResolution },
      ...isMinBreakPoint && { minResolution: breakPointResolution },
    });
    applyStyle(def, layer, state, options);
    layer.wrap = day;
    layer.wv = attributes;
    layer.isVector = true;

    if (breakPointLayerDef && !animationIsPlaying) {
      const newDef = { ...def, ...breakPointLayerDef };
      const wmsLayer = createLayerWMS(newDef, options, day, state);
      const layerGroup = new OlLayerGroup({
        layers: [layer, wmsLayer],
      });
      wmsLayer.wv = attributes;
      return layerGroup;
    }

    if (breakPointResolution && animationIsPlaying) {
      delete breakPointLayerDef.projections[proj.id].resolutionBreakPoint;
      const newDef = { ...def, ...breakPointLayerDef };
      const wmsLayer = createLayerWMS(newDef, options, day, state);
      wmsLayer.wv = attributes;
      return wmsLayer;
    }

    return layer;
  };

  const createTitilerLayer = async (def, options, day, state) => {
    const { proj: { selected }, date } = state;
    const { maxExtent, crs } = selected;
    const { r, g, b } = def.bandCombo;
    const conceptID = def?.conceptIds?.[0]?.value || def?.collectionConceptID;
    const dateTime = options.group === 'active' ? date.selected?.toISOString().split('T') : date.selectedB?.toISOString().split('T');
    dateTime.pop();
    dateTime.push('00:00:00.000Z');
    const zeroedDate = dateTime.join('T');
    const cmrMaxExtent = [-180, -90, 180, 90];

    const cmrSource = new OlSourceVector({
      format: new GeoJSON(),
      projection: get(crs),
      loader: async (extent, resolution, projection, success, failure) => {
        // clamp extent to maximum extent allowed by the CMR api
        const clampedExtent = extent.map((coord, i) => {
          const condition = i <= 1 ? coord > cmrMaxExtent[i] : coord < cmrMaxExtent[i];
          if (condition) {
            return coord;
          }
          return cmrMaxExtent[i];
        });
        const getGranules = () => {
          const entries = [];
          return async function requestGranules(searchAfter) {
            const headers = {
              'Client-Id': 'Worldview',
            };
            headers['cmr-search-after'] = searchAfter ?? '';
            const url = `https://cmr.earthdata.nasa.gov/search/granules.json?collection_concept_id=${conceptID}&bounding_box=${clampedExtent.join(',')}&temporal=${zeroedDate}/P0Y0M1DT0H0M&pageSize=2000`;
            const cmrRes = await fetch(url, { headers });
            const resHeaders = cmrRes.headers;
            const granules = await cmrRes.json();
            const resEntries = granules?.feed?.entry || [];

            entries.push(...resEntries);

            if (resHeaders.has('cmr-search-after')) {
              await requestGranules(resHeaders.get('cmr-search-after'));
            }
            return entries;
          };
        };

        const granuleGetter = getGranules();
        const granules = await granuleGetter();

        const features = granules.map((granule) => {
          const coords = granule.polygons[0][0].split(' ').reduce((acc, coord, i, arr) => {
            if (i % 2 !== 0) return acc;

            acc.push([arr[i + 1], coord]);

            return acc;
          }, []);

          return {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [coords],
            },
            properties: {
              granuleId: granule.id,
            },
          };
        });

        const geojson = {
          type: 'FeatureCollection',
          features,
        };

        const formatedFeatures = cmrSource.getFormat().readFeatures(geojson);

        cmrSource.addFeatures(formatedFeatures);
        success(formatedFeatures);
      },
    });

    const source = config.sources[def.source];

    const tileUrlFunction = (tileCoord) => {
      const z = tileCoord[0] - 1;
      const x = tileCoord[1];
      const y = tileCoord[2];

      const dateTimeTile = options.group === 'active' ? date.selected?.toISOString().split('T') : date.selectedB?.toISOString().split('T');
      dateTimeTile.pop();
      dateTimeTile.push('00:00:00Z');
      const zeroedDateTile = dateTimeTile.join('T');
      dateTimeTile.pop();
      dateTimeTile.push('23:59:59Z');
      const lastDateTile = dateTimeTile.join('T');

      const assets = [r, g, b, ...def.bandCombo.assets || []].filter((b) => b);

      const params = assets.map((asset) => `bands=${asset}`);
      params.push(`expression=${encodeURIComponent(def?.bandCombo?.expression)}`);
      params.push(`rescale=${encodeURIComponent(def?.bandCombo?.rescale)}`);
      params.push(`colormap_name=${def?.bandCombo?.colormap_name}`);
      params.push(`asset_as_band=${def?.bandCombo?.asset_as_band}`);
      params.push(`bands_regex=${def?.bandCombo?.bands_regex}`);
      params.push(`color_formula=${def?.bandCombo?.color_formula}`);

      const urlParams = `tiles/WGS1984Quad/${z}/${x}/${y}@1x?concept_id=${def.collectionConceptID}&datetime=${zeroedDateTile}/${lastDateTile}&post_process=swir&backend=rasterio&${params.filter((p) => !p.split('=').includes('undefined')).join('&')}`;

      return source.url + urlParams;
    };

    const xyzSourceOptions = {
      crossOrigin: 'anonymous',
      projection: get(crs),
      tileUrlFunction,
    };

    const xyzSource = new OlSourceXYZ(xyzSourceOptions);

    const requestDate = util.toISOStringSeconds(util.roundTimeOneMinute(options.group === 'active' ? date.selected : date.selectedB)).slice(0, 10);
    const className = `${def.id} ${requestDate}`;

    const layer = new OlLayerTile({
      source: xyzSource,
      className,
      minZoom: def.minZoom,
      extent: maxExtent,
    });
    const footprintLayer = new OlLayerVector({
      source: cmrSource,
      className,
      maxZoom: def.minZoom,
    });
    const layerGroup = new OlLayerGroup({
      layers: [footprintLayer, layer],
    });

    return layerGroup;
  };

  const createXYZLayer = (def, options, day, state) => {
    const { proj: { selected }, date } = state;
    const { maxExtent, crs } = selected;

    const source = config.sources[def.source];

    const tileUrlFunction = (tileCoord) => {
      const z = tileCoord[0] - 1;
      const x = tileCoord[1];
      const y = tileCoord[2];

      const urlParams = `${def.layerName}/${z}/${y}/${x}`;

      return `${source?.url}/${urlParams}.png`;
    };

    const xyzSourceOptions = {
      crossOrigin: 'anonymous',
      projection: get(crs),
      tileUrlFunction,
      maxZoom: def.maxZoom,
    };

    const xyzSource = new OlSourceXYZ(xyzSourceOptions);

    const requestDate = util.toISOStringSeconds(util.roundTimeOneMinute(options.group === 'active' ? date.selected : date.selectedB)).slice(0, 10);
    const className = `${def.id} ${requestDate}`;

    const layer = new OlLayerTile({
      source: xyzSource,
      className,
      extent: maxExtent,
    });

    return layer;
  };

  const createIndexedVectorLayer = async (def, options, day, state) => {
    const { proj: { selected } } = state;
    const { crs } = selected;
    const { shifted } = options;
    const {
      layerName,
      serviceName,
      tiles,
      id,
      vectorStyle,
      matrixSet,
      matrixSetLimits,
    } = def;

    const projection = get(crs);
    const tileGrid = createXYZ({
      extent: projection.getExtent(),
      tileSize: [512, 512],
      maxResolution: 180 / 256,
      maxZoom: 22,
    });

    const configSource = config.sources[def.source];
    const configMatrixSet = configSource.matrixSets?.[matrixSet] || {
      resolutions: tileGrid.getResolutions(),
      tileSize: tileGrid.getTileSize(),
    };
    const { extent } = calcExtentsFromLimits(configMatrixSet, matrixSetLimits, day, selected);

    const sourceOptions = {
      url: `${configSource.url}/${layerName}/${serviceName}/${tiles[0]}`,
      projection,
      format: new MVT(),
      tileGrid,
    };
    const source = new SourceVectorTile(sourceOptions);

    const layer = new LayerVectorTile({
      source,
      extent: shifted ? RIGHT_WING_EXTENT : extent,
      className: id,
      declutter: options.group || true,
      renderMode: 'hybrid',
    });

    if (!vectorStyle.url) {
      applyStyle(def, layer, state, options);
    } else {
      await olmsApplyStyle(layer, vectorStyle.url, {
        resolutions: tileGrid.getResolutions(),
        transformRequest(url, type) {
          if (type === 'Source') {
            return new Request(
              url.replace('/VectorTileServer', '/VectorTileServer/'),
            );
          }
        },
      });
      await applyBackground(layer, vectorStyle.url);
    }

    return layer;
  };

  const createLayerCompositeWMTS = async (def, options, day, state) => {
    const { proj } = state;
    const { shifted, date } = options;
    const selectedDate = date || getSelectedDate(state);
    const isoDate = selectedDate.toISOString();
    const selectedDateString = isoDate.split('T')[0].split('-').join('');
    const matchedLayers = def.layers.filter((layerName) => layerName.match(/([0-9])+/g)[0] === selectedDateString);
    // create wmts defs from def.layers
    const wmtsDefs = matchedLayers.map((layerID) => ({
      ...def,
      id: layerID,
      layerName: layerID,
      type: 'wmts',
      layers: undefined,
    }));
    // create layers from defs
    const layers = wmtsDefs.map((wmtsDef) => {
      const {
        matrixSet,
        source,
        layerName,
        format,
        matrixSetLimits,
      } = wmtsDef;
      const configSource = config.sources[source];
      const configMatrixSet = configSource.matrixSets[matrixSet];
      const { extent } = calcExtentsFromLimits(configMatrixSet, matrixSetLimits, day, proj.selected);

      const sourceOptions = {
        url: `${configSource.url}/${layerName}/{z}/{x}/{y}`,
        layer: layerName,
        crossOrigin: 'anonymous',
        format,
        wrapX: false,
        projection: 'EPSG:3857',
        maxZoom: 21,
      };
      const tileSource = new OlSourceXYZ(sourceOptions);

      return new OlLayerTile({
        source: tileSource,
        className: wmtsDef.id,
        extent: shifted ? RIGHT_WING_EXTENT : extent,
      });
    });
    const layer = new OlLayerGroup({ layers });
    return layer;
  };

  /**
   * Create a new OpenLayers Layer
   * @param {object} def
   * @param {object} key
   * @param {object} options
   * @param {object} dateOptions
   * @param {object} granuleAttributes
   * @returns {object} Openlayers TileLayer or LayerGroup
   */
  const createLayerWrapper = async (def, key, options, dateOptions) => {
    const state = store.getState();
    const { sidebar: { activeTab } } = state;
    const proj = state.proj.selected;
    const {
      breakPointLayer,
      id,
      opacity,
      period,
      projections,
      type,
      wrapadjacentdays,
      wrapX,
    } = def;
    const { nextDate, previousDate } = dateOptions;
    let { date } = dateOptions;
    let layer = cache.getItem(key);
    const isGranule = type === 'granule';

    if (!layer || isGranule || def.type === 'titiler') {
      if (!date) date = options.date || getSelectedDate(state);
      const cacheOptions = getCacheOptions(period, date);
      const attributes = {
        id,
        key,
        date,
        proj: proj.id,
        def,
        group: options.group,
        nextDate,
        previousDate,
      };
      def = lodashCloneDeep(def);
      lodashMerge(def, projections[proj.id]);
      if (breakPointLayer) def = mergeBreakpointLayerAttributes(def, proj.id);
      const isDataDownloadTabActive = activeTab === 'download';
      const wrapDefined = wrapadjacentdays === true || wrapX;
      const wrapLayer = proj.id === 'geographic' && !isDataDownloadTabActive && wrapDefined;

      switch (def.type) {
        case 'wmts':
          layer = await getLayer(createLayerWMTS, def, options, attributes, wrapLayer);
          break;
        case 'vector':
          layer = await getLayer(createLayerVector, def, options, attributes, wrapLayer);
          break;
        case 'wms':
          layer = await getLayer(createLayerWMS, def, options, attributes, wrapLayer);
          break;
        case 'titiler':
          layer = await getLayer(createTitilerLayer, def, options, attributes, wrapLayer);
          break;
        case 'xyz':
          layer = await getLayer(createXYZLayer, def, options, attributes, wrapLayer);
          break;
        case 'indexedVector':
          layer = await getLayer(createIndexedVectorLayer, def, options, attributes, wrapLayer);
          break;
        case 'composite:wmts':
          layer = await getLayer(createLayerCompositeWMTS, def, options, attributes, wrapLayer);
          break;
        case 'granule':
          layer = await getGranuleLayer(def, attributes, options);
          break;
        default:
          throw new Error(`Unknown layer type: ${type}`);
      }
      if (def.type !== 'granule') {
        layer.wv = attributes;
        cache.setItem(key, layer, cacheOptions);
        if (def.type !== 'titiler') layer.setVisible(false);
      }
    }
    layer.setOpacity(opacity || 1.0);
    if (breakPointLayer) {
      layer.getLayersArray().forEach((l) => {
        l.setOpacity(opacity || 1.0);
      });
    }
    return layer;
  };

  return {
    layerKey,
    createLayer,
    createLayerWMTS,
  };
}

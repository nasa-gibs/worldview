import util from '../util/util';
import palettes from '../palettes/palettes';
import OlTileGridWMTS from 'ol/tilegrid/WMTS';
import OlSourceWMTS from 'ol/source/WMTS';
import OlSourceTileWMS from 'ol/source/TileWMS';
import OlLayerGroup from 'ol/layer/Group';
import OlLayerTile from 'ol/layer/Tile';
import OlTileGridTileGrid from 'ol/tilegrid/TileGrid';
import MVT from 'ol/format/MVT';
import LayerVectorTile from 'ol/layer/VectorTile';
import SourceVectorTile from 'ol/source/VectorTile';
import Style from 'ol/style/style';
import Circle from 'ol/style/circle';
import Fill from 'ol/style/fill';
import Text from 'ol/style/text';
import Stroke from 'ol/style/stroke';
import lodashCloneDeep from 'lodash/cloneDeep';
import lodashMerge from 'lodash/merge';
import lodashEach from 'lodash/each';
import lodashIsEmpty from 'lodash/isEmpty';
import { lookupFactory } from '../ol/lookupimagetile';
import {
  isActive as isPaletteActive,
  getKey as getPaletteKeys,
  getLookup as getPaletteLookup
} from '../modules/palettes/selectors';

export function mapLayerBuilder(models, config, cache, mapUi, store) {
  var self = {};
  self.init = function(Parent) {
    self.extentLayers = [];
    mapUi.events.on('selecting', hideWrap);
    mapUi.events.on('selectiondone', showWrap);
  };
  /*
   * Create a new OpenLayers Layer
   *
   * @method createLayer
   * @static
   *
   * @param {object} def - Layer Specs
   *
   * @param {object} options - Layer options
   *
   *
   * @returns {object} OpenLayers layer
   */
  self.createLayer = function(def, options) {
    const state = store.getState();
    const activeDateStr = state.compare.isCompareA ? 'selected' : 'selectedB';
    var date, key, group, proj, layer, layerNext, layerPrior, attributes;
    options = options || {};
    group = options.group || null;
    date = self.closestDate(def, options);
    key = self.layerKey(def, options, state);
    proj = state.proj.selected;
    layer = cache.getItem(key);

    if (!layer) {
      // layer is not in the cache
      if (!date) date = options.date || state.date[activeDateStr];
      attributes = {
        id: def.id,
        key: key,
        date: date,
        proj: proj.id,
        def: def,
        group: group
      };
      def = lodashCloneDeep(def);
      lodashMerge(def, def.projections[proj.id]);

      if (def.type === 'wmts') {
        layer = createLayerWMTS(def, options, null, state);
        if (
          proj.id === 'geographic' &&
          (def.wrapadjacentdays === true || def.wrapX)
        ) {
          layerNext = createLayerWMTS(def, options, 1, state);
          layerPrior = createLayerWMTS(def, options, -1, state);

          layer.wv = attributes;
          layerPrior.wv = attributes;
          layerNext.wv = attributes;

          layer = new OlLayerGroup({
            layers: [layer, layerNext, layerPrior]
          });
        }
      } else if (def.type === 'vector') {
        layer = createLayerVector(def, options, null, state);
        if (
          proj.id === 'geographic' &&
          (def.wrapadjacentdays === true || def.wrapX)
        ) {
          layerNext = createLayerVector(def, options, 1, state);
          layerPrior = createLayerVector(def, options, -1, state);

          layer.wv = attributes;
          layerPrior.wv = attributes;
          layerNext.wv = attributes;

          layer = new OlLayerGroup({
            layers: [layer, layerNext, layerPrior]
          });
        }
      } else if (def.type === 'wms') {
        layer = createLayerWMS(def, options, null, state);
        if (
          proj.id === 'geographic' &&
          (def.wrapadjacentdays === true || def.wrapX)
        ) {
          layerNext = createLayerWMS(def, options, 1, state);
          layerPrior = createLayerWMS(def, options, -1, state);

          layer.wv = attributes;
          layerPrior.wv = attributes;
          layerNext.wv = attributes;

          layer = new OlLayerGroup({
            layers: [layer, layerNext, layerPrior]
          });
        }
      } else {
        throw new Error('Unknown layer type: ' + def.type);
      }
      layer.wv = attributes;
      cache.setItem(key, layer);
      layer.setVisible(false);
    }
    layer.setOpacity(def.opacity || 1.0);
    return layer;
  };

  /**
   * Returns the closest date, from the layer's array of availableDates
   *
   * @param  {object} def     Layer definition
   * @param  {object} options Layer options
   * @return {object}         Closest date
   */
  self.closestDate = function(def, options) {
    const state = store.getState();
    const activeDateStr = state.compare.isCompareA ? 'selected' : 'selectedB';
    var date;
    var dateArray = def.availableDates || [];
    if (options.date) {
      if (def.period !== 'subdaily') {
        date = util.clearTimeUTC(new Date(options.date.getTime()));
      } else {
        date = options.date;
        date = util.prevDateInDateRange(
          def,
          date,
          util.datesinDateRanges(def, date, true)
        );
      }
    } else {
      date = new Date(state.date[activeDateStr]);
      // If this not a subdaily layer, truncate the selected time to
      // UTC midnight
      if (def.period !== 'subdaily') {
        date = util.clearTimeUTC(date);
      } else {
        date = util.prevDateInDateRange(
          def,
          date,
          util.datesinDateRanges(def, date, true)
        );
      }
    }
    // Perform extensive checks before finding closest date
    if (
      !options.precache &&
      state.animation.playing === false &&
      state.date.selectedZoom !== 0 &&
      ((def.period === 'daily' && state.date.selectedZoom < 3) ||
        (def.period === 'monthly' && state.date.selectedZoom <= 2) ||
        (def.period === 'yearly' && state.date.selectedZoom === 1))
    ) {
      date = util.prevDateInDateRange(def, date, dateArray);

      // Is current "rounded" previous date not in array of availableDates
      if (date && !dateArray.includes(date)) {
        // Then, update layer object with new array of dates
        def.availableDates = util.datesinDateRanges(def, date, true);
        date = util.prevDateInDateRange(def, date, dateArray);
      }
    }
    return date;
  };

  /*
   * Create a layer key
   *
   * @function layerKey
   * @static
   *
   * @param {Object} def - Layer properties
   * @param {number} options - Layer options
   * @param {boolean} precache
   *
   * @returns {object} layer key Object
   */
  self.layerKey = function(def, options, state) {
    const { compare } = state;
    var date;
    var layerId = def.id;
    var projId = state.proj.id;
    var palette = '';
    const activeGroupStr = options.group ? options.group : compare.activeString;

    // Don't key by time if this is a static layer--it is valid for
    // every date.
    if (def.period) {
      date = util.toISOStringSeconds(
        util.roundTimeOneMinute(self.closestDate(def, options))
      );
    }
    if (isPaletteActive(def.id, activeGroupStr, state)) {
      palette = getPaletteKeys(def.id, undefined, state);
    }
    return [layerId, projId, date, palette, activeGroupStr].join(':');
  };
  /*
   * Create a new WMTS Layer
   *
   * @method createLayerWMTS
   * @static
   *
   * @param {object} def - Layer Specs
   *
   * @param {object} options - Layer options
   *
   *
   * @returns {object} OpenLayers WMTS layer
   */
  var createLayerWMTS = function(def, options, day, state) {
    const activeDateStr = state.compare.isCompareA ? 'selected' : 'selectedB';
    var proj, source, matrixSet, matrixIds, urlParameters, date, extent, start;
    proj = state.proj.selected;
    source = config.sources[def.source];
    extent = proj.maxExtent;
    start = [proj.maxExtent[0], proj.maxExtent[3]];
    if (!source) {
      throw new Error(def.id + ': Invalid source: ' + def.source);
    }
    matrixSet = source.matrixSets[def.matrixSet];
    if (!matrixSet) {
      throw new Error(def.id + ': Undefined matrix set: ' + def.matrixSet);
    }
    if (typeof def.matrixIds === 'undefined') {
      matrixIds = [];
      lodashEach(matrixSet.resolutions, function(resolution, index) {
        matrixIds.push(index);
      });
    } else {
      matrixIds = def.matrixIds;
    }

    if (day) {
      if (day === 1) {
        extent = [-250, -90, -180, 90];
        start = [-540, 90];
      } else {
        extent = [180, -90, 250, 90];
        start = [180, 90];
      }
    }

    date = options.date || state.date[activeDateStr];
    if (def.period === 'subdaily') {
      date = self.closestDate(def, options);
      date = new Date(date.getTime());
    }
    if (day && (def.period !== 'subdaily')) {
      date = util.dateAdd(date, 'day', day);
    }

    urlParameters =
      '?TIME=' + util.toISOStringSeconds(util.roundTimeOneMinute(date));
    var sourceOptions = {
      url: source.url + urlParameters,
      layer: def.layer || def.id,
      cacheSize: 4096,
      crossOrigin: 'anonymous',
      format: def.format,
      transition: 0,
      matrixSet: matrixSet.id,
      tileGrid: new OlTileGridWMTS({
        origin: start,
        resolutions: matrixSet.resolutions,
        matrixIds: matrixIds,
        tileSize: matrixSet.tileSize[0]
      }),
      wrapX: false,
      style: typeof def.style === 'undefined' ? 'default' : def.style
    };
    if (isPaletteActive(def.id, options.group, state)) {
      var lookup = getPaletteLookup(def.id, options.group, state);
      sourceOptions.tileClass = lookupFactory(lookup, sourceOptions);
    }
    return new OlLayerTile({
      preload: Infinity,
      extent: extent,
      source: new OlSourceWMTS(sourceOptions)
    });
  };

  /*
   * Create a new Vector Layer
   *
   * @method createLayerVector
   * @static
   *
   * @param {object} def - Layer Specs
   *
   * @param {object} options - Layer options
   *
   *
   * @returns {object} OpenLayers Vector layer
   */
  var createLayerVector = function(def, options, day, state) {
    const { proj, compare } = state;
    var date, urlParameters, extent, source, matrixSet, matrixIds, start;
    const selectedProj = proj.selected;
    const activeDateStr = compare.isCompareA ? 'selected' : 'selectedB';

    source = config.sources[def.source];
    extent = selectedProj.maxExtent;
    start = [selectedProj.maxExtent[0], selectedProj.maxExtent[3]];

    if (!source) {
      throw new Error(def.id + ': Invalid source: ' + def.source);
    }
    matrixSet = source.matrixSets[def.matrixSet];
    if (!matrixSet) {
      throw new Error(def.id + ': Undefined matrix set: ' + def.matrixSet);
    }
    if (typeof def.matrixIds === 'undefined') {
      matrixIds = [];
      lodashEach(matrixSet.resolutions, function(resolution, index) {
        matrixIds.push(index);
      });
    } else {
      matrixIds = def.matrixIds;
    }

    if (day) {
      if (day === 1) {
        extent = [-250, -90, -180, 90];
        start = [-540, 90];
      } else {
        extent = [180, -90, 250, 90];
        start = [180, 90];
      }
    }

    var layerName = def.layer || def.id;
    var tms = def.matrixSet;

    date = options.date || state.date[activeDateStr];
    if (day) {
      date = util.dateAdd(date, 'day', day);
    }

    urlParameters =
      '?' +
      'TIME=' +
      util.toISOStringSeconds(util.roundTimeOneMinute(date)) +
      '&layer=' +
      layerName +
      '&tilematrixset=' +
      tms +
      '&Service=WMTS' +
      '&Request=GetTile' +
      '&Version=1.0.0' +
      '&FORMAT=application%2Fvnd.mapbox-vector-tile' +
      '&TileMatrix={z}&TileCol={x}&TileRow={y}';

    var sourceOptions = new SourceVectorTile({
      url: source.url + urlParameters,
      layer: layerName,
      crossOrigin: 'anonymous',
      format: new MVT(),
      matrixSet: tms,
      tileGrid: new OlTileGridTileGrid({
        extent: extent,
        origin: start,
        resolutions: matrixSet.resolutions,
        tileSize: matrixSet.tileSize
      })
    });

    var scaleFeature = function (base, resolution) {
      // var zoom = map.getView()
      //   .getZoom();
      // var zoom = resolution;
      // Minimum size of the button is 15 pixels
      base = 5;
      // Double the size for each zoom level
      var add = Math.pow(2, resolution);
      // But 47 pixels is the maximum size
      var size = Math.min(base + add, base + 32);
      return {
        scale: size / 48,
        size: size
      };
    };

    // Create style options and store them in a styleCache Object
    // ref: http://openlayers.org/en/v3.10.1/examples/kml-earthquakes.html
    // ref: http://openlayersbook.github.io/ch06-styling-vector-layers/example-07.html
    var featureStyles = function(feature, resolution) {
      var featureStyle, color, fill, stroke, image, text, label, labelFillColor, labelStrokeColor;
      var fillColor = 'rgba(255,255,255,0.4)';
      var strokeColor = '#3399CC';
      var width = 1.25;
      var radius = 5;

      if (config.vectorStyles.rendered[def.vectorStyle.id]) {
        var layerStyles = config.vectorStyles.rendered[def.vectorStyle.id].styles;
        var styleGroup = Object.keys(layerStyles).map(e => layerStyles[e]);
      }
      var styleGroupCount = 0;
      var matchedPropertyStyles = [];
      var matchedLineStyles = [];

      if (config.vectorStyles.rendered[def.vectorStyle.id]) {
        // Match JSON styles from GC to vector features and add styleValue to arrays
        lodashEach(styleGroup, function(styleValues) {
          let stylePropertyKey = styleValues.property;
          if (stylePropertyKey in feature.properties_) matchedPropertyStyles.push(styleValues);
          if (feature.type_ === 'LineString' && styleValues.lines) matchedLineStyles.push(styleValues);
        });
      }

      if (lodashIsEmpty(matchedPropertyStyles) && lodashIsEmpty(matchedLineStyles)) {
        featureStyle = styleCache['default'];

        let defaultFill = new Fill({
          color: fillColor
        });
        let deafultStroke = new Stroke({
          color: strokeColor,
          width: width
        });

        if (!featureStyle) {
          featureStyle = new Style({
            image: new Circle({
              fill: defaultFill,
              stroke: deafultStroke,
              radius: radius
            }),
            fill: defaultFill,
            stroke: deafultStroke
          });
          styleCache['default'] = featureStyle;
        }
      } else {
        // Style vector points
        lodashEach(matchedPropertyStyles, function(matchedStyle) {
          styleGroupCount++;
          let pointStyle = feature.get(matchedStyle.property) + '_' + styleGroupCount;
          if (pointStyle) {
            featureStyle = styleCache[pointStyle];

            // If there is a range, style properties based on ranges
            if (matchedStyle.range) {
              let ranges = matchedStyle.range.split(',');
              let lowRange = ranges[ranges.length - 2].substring(1).trim();
              let highRange = ranges[ranges.length - 1].slice(0, -1).trim();
              if (matchedStyle.range.startsWith('[') && matchedStyle.range.endsWith(']')) { // greater than or equal to + less than or equal to
                if (feature.properties_[matchedStyle.property] >= lowRange && feature.properties_[matchedStyle.property] <= highRange) {
                  color = matchedStyle.points.color;
                }
              } else if (matchedStyle.range.startsWith('[') && matchedStyle.range.endsWith(')')) { // greater than or equal to + less than
                if (feature.properties_[matchedStyle.property] >= lowRange && feature.properties_[matchedStyle.property] < highRange) {
                  color = matchedStyle.points.color;
                }
              } else if (matchedStyle.range.startsWith('(') && matchedStyle.range.endsWith(']')) { // greater than + less than or equal to
                if (feature.properties_[matchedStyle.property] > lowRange && feature.properties_[matchedStyle.property] <= highRange) {
                  color = matchedStyle.points.color;
                }
              } else if (matchedStyle.range.startsWith('(') && matchedStyle.range.endsWith(')')) { // greater than + less than
                if (feature.properties_[matchedStyle.property] > lowRange && feature.properties_[matchedStyle.property] < highRange) {
                  color = matchedStyle.points.color;
                }
              } else {
                color = matchedStyle.points.color;
              }
            //  If there is a regexp and time property, style time vector points
            } else if (feature.properties_.time && matchedStyle.property === 'time' && matchedStyle.regex) {
              let time = feature.properties_.time;
              let pattern = new RegExp(matchedStyle.regex);
              let timeTest = pattern.test(time);
              if (timeTest) {
                color = matchedStyle.points.color;
                radius = matchedStyle.points.radius;
                if (matchedStyle.label) {
                  label = feature.properties_.time;
                  labelFillColor = matchedStyle.label.fill_color;
                  labelStrokeColor = matchedStyle.label.stroke_color;
                }
              }
            // Else set default styles
            } else {
              color = matchedStyle.points.color;
              radius = matchedStyle.points.radius;
              width = matchedStyle.points.width;
            }

            if (!featureStyle) {
              fill = new Fill({
                color: color || fillColor
              });

              stroke = new Stroke({
                color: color || strokeColor,
                width: width
              });

              image = new Circle({
                fill: fill,
                stroke: stroke,
                radius: radius
              });

              text = new Text({
                text: label || '',
                fill: new Fill({
                  color: labelFillColor || fillColor
                }),
                stroke: new Stroke({
                  color: labelStrokeColor || strokeColor
                }),
                font: '9px sans-serif',
                offsetX: 24
              });

              featureStyle = new Style({
                fill: fill,
                stroke: stroke,
                image: image,
                text: text
              });

              var radiusDimensions = scaleFeature(radius, resolution);
              radius = radiusDimensions.size;

              var widthDimensions = scaleFeature(width, resolution);
              width = widthDimensions.size;
              // if ((width / (resolution * 100)) > width) {
              //   width = width / (resolution * 100);
              // }

              stroke.setWidth(width);

              styleCache[pointStyle] = featureStyle;
            }
          }
        });

        // Style vector lines
        lodashEach(matchedLineStyles, function(matchedStyle) {
          let lineStyle = feature.type;
          let lineColor = matchedStyle.lines.color;
          let lineWidth = matchedStyle.lines.width;
          let width = lineWidth || 1.25;

          if (!featureStyle) {
            var stroke = new Stroke({
              color: lineColor || '#3399CC',
              width: width
            });

            featureStyle = new Style({
              stroke: stroke
            });

            var widthDimensions = scaleFeature(width, resolution);
            width = widthDimensions.size;
            // if ((width / (resolution * 100)) > width) {
            //   width = width / (resolution * 100);
            // }

            stroke.setWidth(width);
            styleCache[lineStyle] = featureStyle;
          }
        });
      }

      // The style for this feature is in the cache. Return it as an array
      return featureStyle;
    };

    var layer = new LayerVectorTile({
      renderMode: 'image',
      preload: 1,
      extent: extent,
      source: sourceOptions,
      style: featureStyles
    });

    return layer;
  };

  /*
   * Create a new WMS Layer
   *
   * @method createLayerWMTS
   * @static
   *
   * @param {object} def - Layer Specs
   *
   * @param {object} options - Layer options
   *
   *
   * @returns {object} OpenLayers WMS layer
   */
  var createLayerWMS = function(def, options, day, state) {
    const { proj, compare } = state;
    const activeDateStr = compare.isCompareA ? 'selected' : 'selectedB';
    const selectedProj = proj.selected;
    var source,
      urlParameters,
      transparent,
      date,
      extent,
      start,
      res,
      parameters;

    source = config.sources[def.source];
    extent = selectedProj.maxExtent;
    start = [selectedProj.maxExtent[0], selectedProj.maxExtent[3]];
    res = selectedProj.resolutions;
    if (!source) {
      throw new Error(def.id + ': Invalid source: ' + def.source);
    }

    transparent = def.format === 'image/png';
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
        0.00027465820313
      ];
    }
    if (day) {
      if (day === 1) {
        extent = [-250, -90, -180, 90];
        start = [-540, 90];
      } else {
        extent = [180, -90, 250, 90];
        start = [180, 90];
      }
    }
    parameters = {
      LAYERS: def.layer || def.id,
      FORMAT: def.format,
      TRANSPARENT: transparent,
      VERSION: '1.1.1'
    };
    if (def.styles) {
      parameters.STYLES = def.styles;
    }

    urlParameters = '';

    date = options.date || state.date[activeDateStr];
    if (day) {
      date = util.dateAdd(date, 'day', day);
    }
    urlParameters =
      '?TIME=' + util.toISOStringSeconds(util.roundTimeOneMinute(date));

    var sourceOptions = {
      url: source.url + urlParameters,
      cacheSize: 4096,
      wrapX: true,
      style: 'default',
      crossOrigin: 'anonymous',
      params: parameters,
      transition: 0,
      tileGrid: new OlTileGridTileGrid({
        origin: start,
        resolutions: res
      })
    };
    if (isPaletteActive(def.id, options.group, state)) {
      var lookup = getPaletteLookup(def.id, options.group, state);
      sourceOptions.tileClass = lookupFactory(lookup, sourceOptions);
    }
    var layer = new OlLayerTile({
      preload: Infinity,
      extent: extent,
      source: new OlSourceTileWMS(sourceOptions)
    });
    return layer;
  };
  var hideWrap = function() {
    var layer;
    var key;
    var layers;
    const state = store.getState();
    const activeDateStr = state.compare.isCompareA ? 'selected' : 'selectedB';
    layers = state.layers[state.compare.activeString];

    for (var i = 0, len = layers.length; i < len; i++) {
      layer = layers[i];
      if ((layer.wrapadjacentdays || layer.wrapX) && layer.visible) {
        key = self.layerKey(
          layer,
          {
            date: state.date[activeDateStr]
          },
          state
        );
        layer = cache.getItem(key);
        if (!layer) {
          throw new Error(`no such layer in cache: ${key}`);
        }
        layer.setExtent([-180, -90, 180, 90]);
      }
    }
  };
  var showWrap = function() {
    var layer;
    var layers;
    var key;
    const state = store.getState();
    const activeDateStr = state.compare.isCompareA ? 'selected' : 'selectedB';

    layers = state.layers[state.compare.activeString];
    for (var i = 0, len = layers.length; i < len; i++) {
      layer = layers[i];
      if ((layer.wrapadjacentdays || layer.wrapX) && layer.visible) {
        key = self.layerKey(
          layer,
          {
            date: state.date[activeDateStr]
          },
          state
        );
        layer = cache.getItem(key);
        layer.setExtent([-250, -90, 250, 90]);
      }
    }
  };
  self.init(mapUi);
  return self;
}

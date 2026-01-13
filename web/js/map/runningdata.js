import {
  get as lodashGet,
  isEmpty as lodashIsEmpty,
  isEqual as lodashIsEqual,
} from 'lodash';
import * as olExtent from 'ol/extent';
import util from '../util/util';
import { getPalette } from '../modules/palettes/selectors';
import {
  isFromActiveCompareRegion,
} from '../modules/compare/util';
import { FLIGHT_TRACK_KEYS, MAP_RUNNING_DATA } from '../util/constants';

const { events } = util;

export default function MapRunningData(compareUi, store) {
  let dataObj = {};

  function clearAll() {
    if (!lodashIsEmpty(dataObj)) {
      dataObj = {};
      events.trigger(MAP_RUNNING_DATA, dataObj);
    }
  }

  function newPoint(pixel, map) {
    const state = store.getState();
    const { proj, compare } = state;
    const activeLayerObj = {};
    const [lon, lat] = map.getCoordinateFromPixel(pixel);
    let swipeOffset;
    if (compareUi && compare.active) {
      swipeOffset = Math.floor(compareUi.getOffset());
    }

    // Determine if we should do anything with this vector layer
    const shouldNotProcessVectorLayer = (layer) => {
      const state = store.getState();
      const { sidebar: { isCollapsed } } = state;
      const def = lodashGet(layer, 'wv.def');
      if (!def) return true;
      const { wrapX, wrapadjacentdays } = def;
      const isWrapped = proj.id === 'geographic' && (wrapadjacentdays || wrapX);
      const isRenderedFeature = isWrapped ? lon > -250 || lon < 250 || lat > -90 || lat < 90 : true;
      const coords = map.getCoordinateFromPixel(pixel);
      const featureOutsideExtent = !olExtent.containsCoordinate(layer.get('extent'), coords);
      const inCompareRegion = isFromActiveCompareRegion(
        pixel,
        layer.wv.group,
        compare,
        swipeOffset,
      );
      const hasPalette = !lodashIsEmpty(def.palette);
      return !isRenderedFeature || !inCompareRegion
      || featureOutsideExtent || !hasPalette || isCollapsed;
    };

    // Running data for vector layers
    map.forEachFeatureAtPixel(pixel, (feature, layer) => {
      console.log('layer def', layer.wv.def);
      console.log('feature props', JSON.stringify(featureProps));
      if (shouldNotProcessVectorLayer(layer)) return;

      const { id, palette } = layer.wv.def;
      const isContinuousVectorLayer = layer.wv.def.colormapType === "continuous" && layer.wv.def.type === "vector"
      const identifier = palette.styleProperty;
      const paletteLegends = getPalette(id, undefined, undefined, state);
      const { legend } = paletteLegends;
      let color;

      if (!isContinuousVectorLayer && !identifier && legend.colors.length > 1) return;
      if (identifier) {
        const featureProps = feature.getProperties();
        const value = featureProps[identifier] || palette.unclassified;
        if (!value) return;
        const tooltips = legend.tooltips.map((c) => c.toLowerCase().replace(/\s/g, ''));
        if (id.includes('AERONET')) {
          const colorIndex = tooltips.findIndex((range) => value >= range[0]
            && (range.length < 2 || value < range[1]));
          color = legend.colors[colorIndex];
          if (!color) {
            const paletteLegendsAeronet = getPalette(id, 1, undefined, state);
            const { legend: legendAeronet } = paletteLegendsAeronet;
            const tooltipsAeronet = legendAeronet.tooltips;
            const colorIndexAeronet = tooltipsAeronet.findIndex((range) => parseFloat(value)
            >= parseFloat(range.split(' – ')[0]) && (range.split(' – ').length < 2
            || parseFloat(value) < parseFloat(range.split(' – ')[1])));
            color = legendAeronet.colors[colorIndexAeronet];
          }
        } else if (isContinuousVectorLayer) {
          let flightTrackDataKey = FLIGHT_TRACK_KEYS[layer.wv.def.id]
          console.log(`Processing ${id} with value: ${value}`);
          const featureValue = featureProps[flightTrackDataKey]
          // Ensure we are working with a number for comparison
          const numericValue = parseFloat(featureValue);

          if (isNaN(numericValue)) return;

          const colorIndex = legend.tooltips.findIndex(range => {
            if (range.includes('≥')) {
              const min = parseFloat(range.replace('≥', '').trim());
              return numericValue >= min;
            }

            if (range.includes('≤')) {
              const max = parseFloat(range.replace('≤', '').trim());
              return numericValue <= max;
            }

            if (range.includes('-')) {
              const [min, max] = range.split('-').map(s => parseFloat(s.trim()));
              return numericValue >= min && numericValue < max;
            }

            return false;
          });

          // Sometimes off by 1 in the sidebar?
          color = legend.colors[colorIndex];
        } else {
          const colorIndex = tooltips.indexOf(value.toLowerCase().replace(/\s/g, ''));
          color = legend.colors[colorIndex];
        }
      } else if (legend.colors.length === 1) {
        [color] = legend.colors;
      }

      activeLayerObj[id] = {
        paletteLegends,
        paletteHex: color,
      };
    });

    // Determine if we should do anything with this raster layer
    const shouldNotProcessRasterLayer = (layer) => {
      const state = store.getState();
      const { sidebar: { isCollapsed } } = state;
      const type = lodashGet(layer, 'wv.def.type');
      const isGranule = type === 'granule' && !layer.get('granuleGroup');
      const hasPalette = !!lodashGet(layer, 'wv.def.palette');
      return isGranule || layer.isVector || !hasPalette || isCollapsed;
    };

    // Running data for raster layers
    map.getAllLayers().forEach((layer) => {
      if (shouldNotProcessRasterLayer(layer)) return;
      const { wv: { def: { id } } } = layer;
      const data = layer.getData(pixel);
      if (!data) return;
      const [red, green, blue, alpha] = data;
      const hexColor = util.rgbaToHex(red, green, blue, alpha);
      activeLayerObj[id] = {
        paletteLegends: getPalette(id, undefined, undefined, state),
        paletteHex: hexColor,
      };
    });

    if (!lodashIsEqual(activeLayerObj, dataObj)) {
      dataObj = activeLayerObj;
      events.trigger(MAP_RUNNING_DATA, dataObj);
    }
  }

  return {
    clearAll,
    newPoint,
  };
}

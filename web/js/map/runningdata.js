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
import { MAP_RUNNING_DATA } from '../util/constants';

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
      const inCompareRegion = isFromActiveCompareRegion(pixel, layer.wv.group, compare, swipeOffset);
      const hasPalette = !lodashIsEmpty(def.palette);
      return !isRenderedFeature || !inCompareRegion || featureOutsideExtent || !hasPalette || isCollapsed;
    };

    // Running data for vector layers
    map.forEachFeatureAtPixel(pixel, (feature, layer) => {
      if (shouldNotProcessVectorLayer(layer)) return;

      const { id, palette } = layer.wv.def;
      const identifier = palette.styleProperty;
      const paletteLegends = getPalette(id, undefined, undefined, state);
      const { legend } = paletteLegends;
      let color;

      if (!identifier && legend.colors.length > 1) return;
      if (identifier) {
        const properties = feature.getProperties();
        const values = [
          [-1, 0],
          [0, 0.005],
          [0.005, 0.01],
          [0.01, 0.015],
          [0.015, 0.02],
          [0.02, 0.025],
          [0.025, 0.03],
          [0.03, 0.035],
          [0.035, 0.04],
          [0.04, 0.045],
          [0.045, 0.05],
          [0.05, 0.055],
          [0.055, 0.06],
          [0.06, 0.065],
          [0.065, 0.07],
          [0.07, 0.075],
          [0.075, 0.08],
          [0.08, 0.085],
          [0.085, 0.09],
          [0.09, 0.095],
          [0.095, 0.1],
          [0.1, 0.105],
          [0.105, 0.11],
          [0.11, 0.115],
          [0.115, 0.12],
          [0.12, 0.125],
          [0.125, 0.13],
          [0.13, 0.135],
          [0.135, 0.14],
          [0.14, 0.145],
          [0.145, 0.15],
          [0.15, 0.155],
          [0.155, 0.16],
          [0.16, 0.165],
          [0.165, 0.17],
          [0.17, 0.175],
          [0.175, 0.18],
          [0.18, 0.185],
          [0.185, 0.19],
          [0.19, 0.195],
          [0.195, 0.2],
          [0.2, 0.205],
          [0.205, 0.21],
          [0.21, 0.215],
          [0.215, 0.22],
          [0.22, 0.225],
          [0.225, 0.23],
          [0.23, 0.235],
          [0.235, 0.24],
          [0.24, 0.245],
          [0.245, 0.25],
          [0.25, 0.255],
          [0.255, 0.26],
          [0.26, 0.265],
          [0.265, 0.27],
          [0.27, 0.275],
          [0.275, 0.28],
          [0.28, 0.285],
          [0.285, 0.29],
          [0.29, 0.295],
          [0.295, 0.3],
          [0.3, 0.305],
          [0.305, 0.31],
          [0.31, 0.315],
          [0.315, 0.32],
          [0.32, 0.325],
          [0.325, 0.33],
          [0.33, 0.335],
          [0.335, 0.34],
          [0.34, 0.345],
          [0.345, 0.35],
          [0.35, 0.355],
          [0.355, 0.36],
          [0.36, 0.365],
          [0.365, 0.37],
          [0.37, 0.375],
          [0.375, 0.38],
          [0.38, 0.385],
          [0.385, 0.39],
          [0.39, 0.395],
          [0.395, 0.4],
          [0.4, 0.405],
          [0.405, 0.41],
          [0.41, 0.415],
          [0.415, 0.42],
          [0.42, 0.425],
          [0.425, 0.43],
          [0.43, 0.435],
          [0.435, 0.44],
          [0.44, 0.445],
          [0.445, 0.45],
          [0.45, 0.455],
          [0.455, 0.46],
          [0.46, 0.465],
          [0.465, 0.47],
          [0.47, 0.475],
          [0.475, 0.48],
          [0.48, 0.485],
          [0.485, 0.49],
          [0.49, 0.495],
          [0.495, 0.5],
          [0.5, 0.505],
          [0.505, 0.51],
          [0.51, 0.515],
          [0.515, 0.52],
          [0.52, 0.525],
          [0.525, 0.53],
          [0.53, 0.535],
          [0.535, 0.54],
          [0.54, 0.545],
          [0.545, 0.55],
          [0.55, 0.555],
          [0.555, 0.56],
          [0.56, 0.565],
          [0.565, 0.57],
          [0.57, 0.575],
          [0.575, 0.58],
          [0.58, 0.585],
          [0.585, 0.59],
          [0.59, 0.595],
          [0.595, 0.6],
          [0.6, 0.605],
          [0.605, 0.61],
          [0.61, 0.615],
          [0.615, 0.62],
          [0.62, 0.625],
          [0.625, 0.63],
          [0.63, 0.635],
          [0.635, 0.64],
          [0.64, 0.645],
          [0.645, 0.65],
          [0.65, 0.655],
          [0.655, 0.66],
          [0.66, 0.665],
          [0.665, 0.67],
          [0.67, 0.675],
          [0.675, 0.68],
          [0.68, 0.685],
          [0.685, 0.69],
          [0.69, 0.695],
          [0.695, 0.7],
          [0.7, 1.13],
          [1.13, 1.56],
          [1.56, 1.99],
          [1.99, 2.42],
          [2.42, 2.85],
          [2.85, 3.28],
          [3.28, 3.71],
          [3.71, 4.14],
          [4.14, 4.57],
          [4.57, 5],
          [5],
        ];
        const tooltips2 = [
          '< 0.000',
          '0 – 0.005',
          '0.005 – 0.010',
          '0.010 – 0.015',
          '0.015 – 0.020',
          '0.020 – 0.025',
          '0.025 – 0.030',
          '0.030 – 0.035',
          '0.035 – 0.040',
          '0.040 – 0.045',
          '0.045 – 0.050',
          '0.050 – 0.055',
          '0.055 – 0.060',
          '0.060 – 0.065',
          '0.065 – 0.070',
          '0.070 – 0.075',
          '0.075 – 0.080',
          '0.080 – 0.085',
          '0.085 – 0.090',
          '0.090 – 0.095',
          '0.095 – 0.1',
          '0.1 – 0.105',
          '0.105 – 0.110',
          '0.110 – 0.115',
          '0.115 – 0.120',
          '0.120 – 0.125',
          '0.125 – 0.130',
          '0.130 – 0.135',
          '0.135 – 0.140',
          '0.140 – 0.145',
          '0.145 – 0.150',
          '0.150 – 0.155',
          '0.155 – 0.160',
          '0.160 – 0.165',
          '0.165 – 0.170',
          '0.170 – 0.175',
          '0.175 – 0.180',
          '0.180 – 0.185',
          '0.185 – 0.190',
          '0.190 – 0.195',
          '0.195 – 0.2',
          '0.2 – 0.205',
          '0.205 – 0.210',
          '0.210 – 0.215',
          '0.215 – 0.220',
          '0.220 – 0.225',
          '0.225 – 0.230',
          '0.230 – 0.235',
          '0.235 – 0.240',
          '0.240 – 0.245',
          '0.245 – 0.250',
          '0.250 – 0.255',
          '0.255 – 0.260',
          '0.260 – 0.265',
          '0.265 – 0.270',
          '0.270 – 0.275',
          '0.275 – 0.280',
          '0.280 – 0.285',
          '0.285 – 0.290',
          '0.290 – 0.295',
          '0.295 – 0.3',
          '0.3 – 0.305',
          '0.305 – 0.310',
          '0.310 – 0.315',
          '0.315 – 0.320',
          '0.320 – 0.325',
          '0.325 – 0.330',
          '0.330 – 0.335',
          '0.335 – 0.340',
          '0.340 – 0.345',
          '0.345 – 0.350',
          '0.350 – 0.355',
          '0.355 – 0.360',
          '0.360 – 0.365',
          '0.365 – 0.370',
          '0.370 – 0.375',
          '0.375 – 0.380',
          '0.380 – 0.385',
          '0.385 – 0.390',
          '0.390 – 0.395',
          '0.395 – 0.4',
          '0.4 – 0.405',
          '0.405 – 0.410',
          '0.410 – 0.415',
          '0.415 – 0.420',
          '0.420 – 0.425',
          '0.425 – 0.430',
          '0.430 – 0.435',
          '0.435 – 0.440',
          '0.440 – 0.445',
          '0.445 – 0.450',
          '0.450 – 0.455',
          '0.455 – 0.460',
          '0.460 – 0.465',
          '0.465 – 0.470',
          '0.470 – 0.475',
          '0.475 – 0.480',
          '0.480 – 0.485',
          '0.485 – 0.490',
          '0.490 – 0.495',
          '0.495 – 0.5',
          '0.5 – 0.505',
          '0.505 – 0.510',
          '0.510 – 0.515',
          '0.515 – 0.520',
          '0.520 – 0.525',
          '0.525 – 0.530',
          '0.530 – 0.535',
          '0.535 – 0.540',
          '0.540 – 0.545',
          '0.545 – 0.550',
          '0.550 – 0.555',
          '0.555 – 0.560',
          '0.560 – 0.565',
          '0.565 – 0.570',
          '0.570 – 0.575',
          '0.575 – 0.580',
          '0.580 – 0.585',
          '0.585 – 0.590',
          '0.590 – 0.595',
          '0.595 – 0.6',
          '0.6 – 0.605',
          '0.605 – 0.610',
          '0.610 – 0.615',
          '0.615 – 0.620',
          '0.620 – 0.625',
          '0.625 – 0.630',
          '0.630 – 0.635',
          '0.635 – 0.640',
          '0.640 – 0.645',
          '0.645 – 0.650',
          '0.650 – 0.655',
          '0.655 – 0.660',
          '0.660 – 0.665',
          '0.665 – 0.670',
          '0.670 – 0.675',
          '0.675 – 0.680',
          '0.680 – 0.685',
          '0.685 – 0.690',
          '0.690 – 0.695',
          '0.695 – 0.7',
          '0.7 – 1.130',
          '1.130 – 1.560',
          '1.560 – 1.990',
          '1.990 – 2.420',
          '2.420 – 2.850',
          '2.850 – 3.280',
          '3.280 – 3.710',
          '3.710 – 4.140',
          '4.140 – 4.570',
          '4.570 – 5',
          '5.000',
        ];
        const value = tooltips2[values.findIndex((range) => properties.value >= range[0] && (range.length < 2 || properties.value < range[1]))] || properties[identifier] || palette.unclassified;
        if (!value) return;
        const tooltips = legend.tooltips.map((c) => c.toLowerCase().replace(/\s/g, ''));
        const colorIndex = tooltips.indexOf(value.toLowerCase().replace(/\s/g, ''));
        color = legend.colors[colorIndex];
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

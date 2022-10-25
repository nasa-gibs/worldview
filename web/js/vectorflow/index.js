
import * as dat from 'dat.gui';
import OLTile from 'ol/layer/Tile';
import WMTS from 'ol/source/WMTS';
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import MVT from 'ol/format/MVT';
import { get } from 'ol/proj';
import SourceVectorTile from 'ol/source/VectorTile';
import LayerVectorTile from 'ol/layer/VectorTile';
import OLMap from 'ol/Map';
import OLView from 'ol/View';
import WindTile from './renderer';
import { throttle } from './util';
// import './App.css';
// import Style from 'ol/style/Style';
// import Stroke from 'ol/style/Stroke';

const gui = new dat.GUI();

const tileGridSizes = [
  {
    matrixWidth: 2,
    matrixHeight: 1,
  },
  {
    matrixWidth: 3,
    matrixHeight: 2,
  },
  {
    matrixWidth: 5,
    matrixHeight: 3,
  },
  {
    matrixWidth: 10,
    matrixHeight: 5,
  },
  {
    matrixWidth: 20,
    matrixHeight: 10,
  },
  {
    matrixWidth: 40,
    matrixHeight: 20,
  },
];
const base = new OLTile({
  extent: [-180, -90, 180, 90],
  crossOrigin: 'anonymous',
  source: new WMTS({
    url: '//gibs.earthdata.nasa.gov/wmts/epsg4326/best/wmts.cgi?TIME=2020-04-27',
    layer: 'BlueMarble_NextGeneration',
    format: 'image/jpeg',
    matrixSet: '500m',
    tileGrid: new WMTSTileGrid({
      origin: [-180, 90],
      resolutions: [0.140625, 0.0703125, 0.03515625, 0.017578125, 0.0087890625, 0.00439453125, 0.002197265625],
      matrixIds: [2, 3, 4, 5, 6, 7, 8],
      tileSize: 512,
    }),
  }),
});
const source = new SourceVectorTile({
  visible: true,
  projection: get('EPSG:4326'),
  // url: 'https://uat.gibs.earthdata.nasa.gov/wmts/epsg4326/best/wmts.cgi?TIME=2020-03-21&layer=MISR_Cloud_Motion_Vector&tilematrixset=2km&Service=WMTS&Request=GetTile&Version=1.0.0&FORMAT=application%2Fvnd.mapbox-vector-tile&TileMatrix={z}&TileCol={x}&TileRow={y}',
  url: 'https://sit.gitc.earthdata.nasa.gov/wmts/epsg4326/best/ascat/default/2020-01-01/16km/0/0/0.mvt',
  format: new MVT(),
  tileGrid: new WMTSTileGrid({
    extent: [-180, -90, 180, 90],
    resolutions: [0.5625, 0.28125, 0.140625, 0.0703125, 0.03515625, 0.017578125],
    tileSize: [512, 512],
    sizes: tileGridSizes,
  }),
});

// console.log(staticStyle);
const vectorLayer = new LayerVectorTile({
  source,
  // Removing the style array renders each point in the default style (blue circles at each point, not animated)
  // style: [],
});
const map = new OLMap({
  layers: [base, vectorLayer],
  target: 'map',
  view: new OLView({
    center: [0, 0],
    maxZoom: 12,
    zoom: 1,
    extent: [-180, -90, 180, 90],
    projection: get('EPSG:4326'),
  }),
});

let i = 0;
source.on('tileloadstart', (e) => {
  i += 1;
});
let windRender;
source.on('tileloadend', (e) => {
  if (!windRender) {
    const mapSize = map.getSize();
    const options = {
      uMin: -76.57695007324219,
      uMax: 44.30181884765625,
      vMin: -76.57695007324219,
      vMax: 44.30181884765625,
      width: mapSize[0],
      height: mapSize[1],
    };
    windRender = new WindTile(options);
  }
  i -= 1;
  if (i === 1 && !windRender.stopped && windRender) {
    windRender.stop();
  }
  if (i === 0 && !moving && windRender) {
    if (!initiatedGUI) {
      setTimeout(() => { updateRenderer(); }, 1);
    } else {
      updateRendererThrottled();
    }
  }
});
let moving = false;
map.getView().on('change:center', () => {
  windRender.stop();
  moving = true;
});
map.getView().on('propertychange', (e) => {
  if (e.key === 'resolution' && windRender) {
    windRender.stop();
    moving = true;
  }
});
map.on('moveend', (e) => {
  moving = false;
  if (i === 0 && windRender) updateRendererThrottled();
});
let initiatedGUI = false;
let currentFeatures; let zoom; let extent; let
  options;
const updateRenderer = () => {
  const view = map.getView();
  const mapSize = map.getSize();
  extent = view.calculateExtent(mapSize);
  currentFeatures = vectorLayer.getSource().getFeaturesInExtent(extent);
  zoom = view.getZoom();
  options = {
    uMin: -55.806217193603516,
    uMax: 45.42329406738281,
    vMin: -5.684286117553711,
    vMax: 44.30181884765625,
    width: mapSize[0],
    height: mapSize[1],
    ts: Date.now(),
  };
  windRender.updateData(currentFeatures, extent, zoom, options);
  if (!initiatedGUI) initGUI();
};
const updateRendererThrottled = throttle(updateRenderer, 150);
const initGUI = function() {
  const { wind } = windRender;
  gui.add(wind, 'numParticles', 144, 248832);
  gui.add(wind, 'fadeOpacity', 0.96, 0.999).step(0.001).updateDisplay();
  gui.add(wind, 'speedFactor', 0.05, 1.0);
  gui.add(wind, 'dropRate', 0, 0.1);
  gui.add(wind, 'dropRateBump', 0, 0.2);
  gui.add(windRender, 'dataGridWidth', 18, 360).step(2).onChange(updateTexture);
  initiatedGUI = true;
};
const updateTexture = function() {
  windRender.updateData(currentFeatures, extent, zoom, options);
};

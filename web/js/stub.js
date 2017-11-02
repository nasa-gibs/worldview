/* This file is just a stub to test the browserify build task */
import $ from 'jquery';
import { DateSelector } from 'worldview-components';
import { parse as mapParser } from './map/wv.map';
import builder from './map/wv.map.datelinebuilder';
import layerBuilder from './map/wv.map.layerbuilder';
import animate from './map/wv.map.animate';
import mapModel from './map/wv.map.model';
import preCacheTile from './map/wv.map.precachetile';
import runningData from './map/wv.map.runningdata';
import mapUi from './map/wv.map.ui';

export default function () {
  console.log($, DateSelector, mapParser, builder, layerBuilder, animate, mapModel, preCacheTile, runningData, mapUi);
};

export const stub2 = (function() {
  return 'stub';
})();

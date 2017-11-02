/* This file is just a stub to test the browserify build task */
import $ from 'jquery';
import { DateSelector } from 'worldview-components';
import { parse as mapParser } from './map/wv.map';
import builder from './map/wv.map.datelinebuilder';
import layerBuilder from './map/wv.map.layerbuilder';
import animate from './map/wv.map.animate';

export default function () {
  console.log($, DateSelector, mapParser, builder, layerBuilder, animate);
};

export const stub2 = (function() {
  return 'stub';
})();

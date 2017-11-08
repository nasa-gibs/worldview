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
import dateParse from './date/wv.date';
import dateLabel from './date/wv.date.label';
import dateModel from './date/wv.date.model';
import dateWheels from './date/wv.date.wheels';
import timelineConfig from './date/wv.date.timeline.config';
import timelinedata from './date/wv.date.timeline.data';
import timelineinput from './date/wv.date.timeline.input';
import timeline from './date/wv.date.timeline';
import timelinePan from './date/wv.date.timeline.pan';
import timelinePick from './date/wv.date.timeline.pick';
import timelineTicks from './date/wv.date.timeline.ticks';
import timelineZoom from './date/wv.date.timeline.zoom';

export default function () {
  console.log($, DateSelector, mapParser, builder, layerBuilder, animate, mapModel, preCacheTile, runningData, mapUi, dateParse, dateLabel, dateModel);
  console.log(timelineConfig, timelinedata, timelineinput, timeline, timelinePan, timelinePick, timelineTicks, timelineZoom, dateWheels);
};

export const stub2 = (function() {
  return 'stub';
})();

/* This file is just a stub to test the browserify build task */
import $ from 'jquery';
import { DateSelector } from 'worldview-components';
import { parse as mapParser } from './map/map';
import builder from './map/datelinebuilder';
import layerBuilder from './map/layerbuilder';
import animate from './map/animate';
import mapModel from './map/model';
import preCacheTile from './map/precachetile';
import runningData from './map/runningdata';
import mapUi from './map/ui';
import dateParse from './date/date';
import dateLabel from './date/label';
import dateModel from './date/model';
import dateWheels from './date/wheels';
import timelineConfig from './date/config';
import timelinedata from './date/timeline-data';
import timelineinput from './date/timeline-input';
import timeline from './date/timeline';
import timelinePan from './date/timeline-pan';
import timelinePick from './date/timeline-pick';
import timelineTicks from './date/timeline-ticks';
import timelineZoom from './date/timeline-zoom';

export default function () {
  console.log($, DateSelector, mapParser, builder, layerBuilder, animate, mapModel, preCacheTile, runningData, mapUi, dateParse, dateLabel, dateModel);
  console.log(timelineConfig, timelinedata, timelineinput, timeline, timelinePan, timelinePick, timelineTicks, timelineZoom, dateWheels);
};

export const stub2 = (function() {
  return 'stub';
})();

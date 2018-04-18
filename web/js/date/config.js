import $ from 'jquery';
import d3 from 'd3';
import util from '../util/util';
import moment from 'moment';

/**
 * Modify zoom levels here. Maybe this isnt the best way to do this.
 * It could be called just level without the zoom part instead.
 *
 * When the zoom level is changed, this re renders everything of the timeline.
 *
 * @class wv.date.timeline.config
 */
export function timelineConfig(models, config, ui) {
  var self = {};
  var tl = ui.timeline;
  var model = models.date;
  var zoomLevel = model.selectedZoom || 3;

  self.zoom = function (level, event) {
    // format of the label
    var labelFormat;
    // printed type of tick
    var dateInterval;
    // step of the ticks, here difference between ticks is always 1
    var dateStep = 1;
    // number of ticks total of data range, in days
    var tickCount;
    // Calculated max number of ticks based on tickCount
    var tickCountMax;
    // width in pixels of each tick
    var tickWidth;
    // end tick date if tickCount is less than tickCountMax
    var altEnd;
    var paddedRange;

    // Needs reworked. Repeated from layers/active/toggleSubdaily
    var activeLayers = models.layers.active;
    var subdailyFound = false;
    for (var i = 0; i < activeLayers.length; i++) {
      switch (activeLayers[i].period) {
        case 'subdaily':
          subdailyFound = true;
          break;
      }
    }

    // If zoom is not within range, set it to level 3 (daily)
    if (level > 4 || level < 0) level = 3;
    if (!subdailyFound && (level > 3 || level < 0)) level = 3;

    switch (level) {
      case 1: // Year
        dateStep = 1;
        labelFormat = d3.time.format.utc('%Y');
        dateInterval = d3.time.year;
        tickCount = tl.data.end()
          .getUTCFullYear() - tl.data.start()
          .getUTCFullYear();
        tickWidth = 15;
        tickCountMax = Math.ceil(tl.width / tickWidth);

        paddedRange = [
          new Date(tl.data.start().setUTCFullYear(tl.data.start().getUTCFullYear() - 10)),
          new Date(tl.data.end().setUTCFullYear(tl.data.end().getUTCFullYear() + 10))
        ];

        altEnd = new Date(tl.data.start()
          .getUTCFullYear() + tickCountMax,
        tl.data.start()
          .getUTCMonth(),
        tl.data.start()
          .getUTCDate());

        tl.zoom.drawTicks(tickCount,
          tickCountMax,
          altEnd,
          tickWidth,
          dateInterval,
          dateStep,
          labelFormat,
          event,
          paddedRange);

        // Filters ticks for nonboundaries for this zoom level
        tl.zoom.current.ticks.normal.all = function () {
          tl.ticks.normal.all = tl.ticks.all.filter(function (d) {
            return d.getUTCFullYear() % 10 !== 0;
          });
          tl.ticks.normal.setEnds();
        };

        // Filters ticks for boundaries for this zoom level
        tl.zoom.current.ticks.boundary.all = function () {
          tl.ticks.boundary.all = tl.ticks.all.filter(function (d) {
            return d.getUTCFullYear() % 10 === 0;
          });
        };

        // Calculated next boundary tick by date
        tl.zoom.current.ticks.boundary.next = function (current) {
          var next = new Date(current);
          return new Date(next.setUTCFullYear(next.getUTCFullYear() + 10));
        };

        // Calculated next normal tick by date
        tl.zoom.current.ticks.normal.next = function (current) {
          var next = new Date(current);
          return new Date(next.setUTCFullYear(next.getUTCFullYear() + 1));
        };

        // Date of first printed boundary interval of this zoom level
        tl.zoom.current.ticks.boundary.first = function () {
          var first = tl.ticks.normal.firstDate;
          return new Date(Date.UTC(Math.floor(first.getUTCFullYear() / 10) * 10,
            0,
            1));
        };

        // Date of first printed normal tick
        tl.zoom.current.ticks.normal.first = function () {
          var first = tl.ticks.firstDate;
          return new Date(Date.UTC(first.getUTCFullYear() - 1,
            first.getUTCMonth(),
            first.getUTCDate()));
        };

        // Date of last printed boundary interval of this zoom level
        tl.zoom.current.ticks.boundary.last = function () {
          var last = tl.ticks.normal.lastDate;
          return new Date(Date.UTC(Math.ceil(last.getUTCFullYear() / 10) * 10,
            0,
            1));
        };

        // Value for hovered normal label
        tl.zoom.current.ticks.normal.hover = function (d) {
          // No modifications to date obj at this zoom level
          return new Date(d.getUTCFullYear(),
            model.selected.getUTCMonth(),
            model.selected.getUTCDate());
        };

        // Value for clicked normal tick
        tl.zoom.current.ticks.normal.clickDate = function (d) {
          var prevDate = model.selected;
          d = new Date(d.getUTCFullYear(),
            prevDate.getUTCMonth(),
            prevDate.getUTCDate(),
            prevDate.getUTCHours(),
            prevDate.getUTCMinutes());
          d = new Date(d.getTime() - (d.getTimezoneOffset() * 60000));
          if (!moment(prevDate).isDST() && moment(d).isDST()) {
            prevDate = new Date(prevDate.getTime() + (1 * 60 * 60 * 1000));
          } else if (moment(prevDate).isDST() && !moment(d).isDST()) {
            prevDate = new Date(prevDate.getTime() - (1 * 60 * 60 * 1000));
          }
          prevDate = new Date(prevDate.getTime() - (prevDate.getTimezoneOffset() * 60000));
          return new Date(d.getUTCFullYear(),
            prevDate.getUTCMonth(),
            prevDate.getUTCDate(),
            prevDate.getUTCHours(),
            prevDate.getUTCMinutes());
        };

        // Value for hovered boundary tick
        tl.zoom.current.ticks.boundary.hover = function (d) {
          var yearOffset = model.selected.getUTCFullYear() -
            Math.ceil(new Date(model.selected.getUTCFullYear() / 10) * 10);

          return new Date(d.getUTCFullYear() + yearOffset,
            model.selected.getUTCMonth(),
            model.selected.getUTCDate());
        };

        // Displayed default label
        tl.zoom.current.ticks.boundary.label = function (d) {
          return d.getUTCFullYear();
        };

        // Displayed default sub-label (if any)
        tl.zoom.current.ticks.boundary.subLabel = function (d) {
          return null;
        };

        // Value for clicked boundary tick
        tl.zoom.current.ticks.boundary.clickDate = function (d) {
          var prevDate = model.selected;
          var yearOffset = prevDate.getUTCFullYear() -
            Math.ceil(new Date(prevDate.getUTCFullYear() / 10) * 10);
          d = new Date(d.getUTCFullYear() + yearOffset,
            prevDate.getUTCMonth(),
            prevDate.getUTCDate(),
            prevDate.getUTCHours(),
            prevDate.getUTCMinutes());
          d = new Date(d.getTime() - (d.getTimezoneOffset() * 60000));
          if (!moment(prevDate).isDST() && moment(d).isDST()) {
            prevDate = new Date(prevDate.getTime() + (1 * 60 * 60 * 1000));
          } else if (moment(prevDate).isDST() && !moment(d).isDST()) {
            prevDate = new Date(prevDate.getTime() - (1 * 60 * 60 * 1000));
          }
          prevDate = new Date(prevDate.getTime() - (prevDate.getTimezoneOffset() * 60000));
          return new Date(d.getUTCFullYear(),
            prevDate.getUTCMonth(),
            prevDate.getUTCDate(),
            prevDate.getUTCHours(),
            prevDate.getUTCMinutes());
        };

        // When the date updates while dragging the pick forward
        tl.zoom.current.pick.nextChange = function (d) {
          return new Date(Date.UTC(d.getUTCFullYear() + 1,
            model.selected.getUTCMonth(),
            model.selected.getUTCDate()));
        };

        // When the date updates while dragging the pick backward
        tl.zoom.current.pick.prevChange = function (d) {
          return new Date(Date.UTC(d.getUTCFullYear(),
            model.selected.getUTCMonth(),
            model.selected.getUTCDate()));
        };

        tl.zoom.current.pick.hoverTick = function (newDate) {
          tl.zoom.current.pick.hoveredTick = d3.selectAll('.x.axis>g.tick')
            .filter(function (d) {
              return d.getUTCFullYear() === newDate.getUTCFullYear();
            });
        };

        switchZoom(1);

        self.currentZoom = 1;
        break;
      case 2: // Month
        dateStep = 1;
        labelFormat = d3.time.format.utc('%Y');
        dateInterval = d3.time.month;

        tickCount = (tl.data.end()
          .getUTCFullYear() -
            tl.data.start()
              .getUTCFullYear()) * 12 +
          tl.data.end()
            .getUTCMonth() + 1 -
          tl.data.start()
            .getUTCMonth();

        tickWidth = 11;
        tickCountMax = Math.ceil(tl.width / tickWidth);

        paddedRange = [
          new Date(tl.data.start().setUTCFullYear(tl.data.start().getUTCFullYear() - 1)),
          new Date(tl.data.end().setUTCFullYear(tl.data.end().getUTCFullYear() + 1))
        ];

        altEnd = new Date(tl.data.start()
          .getUTCFullYear(),
        tl.data.start()
          .getUTCMonth() + tickCountMax,
        tl.data.start()
          .getUTCDate());

        tl.zoom.drawTicks(tickCount,
          tickCountMax,
          altEnd,
          tickWidth,
          dateInterval,
          dateStep,
          labelFormat,
          event,
          paddedRange);

        // Filters ticks for nonboundaries for this zoom level
        tl.zoom.current.ticks.normal.all = function () {
          tl.ticks.normal.all = tl.ticks.all.filter(function (d) {
            return d.getUTCMonth() !== 0;
          });
          tl.ticks.normal.setEnds();
        };

        // Filters ticks for boundaries for this zoom level
        tl.zoom.current.ticks.boundary.all = function () {
          tl.ticks.boundary.all = tl.ticks.all.filter(function (d) {
            return d.getUTCMonth() === 0;
          });
        };

        // Calculated next boundary tick by date
        tl.zoom.current.ticks.boundary.next = function (current) {
          var next = new Date(current);
          return new Date(next.setUTCFullYear(next.getUTCFullYear() + 1));
        };

        // Calculated next normal tick by date
        tl.zoom.current.ticks.normal.next = function (current) {
          var next = new Date(current);
          return new Date(next.setUTCMonth(next.getUTCMonth() + 1));
        };

        // Date of first printed boundary interval of this zoom level
        tl.zoom.current.ticks.boundary.first = function () {
          var first = tl.ticks.normal.firstDate;
          return new Date(Date.UTC(first.getUTCFullYear(),
            0,
            1));
        };

        // Date of first printed normal tick
        tl.zoom.current.ticks.normal.first = function () {
          var first = tl.ticks.normal.firstDate;
          return new Date(Date.UTC(first.getUTCFullYear(),
            first.getUTCMonth() - 1,
            first.getUTCDate()));
        };

        // Date of last printed boundary interval of this zoom level
        tl.zoom.current.ticks.boundary.last = function () {
          var last = tl.ticks.normal.lastDate;
          return new Date(Date.UTC(last.getUTCFullYear() + 1,
            0,
            1));
        };

        // Value for hovered normal label
        tl.zoom.current.ticks.normal.hover = function (d) {
          // No modifications to date obj at this zoom level
          return new Date(d.getUTCFullYear(), d.getUTCMonth(), model.selected.getUTCDate());
        };

        // Value for clicked normal tick
        tl.zoom.current.ticks.normal.clickDate = function (d) {
          var prevDate = model.selected;
          d = new Date(d.getUTCFullYear(),
            d.getUTCMonth(),
            prevDate.getUTCDate(),
            prevDate.getUTCHours(),
            prevDate.getUTCMinutes());
          d = new Date(d.getTime() - (d.getTimezoneOffset() * 60000));
          if (!moment(prevDate).isDST() && moment(d).isDST()) {
            prevDate = new Date(prevDate.getTime() + (1 * 60 * 60 * 1000));
          } else if (moment(prevDate).isDST() && !moment(d).isDST()) {
            prevDate = new Date(prevDate.getTime() - (1 * 60 * 60 * 1000));
          }
          prevDate = new Date(prevDate.getTime() - (prevDate.getTimezoneOffset() * 60000));
          return new Date(d.getUTCFullYear(),
            d.getUTCMonth(),
            d.getUTCDate() - 1,
            prevDate.getUTCHours(),
            prevDate.getUTCMinutes());
        };

        // Value for hovered boundary tick
        tl.zoom.current.ticks.boundary.hover = function (d) {
          return new Date(d.getUTCFullYear(),
            model.selected.getUTCMonth(),
            model.selected.getUTCDate());
        };

        // Displayed default label
        tl.zoom.current.ticks.boundary.label = function (d) {
          return d.getUTCFullYear();
        };

        // Displayed default sub-label (if any)
        tl.zoom.current.ticks.boundary.subLabel = function (d) {
          return null;
        };

        // Value for clicked boundary tick
        tl.zoom.current.ticks.boundary.clickDate = function (d) {
          var prevDate = model.selected;
          d = new Date(d.getUTCFullYear(),
            prevDate.getUTCMonth(),
            prevDate.getUTCDate(),
            prevDate.getUTCHours(),
            prevDate.getUTCMinutes());
          d = new Date(d.getTime() - (d.getTimezoneOffset() * 60000));
          if (!moment(prevDate).isDST() && moment(d).isDST()) {
            prevDate = new Date(prevDate.getTime() + (1 * 60 * 60 * 1000));
          } else if (moment(prevDate).isDST() && !moment(d).isDST()) {
            prevDate = new Date(prevDate.getTime() - (1 * 60 * 60 * 1000));
          }
          prevDate = new Date(prevDate.getTime() - (prevDate.getTimezoneOffset() * 60000));
          return new Date(d.getUTCFullYear(),
            prevDate.getUTCMonth(),
            prevDate.getUTCDate(),
            prevDate.getUTCHours(),
            prevDate.getUTCMinutes());
        };

        // When the date updates while dragging the pick forward
        tl.zoom.current.pick.nextChange = function (d) {
          return new Date(Date.UTC(d.getUTCFullYear(),
            d.getUTCMonth() + 1,
            model.selected.getUTCDate()));
        };

        // When the date updates while dragging the pick backward
        tl.zoom.current.pick.prevChange = function (d) {
          return new Date(Date.UTC(d.getUTCFullYear(),
            d.getUTCMonth(),
            model.selected.getUTCDate()));
        };

        tl.zoom.current.pick.hoverTick = function (newDate) {
          tl.zoom.current.pick.hoveredTick = d3.selectAll('.x.axis>g.tick')
            .filter(function (d) {
              return (d.getUTCFullYear() === newDate.getUTCFullYear()) &&
                (d.getUTCMonth() === newDate.getUTCMonth());
            });
        };

        switchZoom(2);

        self.currentZoom = 2;
        break;
      case 3: // Day
        dateStep = 1;
        labelFormat = d3.time.format.utc('%b');
        dateInterval = d3.time.day;
        tickCount = (tl.data.end() - tl.data.start()) / 1000 / 60 / 60 / 24;
        tickWidth = 11;
        tickCountMax = Math.ceil(tl.width / tickWidth);

        paddedRange = [
          new Date(tl.data.start().setUTCDate(tl.data.start().getUTCDate() - 15)),
          new Date(tl.data.end().setUTCDate(tl.data.end().getUTCDate() + 15))
        ];

        altEnd = new Date(tl.data.start()
          .getUTCFullYear(),
        tl.data.start()
          .getUTCMonth(),
        tl.data.start()
          .getUTCDate() + tickCountMax);

        tl.zoom.drawTicks(tickCount,
          tickCountMax,
          altEnd,
          tickWidth,
          dateInterval,
          dateStep,
          labelFormat,
          event,
          paddedRange);

        // Filters ticks for nonboundaries that have the following attribute
        tl.zoom.current.ticks.normal.all = function () {
          tl.ticks.normal.all = tl.ticks.all.filter(function (d) {
            return d.getUTCDate() !== 1;
          });
          tl.ticks.normal.setEnds();
        };

        // Filters ticks for boundaries that have the following attribute
        tl.zoom.current.ticks.boundary.all = function () {
          tl.ticks.boundary.all = tl.ticks.all.filter(function (d) {
            return d.getUTCDate() === 1;
          });
        };

        // Calculated next boundary tick by date
        tl.zoom.current.ticks.boundary.next = function (current) {
          var next = new Date(current);
          return new Date(next.setUTCMonth(next.getUTCMonth() + 1));
        };

        // Calculated next normal tick by date
        tl.zoom.current.ticks.normal.next = function (current) {
          var next = new Date(current);
          return new Date(next.setUTCDate(next.getUTCDate() + 1));
        };

        // Date of first printed boundary interval of this zoom level
        tl.zoom.current.ticks.boundary.first = function () {
          var first = tl.ticks.normal.firstDate;
          return new Date(Date.UTC(first.getUTCFullYear(),
            first.getUTCMonth(),
            1));
        };

        // Date of first printed normal tick
        tl.zoom.current.ticks.normal.first = function () {
          var first = tl.ticks.normal.firstDate;
          return new Date(Date.UTC(first.getUTCFullYear(),
            first.getUTCMonth(),
            first.getUTCDate() - 1));
        };

        // Date of last printed boundary interval of this zoom level
        tl.zoom.current.ticks.boundary.last = function () {
          var last = tl.ticks.normal.lastDate;
          return new Date(Date.UTC(last.getUTCFullYear(),
            last.getUTCMonth() + 1,
            1));
        };

        // Value for hovered normal label
        tl.zoom.current.ticks.normal.hover = function (d) {
          // No modifications to date obj at this zoom level
          return d;
        };

        // Value for clicked normal tick
        tl.zoom.current.ticks.normal.clickDate = function (d) {
          var prevDate = model.selected;
          d = new Date(d.getUTCFullYear(),
            d.getUTCMonth(),
            d.getUTCDate(),
            prevDate.getUTCHours(),
            prevDate.getUTCMinutes());
          d = new Date(d.getTime() - (d.getTimezoneOffset() * 60000));
          if (!moment(prevDate).isDST() && moment(d).isDST()) {
            prevDate = new Date(prevDate.getTime() + (1 * 60 * 60 * 1000));
          } else if (moment(prevDate).isDST() && !moment(d).isDST()) {
            prevDate = new Date(prevDate.getTime() - (1 * 60 * 60 * 1000));
          }
          prevDate = new Date(prevDate.getTime() - (prevDate.getTimezoneOffset() * 60000));
          return new Date(d.getUTCFullYear(),
            d.getUTCMonth(),
            d.getUTCDate() - 1,
            prevDate.getUTCHours(),
            prevDate.getUTCMinutes());
        };

        // Value for hovered boundary tick
        tl.zoom.current.ticks.boundary.hover = function (d) {
          return new Date(d.getUTCFullYear(),
            d.getUTCMonth(),
            model.selected.getUTCDate());
        };

        // Displayed default label
        tl.zoom.current.ticks.boundary.label = function (d) {
          return model.monthAbbr[d.getUTCMonth()];
        };

        // Displayed default sub-label (if any)
        tl.zoom.current.ticks.boundary.subLabel = function (d) {
          return d.getUTCFullYear();
        };

        // Value for clicked boundary tick
        tl.zoom.current.ticks.boundary.clickDate = function (d) {
          var prevDate = model.selected;
          d = new Date(d.getUTCFullYear(),
            d.getUTCMonth(),
            prevDate.getUTCDate(),
            prevDate.getUTCHours(),
            prevDate.getUTCMinutes());
          d = new Date(d.getTime() - (d.getTimezoneOffset() * 60000));
          if (!moment(prevDate).isDST() && moment(d).isDST()) {
            prevDate = new Date(prevDate.getTime() + (1 * 60 * 60 * 1000));
          } else if (moment(prevDate).isDST() && !moment(d).isDST()) {
            prevDate = new Date(prevDate.getTime() - (1 * 60 * 60 * 1000));
          }
          prevDate = new Date(prevDate.getTime() - (prevDate.getTimezoneOffset() * 60000));
          return new Date(d.getUTCFullYear(),
            d.getUTCMonth(),
            prevDate.getUTCDate(),
            prevDate.getUTCHours(),
            prevDate.getUTCMinutes());
        };

        // When the date updates while dragging the pick forward
        tl.zoom.current.pick.nextChange = function (d) {
          return new Date(Date.UTC(d.getUTCFullYear(),
            d.getUTCMonth(),
            d.getUTCDate() + 1));
        };

        // When the date updates while dragging the pick backward
        tl.zoom.current.pick.prevChange = function (d) {
          return new Date(Date.UTC(d.getUTCFullYear(),
            d.getUTCMonth(),
            d.getUTCDate()));
        };

        tl.zoom.current.pick.hoverTick = function (newDate) {
          tl.zoom.current.pick.hoveredTick = d3.selectAll('.x.axis>g.tick')
            .filter(function (d) {
              return (d.getUTCFullYear() === newDate.getUTCFullYear()) &&
                (d.getUTCMonth() === newDate.getUTCMonth() &&
                  (d.getUTCDate() === newDate.getUTCDate()));
            });
        };

        d3.selectAll('.x.axis > g.tick')
          .each(function () {
            var currentTick = d3.select(this);
            var currentTickData = currentTick.data()[0];
            if ((currentTickData.getUTCDay() === 0) &&
              (currentTickData.getUTCDate() !== 1)) {
              currentTick
                .insert('line', 'rect')
                .attr('y1', 0)
                .attr('y2', -10)
                .attr('x2', 0)
                .classed('tick-week', true);
            }
          });

        switchZoom(3);

        self.currentZoom = 3;
        break;
      case 4: // 10-Minute
        dateStep = 10;
        labelFormat = d3.time.format.utc('%H:%M');
        dateInterval = d3.time.minutes;
        tickCount = (tl.data.end() - tl.data.start()) / 1000 / 60 / 10;
        tickWidth = 1;
        tickCountMax = tl.width;

        paddedRange = [
          new Date(tl.data.start().setUTCMinutes(tl.data.start().getUTCMinutes() - 50)),
          new Date(tl.data.end().setUTCMinutes(tl.data.end().getUTCMinutes() + 50))
        ];

        altEnd = new Date(tl.data.start()
          .getUTCFullYear(),
        tl.data.start()
          .getUTCMonth(),
        tl.data.start()
          .getUTCDate(),
        tl.data.start()
          .getUTCHours(),
        tl.data.start()
          .getUTCMinutes() + tickCountMax);

        tl.zoom.drawTicks(tickCount,
          tickCountMax,
          altEnd,
          tickWidth,
          dateInterval,
          dateStep,
          labelFormat,
          event,
          paddedRange);

        // Filters ticks for nonboundaries that have the following attribute
        // Creates normal ticks, use this to space those tick
        tl.zoom.current.ticks.normal.all = function () {
          tl.ticks.normal.all = tl.ticks.all.filter(function (d) {
            // This should be rewritten to be cleaner
            if (d.getUTCHours() % 6 !== 0) {
              return d;
            } else {
              return d.getUTCMinutes();
            }
          });
          tl.ticks.normal.setEnds();
        };

        // Filters ticks for boundaries that have the following attribute
        // Creates wider ticks; use this to space those ticks
        tl.zoom.current.ticks.boundary.all = function () {
          tl.ticks.boundary.all = tl.ticks.all.filter(function (d) {
            return d.getUTCHours() % 6 === 0 && d.getUTCMinutes() === 0;
          });
        };

        // Calculated next boundary tick by date
        // The interval in which the white hover label shows
        tl.zoom.current.ticks.boundary.next = function (current) {
          var next = new Date(current);
          return new Date(next.setUTCHours(next.getUTCHours() + 6));
        };

        // Calculated next normal tick by date
        // The interval in which the hover semi-transparent bg appears over ticks
        tl.zoom.current.ticks.normal.next = function (current) {
          var next = new Date(current);
          return new Date(next.setUTCMinutes(next.getUTCMinutes() + 10));
        };

        // Date of first printed boundary interval of this zoom level
        tl.zoom.current.ticks.boundary.first = function () {
          var first = tl.ticks.normal.firstDate;
          return new Date(Date.UTC(
            first.getUTCFullYear(),
            first.getUTCMonth(),
            first.getUTCDate(),
            first.getUTCHours() - 6,
            0));
        };

        // Date of first printed normal tick
        tl.zoom.current.ticks.normal.first = function () {
          var first = tl.ticks.normal.firstDate;
          return new Date(Date.UTC(first.getUTCFullYear(),
            first.getUTCMonth(),
            first.getUTCDate(),
            first.getUTCHours(),
            first.getUTCMinutes() - 10));
        };

        // Date of last printed boundary interval of this zoom level
        tl.zoom.current.ticks.boundary.last = function () {
          var last = tl.ticks.normal.lastDate;
          return new Date(Date.UTC(
            last.getUTCFullYear(),
            last.getUTCMonth(),
            last.getUTCDate(),
            last.getUTCHours() + 6,
            0));
        };

        // Value for normal tick hover label
        tl.zoom.current.ticks.normal.hover = function (d) {
          // No modifications to date obj at this zoom level
          return d;
        };

        // Value for clicked normal tick
        tl.zoom.current.ticks.normal.clickDate = function (d) {
          d = new Date(d.getTime() - (d.getTimezoneOffset() * 60000));
          return new Date(d.getUTCFullYear(),
            d.getUTCMonth(),
            d.getUTCDate(),
            d.getUTCHours(),
            d.getUTCMinutes());
        };

        // Value for boundary ribbon hover label
        tl.zoom.current.ticks.boundary.hover = function (d) {
          d = new Date(d.getTime() - (d.getTimezoneOffset() * 60000));
          return new Date(d.getUTCFullYear(),
            d.getUTCMonth(),
            d.getUTCDate(),
            d.getUTCHours(),
            d.getUTCMinutes());
        };

        // Displayed default label
        tl.zoom.current.ticks.boundary.label = function (d) {
          // reutn null;
          return util.pad(d.getUTCHours(), 2, '0') + ':' + util.pad(d.getUTCMinutes(), 2, '0');
        };

        // Displayed default sub-label (if any)
        tl.zoom.current.ticks.boundary.subLabel = function (d) {
          return null;
        };

        // Value for clicked boundary tick
        // TODO: Return to 6 hr with 0 minute if pick is within 6 hour range, otherwise
        // maintain the minute interval
        tl.zoom.current.ticks.boundary.clickDate = function (d) {
          d = new Date(d.getTime() - (d.getTimezoneOffset() * 60000));
          var selected = model.selected;
          selected = new Date(selected.getTime() - (selected.getTimezoneOffset() * 60000));
          return new Date(d.getUTCFullYear(),
            d.getUTCMonth(),
            d.getUTCDate(),
            d.getUTCHours(),
            selected.getUTCMinutes());
        };

        // When the date updates while dragging the pick forward
        tl.zoom.current.pick.nextChange = function (d) {
          d = util.roundTimeTenMinute(d);
          return new Date(Date.UTC(d.getUTCFullYear(),
            d.getUTCMonth(),
            d.getUTCDate(),
            d.getUTCHours(),
            d.getUTCMinutes() + 10));
        };

        // When the date updates while dragging the pick backward
        tl.zoom.current.pick.prevChange = function (d) {
          d = util.roundTimeTenMinute(d);
          return new Date(Date.UTC(d.getUTCFullYear(),
            d.getUTCMonth(),
            d.getUTCDate(),
            d.getUTCHours(),
            d.getUTCMinutes()));
        };

        tl.zoom.current.pick.hoverTick = function (newDate) {
          tl.zoom.current.pick.hoveredTick = d3.selectAll('.x.axis>g.tick')
            .filter(function (d) {
              return (d.getUTCFullYear() === newDate.getUTCFullYear()) &&
                (d.getUTCMonth() === newDate.getUTCMonth() &&
                  (d.getUTCDate() === newDate.getUTCDate()) &&
                    (d.getUTCHours() === newDate.getUTCHours()) &&
                      (d.getUTCMinutes() === newDate.getUTCMinutes()));
            });
        };
        // Creates small hour notches in the timeline
        d3.selectAll('.x.axis > g.tick')
          .each(function () {
            var currentTick = d3.select(this);
            var currentTickData = currentTick.data()[0];
            if (currentTickData.getUTCMinutes() === 0) {
              currentTick
                .insert('line', 'rect')
                .attr('y1', 0)
                .attr('y2', -10)
                .attr('x2', 0)
                .classed('tick-hour', true);
            }
          });

        switchZoom(4);

        self.currentZoom = 4;
        break;

      default:
        console.log('Invalid Zoom level');
    }

    // TODO: Maybe group check, initTicks, and removePadding
    tl.ticks.check();
    initTicks();

    tl.pick.update();
    tl.pick.checkLocation();
    model.selectedZoom = level;
    model.events.trigger('zoom-change');
    model.events.trigger('timeline-change');
  };

  var switchZoom = function (zoomLevel) {
    var clone;
    var zoomElement;
    switch (zoomLevel) {
      case 1:
        zoomElement = '#zoom-years';
        break;
      case 2:
        zoomElement = '#zoom-months';
        break;
      case 3:
        zoomElement = '#zoom-days';
        break;
      case 4:
        zoomElement = '#zoom-minutes';
        break;
    }
    $('#current-zoom').remove();
    clone = $(zoomElement).clone().prop('id', 'current-zoom')
      .removeClass('zoom-btn-inactive').addClass('zoom-btn-active');
    $('#zoom-btn-container').prepend(clone);
  };

  // Draw ticks based on zoom level
  var initTicks = function () {
    tl.ticks.boundary.init();
    tl.ticks.normal.init();
    tl.ticks.normal.set(); // could probably combine set and bind
    tl.ticks.normal.bind();
    tl.ticks.boundary.set();
    tl.ticks.boundary.bind();
  };

  var init = function () {
    $('#zoom-btn-container').hover(function () {
      $('.wv-tooltip').toggle();
    });
    $('.zoom-btn-inactive')
      .on('click', function (d) {
        var dataZoom = $(this).attr('data-zoom');
        switch (dataZoom) {
          case '1':
            self.zoom(1);
            break;
          case '2':
            self.zoom(2);
            break;
          case '4':
            self.zoom(4);
            break;
          default:
            self.zoom(3);
            break;
        }
      });
    // Default zoom
    self.zoom(zoomLevel);
    tl.setClip(); // fix for firefox svg overflow
  };

  init();
  return self;
};

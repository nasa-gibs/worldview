import $ from 'jquery';
import uiMouse from '../ui/mouse';
import d3 from 'd3';
/**
 * Perform timeline zooming functions

 */
export function timelineZoom(models, config, ui) {
  var tl = ui.timeline;
  var self = {};

  self.current = {
    ticks: {
      // Placeholders
      boundary: {

      },
      normal: {

      }
    },
    pick: {
      // Placeholder
    }
  };

  self.change = function (amount, event) {
    var zoom = tl.config.currentZoom;

    zoom += -amount;
    if (zoom < 1) {
      zoom = 1;
    }
    if (zoom > 4) {
      zoom = 4;
    }

    tl.config.zoom.call(this, zoom, event);
  };

  self.drawTicks = function (tickCount, tickCountMax, altEnd, tickWidth, dateInterval, dateStep, labelFormat, event, paddedRange) {
    var mouseOffset, mousePos;

    if (event) {
      var relX = event.clientX - $('#timeline-footer')
        .offset()
        .left;
      mousePos = tl.x.invert(relX);
      mouseOffset = (tl.width - tl.margin.left - tl.margin.right) / 2 - relX;
    }

    var dataStart = tl.data.start();
    var dataEnd;
    var rangeStart = (tl.width / 2) - ((tickCount * tickWidth) / 2);
    var rangeEnd = (tl.width / 2) + ((tickCount * tickWidth) / 2);

    if (tickCountMax > tickCount) {
      tl.isCropped = false;
      dataEnd = tl.data.end();
      rangeStart = (tl.width / 2) - ((tickCount * tickWidth) / 2);
      rangeEnd = (tl.width / 2) + ((tickCount * tickWidth) / 2);
    } else {
      tl.isCropped = true;
      dataEnd = altEnd;
      rangeStart = 0;
      rangeEnd = tl.width;
    }

    tl.x.domain([dataStart, dataEnd])
      .range([rangeStart, rangeEnd]);

    tl.xAxis.scale(tl.x)
      .ticks(dateInterval, dateStep)
      .tickFormat(labelFormat);

    tl.axisZoom = d3.behavior.zoom()
      .scale(1)
      .scaleExtent([1, 1])
      .x(tl.x);

    if (tl.isCropped) {
      tl.axisZoom.xExtent(paddedRange);
    } else {
      tl.axisZoom.xExtent([tl.data.start(), tl.data.end()]);
    }

    uiMouse.wheel(tl.axisZoom, ui)
      .change(self.change);

    tl.svg.call(tl.axisZoom);

    if (event) {
      tl.pan.toCursor(mousePos, mouseOffset);
    } else {
      tl.pan.toSelection();
    }

    tl.axis.selectAll('.tick')
      .remove();

    tl.axis.call(tl.xAxis);
  };

  self.refresh = function () {
    tl.config.zoom(tl.config.currentZoom);
  };

  var init = function () {

  };

  init();
  return self;
};

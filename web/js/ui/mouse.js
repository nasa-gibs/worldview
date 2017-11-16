import util from '../util/util';
import d3 from 'd3';

export default {
  click: function ($element, callback) {
    var self = {};
    self.sensitivity = 5; // pixels

    var startX, startY;

    var init = function () {
      $element.mousedown(mousedown);
      $element.mouseup(mouseup);
    };

    var mousedown = function (event) {
      startX = event.clientX;
      startY = event.clientY;
    };

    var mouseup = function (event) {
      if (withinClickDistance(event)) {
        callback.call(this);
      }
    };

    var withinClickDistance = function (event) {
      var targetX = event.clientX;
      var targetY = event.clientY;
      var distance = Math.sqrt(Math.pow(startX - targetX, 2) +
        Math.pow(startY - targetY, 2));
      return distance <= self.sensitivity;
    };

    init();
    return self;
  },
  wheel: function (element, ui, options) {
    options = options || {};

    var self = {};
    self.timeout = options.timeout || 100; // milliseconds
    self.threshold = options.threshold || 100; // delta units
    self.events = util.events();

    var delta = 0;
    var zoomed = false;
    var timer = null;
    var timeout = false;
    var lastEvent = null;

    var init = function () {
      element.on('zoom', wheel);
    };

    self.change = function (listener) {
      self.events.on('change', listener);
      return self;
    };

    var wheel = function () {
      var evt = d3.event.sourceEvent;
      if ((Math.abs(evt.deltaX) <= Math.abs(evt.deltaY)) && timeout === false) {
        lastEvent = evt;
        delta += evt.deltaY;
        if (!timer) {
          zoomed = false;
        }
        clearTimeout(timer);
        timer = setTimeout(end, self.timeout);
        update(evt);
      } else if ((Math.abs(evt.deltaX) >= Math.abs(evt.deltaY))) {
        if (ui.timeline.isCropped) {
          ui.timeline.pan.axis(d3.event);
          timeout = true;
          clearTimeout(timer);
          timer = setTimeout(function () {
            timeout = false;
          }, 500);
        }
      } else {
        if (ui.timeline.isCropped) {
          ui.timeline.pan.axis();
        }
      }
    };

    var update = function (event) {
      var change = Math.floor(Math.abs(delta) / self.threshold);
      if (change >= 1) {
        var sign = delta ? delta < 0 ? -1 : 1 : 0;
        self.events.trigger('change', sign * change, event);
        delta = delta % self.threshold;
        zoomed = true;
      }
    };

    var end = function () {
      timer = null;
      if (!zoomed) {
        var sign = delta ? delta < 0 ? -1 : 1 : 0;
        self.events.trigger('change', sign, lastEvent);
      }
      lastEvent = null;
      delta = 0;
      zoomed = false;
    };

    init();
    return self;
  }
};

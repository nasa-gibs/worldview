import $ from 'jquery';
import util from '../util/util';
import d3 from 'd3';

export function timeline(models, config, ui) {
  var self = {};
  var model = models.date;

  self.enabled = false;

  self.margin = {
    top: 0,
    right: 30,
    bottom: 20,
    left: 30
  };

  self.getPadding = function () {
    self.padding = self.width / 4;
    return self.padding;
  };

  self.getWidth = function () {
    self.width = $(window)
      .outerWidth(true) -
      $('#timeline-header')
        .outerWidth(true) -
      $('#timeline-zoom')
        .outerWidth(true) -
      $('#timeline-hide')
        .outerWidth(true) -
      self.margin.left - self.margin.right - 2;
    return self.width;
  };

  self.height = 65 - self.margin.top - self.margin.bottom;

  self.isCropped = true;

  self.toggle = function (now) {
    var tl = $('#timeline-footer');
    var tlz = $('#timeline-zoom');
    var tlg = self.boundary;
    var gp = d3.select('#guitarpick');
    if (tl.is(':hidden')) {
      var afterShow = function () {
        tlz.show();
        $('#timeline')
          .css('right', '10px');
        tlg.attr('style', 'clip-path:url("#timeline-boundary")');
        gp.attr('style', 'display:block;clip-path:url(#guitarpick-boundary);');
      };
      if (now) {
        tl.show();
        afterShow();
      } else {
        tl.show('slow', afterShow);
      }
    } else {
      tlg.attr('style', 'clip-path:none');
      gp.attr('style', 'display:none;clip-path:none');
      tlz.hide();
      tl.hide('slow');
      $('#timeline')
        .css('right', 'auto');
    }
  };

  self.expand = function (now) {
    now = now || false;
    var tl = $('#timeline-footer, #timeline-zoom');
    if (tl.is(':hidden')) {
      self.toggle(now);
    }
  };

  self.expandNow = function () {
    self.expand(true);
  };

  self.collapse = function (now) {
    var tl = $('#timeline-footer, #timeline-zoom');
    if (!tl.is(':hidden')) {
      self.toggle(now);
    }
  };

  self.collapseNow = function () {
    self.collapse(true);
  };

  self.resize = function () {
    var small = util.browser.small || util.browser.constrained;
    if (self.enabled && small) {
      self.enabled = false;
      $('#timeline')
        .hide();
    } else if (!self.enabled && !small) {
      self.enabled = true;
      $('#timeline')
        .show();
    }

    if (self.enabled) {
      self.getWidth();

      self.svg.attr('width', self.width);

      d3.select('#timeline-boundary rect')
        .attr('width', self.width);

      d3.select('#guitarpick-boundary rect')
        .attr('width', self.width +
          self.margin.left +
          self.margin.right);

      self.axis.select('line:first-child')
        .attr('x2', self.width);
    }
  };

  self.setClip = function () { // This is a hack until Firefox fixes their svg rendering problems
    d3.select('#timeline-footer svg > g:nth-child(2)')
      .attr('visibility', 'hidden');
    d3.select('#timeline-footer svg > g:nth-child(2)')
      .attr('style', '');
    setTimeout(function () {
      d3.select('#timeline-footer svg > g:nth-child(2)')
        .attr('style', 'clip-path:url("#timeline-boundary")');
      d3.select('#timeline-footer svg > g:nth-child(2)')
        .attr('visibility', '');
    }, 50);
  };

  var drawContainers = function () {
    self.getWidth();

    self.svg = d3.select('#timeline-footer')
      .append('svg:svg')
      .attr('width', self.width) // + margin.left + margin.right)
      .attr('height', self.height + self.margin.top + self.margin.bottom + 16);

    self.svg
      .append('svg:defs')
      .append('svg:clipPath')
      .attr('id', 'timeline-boundary')
      .append('svg:rect')
      .attr('width', self.width) // + margin.left + margin.right)
      .attr('height', self.height + self.margin.top + self.margin.bottom);

    d3.select('#timeline-footer svg defs')
      .append('svg:clipPath')
      .attr('id', 'guitarpick-boundary')
      .append('svg:rect')
      .attr('width', self.width + self.margin.left + self.margin.right) // + margin.left + margin.right)
      .attr('height', self.height + self.margin.top + self.margin.bottom)
      .attr('x', -self.margin.left);

    self.boundary = self.svg
      .append('svg:g')
      .attr('clip-path', '#timeline-boundary')
      .attr('style', 'clip-path:url(#timeline-boundary)')
      .attr('transform', 'translate(0,16)');

    self.axis = self.boundary.append('svg:g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + self.height + ')');

    self.axis
      .insert('line', ':first-child')
      .attr('x1', 0)
      .attr('x2', self.width); // +margin.left+margin.right);

    self.dataBars = self.boundary.insert('svg:g', '.x.axis')
      .attr('height', self.height)
      .classed('plot', true);

    self.verticalAxis = self.boundary.append('svg:g')
      .attr('class', 'y axis')
      .attr('transform', 'translate(0,0)');
    self.animboundary = self.svg
      .append('svg:g')
      .attr('clip-path', '#timeline-boundary')
      .attr('transform', 'translate(0,16)');
    self.animboundary
      .append('g')
      .attr('id', 'wv-rangeselector-case');
  };

  var init = function () {
    var $timelineFooter = $('#timeline-footer');
    drawContainers();

    if (!models.anim) { // Hack: margin if anim is present
      $('#animate-button')
        .hide();
      $timelineFooter.css('margin-left', self.margin.left - 1 + 'px');
      $timelineFooter.css('margin-right', self.margin.right - 1 + 'px');
    } else {
      $timelineFooter.css('margin-left', '10px');
      $timelineFooter.css('margin-right', (self.margin.right + self.margin.left) - 34 + 'px');
    }

    self.x = d3.time.scale.utc();

    self.xAxis = d3.svg.axis()
      .orient('bottom')
      .tickSize(-self.height)
      .tickPadding(5);

    self.axisZoom = d3.behavior.zoom()
      .scale(1)
      .scaleExtent([1, 1]);

    self.resize();

    if (util.browser.localStorage) {
      if (localStorage.getItem('timesliderState') === 'collapsed') {
        self.collapseNow();
      }
    }

    $('#timeline-hide')
      .click(function () {
        self.toggle();
      });

    $(window)
      .resize(function () {
        self.resize();
        self.zoom.refresh();
        self.setClip();
      });

    model.events.on('select', function () {
      self.input.update();
      self.pick.shiftView();
    });

    models.layers.events.on('change', function () {
      self.data.set();
    });
  };

  init();
  return self;
};

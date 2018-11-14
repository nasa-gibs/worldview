import util from '../util/util';
import d3 from 'd3';
import googleTagManager from 'googleTagManager';

export function timeline(models, config, ui) {
  var self = {};
  var model = models.date;
  var subdaily;
  self.enabled = false;

  self.margin = {
    top: 0,
    right: 50,
    bottom: 20,
    left: 30
  };

  self.getPadding = function() {
    self.padding = self.width / 4;
    return self.padding;
  };

  self.getWidth = function() {
    self.width =
      $(window).outerWidth(true) -
      $('#timeline-header').outerWidth(true) -
      $('#timeline-hide').outerWidth(true) -
      self.margin.left -
      self.margin.right +
      28;
    return self.width;
  };

  self.height = 65 - self.margin.top - self.margin.bottom;

  self.isCropped = true;

  self.toggle = function(now) {
    var tl = $('#timeline-footer');
    var tlg = self.boundary;
    var gp = d3.select('#guitarpick');
    if (tl.is(':hidden')) {
      var afterShow = function() {
        tlg.attr('style', 'clip-path:url("#timeline-boundary")');
        gp.attr('style', 'clip-path:url(#guitarpick-boundary);');
      };
      if (now) {
        tl.show();
        afterShow();
      } else {
        tl.show('slow', afterShow);
      }
      $('#timeline').removeClass('closed');
    } else {
      tlg.attr('style', 'clip-path:none');
      gp.attr('style', 'display:none;clip-path:none');
      tl.hide('slow');
      $('#timeline').addClass('closed');
    }
  };

  self.expand = function(now) {
    now = now || false;
    var tl = $('#timeline-footer');
    if (tl.is(':hidden')) {
      self.toggle(now);
    }
  };

  self.expandNow = function() {
    self.expand(true);
  };

  self.collapse = function(now) {
    var tl = $('#timeline-footer');
    if (!tl.is(':hidden')) {
      self.toggle(now);
    }
  };

  self.collapseNow = function() {
    self.collapse(true);
  };

  self.resize = function() {
    var small = util.browser.small || util.browser.constrained;
    if (self.enabled && small) {
      self.enabled = false;
      $('#timeline').hide();
    } else if (!self.enabled && !small) {
      self.enabled = true;
      $('#timeline').show();
    }

    if (self.enabled) {
      self.getWidth();

      self.svg
        .attr('width', self.width)
        .attr(
          'viewBox',
          '0 1 ' +
            self.width +
            ' ' +
            (self.height + self.margin.top + self.margin.bottom + 26)
        );

      d3.select('#timeline-boundary rect').attr('width', self.width);

      d3.select('#guitarpick-boundary rect').attr(
        'width',
        self.width + self.margin.left + self.margin.right
      );

      self.axis.select('line:first-child').attr('x2', self.width);
    }
  };

  self.setClip = function() {
    // This is a hack until Firefox fixes their svg rendering problems
    d3.select('#timeline-footer svg > g:nth-child(2)').attr(
      'visibility',
      'hidden'
    );
    d3.select('#timeline-footer svg > g:nth-child(2)').attr('style', '');
    setTimeout(function() {
      d3.select('#timeline-footer svg > g:nth-child(2)').attr(
        'style',
        'clip-path:url("#timeline-boundary")'
      );
      d3.select('#timeline-footer svg > g:nth-child(2)').attr('visibility', '');
    }, 50);
  };

  var drawContainers = function() {
    self.getWidth();

    self.svg = d3
      .select('#timeline-footer')
      .append('svg:svg')
      .attr('width', self.width) // + margin.left + margin.right)
      .attr('height', self.height + self.margin.top + self.margin.bottom + 42)
      .attr('id', 'timeline-footer-svg')
      .attr(
        'viewBox',
        '0 1 ' +
          self.width +
          ' ' +
          (self.height + self.margin.top + self.margin.bottom + 26)
      );

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
      .attr('clip-path', 'url(#timeline-boundary)')
      .attr('style', 'clip-path:url(#timeline-boundary)')
      .attr('transform', 'translate(0,16)');

    self.axis = self.boundary
      .append('svg:g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + self.height + ')');

    self.axis
      .insert('line', ':first-child')
      .attr('x1', 0)
      .attr('x2', self.width); // +margin.left+margin.right);

    self.dataBars = self.boundary
      .insert('svg:g', '.x.axis')
      .attr('height', self.height)
      .classed('plot', true);

    self.verticalAxis = self.boundary
      .append('svg:g')
      .attr('class', 'y axis')
      .attr('transform', 'translate(0,0)');
    self.animboundary = self.svg
      .append('svg:g')
      .attr('clip-path', '#timeline-boundary')
      .attr('transform', 'translate(0,16)');
    self.animboundary.append('g').attr('id', 'wv-rangeselector-case');
  };
  var updateTimeUi = function() {
    self.input.update();
    self.pick.shiftView();
  };
  var onLayerUpdate = function() {
    const layersContainSubdaily = models.layers.hasSubDaily();
    self.data.set();
    self.resize();
    self.setClip();
    if (subdaily !== layersContainSubdaily) {
      self.zoom.refresh();
      self.input.update();
      subdaily = layersContainSubdaily;
    }
  };
  var init = function() {
    var $timelineFooter = $('#timeline-footer');
    models.layers.events.trigger('toggle-subdaily');
    subdaily = models.layers.hasSubDaily();
    drawContainers();

    if (!models.anim) {
      // Hack: margin if anim is present
      $('#animate-button').hide();
      $timelineFooter.css('margin-left', self.margin.left - 1 + 'px');
      $timelineFooter.css('margin-right', self.margin.right - 1 + 'px');
    } else {
      $timelineFooter.css('margin-left', '0');
      $timelineFooter.css(
        'margin-right',
        self.margin.right + self.margin.left - 32 + 'px'
      );
    }

    self.x = d3.time.scale.utc();

    self.xAxis = d3.svg
      .axis()
      .orient('bottom')
      .tickSize(-self.height)
      .tickPadding(5);

    self.axisZoom = d3.behavior
      .zoom()
      .scale(1)
      .scaleExtent([1, 1]);

    self.resize();

    if (util.browser.localStorage) {
      if (localStorage.getItem('timesliderState') === 'collapsed') {
        self.collapseNow();
      }
    }

    $('#timeline-hide').click(function() {
      googleTagManager.pushEvent({
        event: 'timeline_hamburger'
      });
      self.toggle();
    });

    $(window).resize(function() {
      self.resize();
      self.zoom.refresh();
      self.setClip();
    });
    model.events.on('select', updateTimeUi);
    model.events.on('state-update', updateTimeUi);
    if (models.compare) {
      models.compare.events.on('toggle-state', onLayerUpdate);
    }

    models.layers.events.on('change', onLayerUpdate);

    // Determine maximum end date and move tl pick there if selected date is
    // greater than the max end date
    models.layers.events.on('remove', function() {
      var endDate = models.date.maxDate();
      var selectedDate = models.date[models.date.activeDate];
      onLayerUpdate();
      if (selectedDate > endDate) {
        models.date.select(endDate);
      }
    });

    models.proj.events.on('select', function() {
      self.resize();
      self.setClip();
    });
  };

  init();
  return self;
}

import util from '../util/util';
import d3 from 'd3';
import React from 'react';
import ReactDOM from 'react-dom';
import googleTagManager from 'googleTagManager';
import Timeline from '../components/timeline/timeline';

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

  // self.expandNow = function() {
  //   self.expand(true);
  // };

  self.collapse = function(now) {
    now = now || false;
    var tl = $('#timeline-footer');
    if (!tl.is(':hidden')) {
      self.toggle(now);
    }
  };

  // self.collapseNow = function() {
  //   self.collapse(true);
  // };

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
          '0 9 ' +
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
    self.reactComponent.setState({ width: self.getWidth() });
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

  // var changeDate = (date) => {
  //   self.reactComponent.setState({ selectedDate: date });
  // };

  var incrementDate = (timeScale, increment) => {
    // self.expand(true);
    // console.log(timeScale, increment)
    // models.date.add(timeScale, increment);
    // self.input.animateByIncrement(increment, timeScale);
    // models.date.select(date);
  };

  var updateDate = (date) => {
    let updatedDate = new Date(date);
    // console.log(models)
    // self.input.update(updatedDate);
    // models.date.setActiveDate(updatedDate);
// console.log('updateDate', date, updatedDate)
    //# ALLOWS UPDATE OF MODELS DATE WHICH LAYERS IS CONNECTED TO
    models.date.select(updatedDate);
  };

  var setIntervalInput = (intervalValue, zoomLevel) => {
    // console.log(self.input.delta)
    self.input.delta = intervalValue;
    self.input.interval = zoomLevel;

    let zoomCustomText = document.querySelector('#zoom-custom');
    zoomCustomText.textContent = `${intervalValue} ${zoomLevel.toUpperCase().substr(0, 3)}`;
    console.log(self)
  }

  var getInitialProps = () => {
    // console.log(self)
    return {
      width: self.width,
      height: self.height,
      selectedDate: models.date[models.date.activeDate],
      // changeDate: changeDate,
      timeScale: 'day',
      incrementDate: incrementDate,
      updateDate: updateDate,
      setIntervalInput: setIntervalInput
    };
  };

  var drawContainers = function() {
    self.getWidth();
    let initialProps = getInitialProps();
    self.reactComponent = ReactDOM.render(
      React.createElement(Timeline, initialProps),
      document.getElementById('timelineContainer')
    );

    self.svg = d3
      .select('#timeline-footer')
      .append('svg:svg')
      .attr('width', self.width) // + margin.left + margin.right)
      .attr('height', self.height + self.margin.top + self.margin.bottom + 42)
      .attr('id', 'timeline-footer-svg')
      .attr(
        'viewBox',
        '0 9 ' +
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
      .attr('transform', 'translate(0,1)');

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

  var updateReactTimelineDate = function() {
    // debugger;
    let selectedDate = models.date[models.date.activeDate];
    // console.log(selectedDate, new Date(selectedDate).toISOString())
    // console.log(selectedDate);
    self.reactComponent.setState({
      selectedDate: selectedDate,
      dateFormatted: new Date(selectedDate).toISOString()
    });
  };

  var updateTimeUi = function() {
    updateReactTimelineDate();
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
    let timelineCase = document.getElementById('timeline');
    timelineCase.addEventListener('wheel', function(e) {
      e.preventDefault();
      e.stopPropagation();
    });

    $('#zoom-custom').on('click', function() {
      self.reactComponent.setState({
        customIntervalModalOpen: true
      });
    });

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
        self.collapse(true);
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
      onLayerUpdate();
    });
  };

  init();
  return self;
}

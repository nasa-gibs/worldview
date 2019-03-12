import util from '../util/util';
import d3 from 'd3';
import googleTagManager from 'googleTagManager';
import React from 'react';
import ReactDOM from 'react-dom';
import Timeline from '../components/timeline/timeline';

import { timelineData } from '../date/timeline-data';
import { timelineConfig } from '../date/config';
import { timelineZoom } from '../date/timeline-zoom';
import { timelineTicks } from '../date/timeline-ticks';
import { timelinePick } from '../date/timeline-pick';
import { timelinePan } from '../date/timeline-pan';
import { timelineInput } from '../date/timeline-input';
import { timelineCompare } from '../date/compare-picks';

export function timelineUi(models, config, ui) {
  var self = {};
  var model = models.date;
  var subdaily;
  self.enabled = false;

  // pass down as props
  self.margin = {
    top: 0,
    right: 50,
    bottom: 20,
    left: 30
  };

  // pass func down as props
  self.getPadding = function() {
    self.padding = self.width / 4;
    return self.padding;
  };

  // pass func down as props
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

  // pass down as props
  self.height = 65 - self.margin.top - self.margin.bottom;

  // pass down as props
  self.isCropped = true;

  // pass down as props with some refactoring
  self.toggle = function(now) {
    var tl = $('#timeline-footer');
    var tlg = self.boundary;
    // var gp = d3.select('#guitarpick');

    var gp = document.querySelector('#guitarpick');
    if (tl.is(':hidden')) {
      var afterShow = function() {
        tlg.attr('style', 'clip-path:url("#timeline-boundary")');
        // gp.attr('style', 'clip-path:url(#guitarpick-boundary);');
        gp.setAttribute('style', 'clip-path:url("#timeline-boundary")');
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
      // gp.attr('style', 'display:none;clip-path:none');
      gp.setAttribute('style', 'display:none;clip-path:none');
      tl.hide('slow');
      $('#timeline').addClass('closed');
    }
  };

  // pass func down as props
  self.expand = function(now) {
    now = now || false;
    var tl = $('#timeline-footer');
    if (tl.is(':hidden')) {
      self.toggle(now);
    }
  };

  // can stay
  self.expandNow = function() {
    self.expand(true);
  };

  // pass func down as props
  self.collapse = function(now) {
    var tl = $('#timeline-footer');
    if (!tl.is(':hidden')) {
      self.toggle(now);
    }
  };

  // can stay
  self.collapseNow = function() {
    self.collapse(true);
  };

  // pass func down as props with some setState here
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

      // self.reactComponent.setState({width: self.getWidth()});

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

  // pass func down as props with some setState here
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

  // handle all within top level react container
  // props needed : width, height, margin {}
  var drawContainers = function() {
    self.getWidth();
    // console.log(document.getElementById('timeline-footer'))

    self.reactComponent = ReactDOM.render(
      React.createElement(Timeline, { width: self.getWidth() }),
      document.getElementById('newTimeline')
    );

    // console.log(ReactDOM.findDOMNode(self.reactComponent));

    // console.log(self.reactComponent)

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

    // console.log(self.svg);
    // <svg width="975" height="107" id="timeline-footer-svg" viewBox="0 1 975 91"><defs><clipPath id="timeline-boundary"><rect width="975" height="65"></rect></clipPath><clipPath id="guitarpick-boundary"><rect width="1055" height="65" x="-30"></rect></clipPath></defs><g clip-path="url(#timeline-boundary)" style="clip-path:url(#timeline-boundary)" transform="translate(0,16)"><g class="x axis" transform="translate(0,45)"><line x1="0" x2="975"></line></g><g class="y axis" transform="translate(0,0)"></g></g><g clip-path="#timeline-boundary" transform="translate(0,16)"><g id="wv-rangeselector-case"></g></g></svg>

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

    // console.log(self.boundary);
    // <g clip-path="url(#timeline-boundary)" style="clip-path:url(#timeline-boundary)" transform="translate(0,16)"><g class="x axis" transform="translate(0,45)"><line x1="0" x2="975"></line></g><g class="y axis" transform="translate(0,0)"></g></g>

    self.axis = self.boundary
      .append('svg:g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + self.height + ')');

    self.axis
      .insert('line', ':first-child')
      .attr('x1', 0)
      .attr('x2', self.width); // +margin.left+margin.right);

    // console.log(self.axis);
    // <g class="x axis" transform="translate(0,45)"><line x1="0" x2="975"></line></g>

    // self.dataBars = self.boundary
    //   .insert('svg:g', '.x.axis')
    //   .attr('height', self.heightw)
    //   .classed('plot', true);

    self.verticalAxis = self.boundary
      .append('svg:g')
      .attr('class', 'y axis')
      .attr('transform', 'translate(0,0)');

    // console.log(self.verticalAxis);
    // <g class="y axis" transform="translate(0,0)"></g>

    self.animboundary = self.svg
      .append('svg:g')
      .attr('clip-path', '#timeline-boundary')
      .attr('transform', 'translate(0,16)');
    self.animboundary.append('g').attr('id', 'wv-rangeselector-case');

    // console.log(self.animboundary);
    // <g clip-path="#timeline-boundary" transform="translate(0,16)"><g id="wv-rangeselector-case"></g></g>
  };

  // probably leave
  var updateTimeUi = function() {
    self.input.update();
    self.pick.shiftView();
  };

  // probably leave
  var onLayerUpdate = function() {
    const layersContainSubdaily = models.layers.hasSubDaily();
    // self.data.set();
    self.resize();
    self.setClip();
    if (subdaily !== layersContainSubdaily) {
      self.zoom.refresh();
      self.input.update();
      subdaily = layersContainSubdaily;
    }
  };

  // NEW TIMELINE - change date
  var changeDate = (date) => {
    self.reactComponent.setState({ selectedDate: date });
  };

  var getInitialProps = () => {
    return {
      width: self.getWidth(),
      selectedDate: models.date[models.date.activeDate],
      drawContainers: drawContainers,
      changeDate: changeDate,
      timeScale: 'day'
    };
  };

  var initReact = () => {
    self.reactComponent = ReactDOM.render(
      React.createElement(Timeline, getInitialProps()),
      document.getElementById('newTimeline')
    );
    // console.log(document.getElementsByClassName('timelineDragger'));
  };
  // leave with major refactor
  var init = function() {
    var $timelineFooter = $('#timeline-footer');
    models.layers.events.trigger('toggle-subdaily');
    subdaily = models.layers.hasSubDaily();
    drawContainers();
    // initReact();
    let timelineCase = document.getElementById('timeline');
    timelineCase.addEventListener('wheel', function(e) {
      e.preventDefault();
      e.stopPropagation();
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
        self.collapseNow();
      }
    }

    // move to inside react
    $('#timeline-hide').click(function() {
      googleTagManager.pushEvent({
        event: 'timeline_hamburger'
      });
      self.toggle();
    });

    // isn't there already a resize ?
    $(window).resize(function() {
      self.resize();
      self.zoom.refresh();
      self.setClip();
      self.reactComponent.setState({ width: self.getWidth() });
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

  // need to set ui.timeline for use in other components
  ui.timeline = self;
  self.data = timelineData(models, config, ui);
  self.zoom = timelineZoom(models, config, ui);
  self.ticks = timelineTicks(models, config, ui);
  // self.newAxis = timelineAxis(models, config, ui);
  self.pick = timelinePick(models, config, ui);
  self.pan = timelinePan(models, config, ui);
  self.input = timelineInput(models, config, ui);
  self.config = timelineConfig(models, config, ui);
  if (config.features.compare) {
    self.compare = timelineCompare(models, config, ui);
  }

  // var getInitialProps = () => {

  //   return {
  //     width: self.getWidth(),
  //     drawContainers: drawContainers
  //   };
  // };

  // var initReact = () => {
  //   self.reactComponent = ReactDOM.render(
  //     React.createElement(Timeline, getInitialProps()),
  //     document.getElementById('newTimeline')
  //   );
  // };
  // initReact();

  // var updateXYZ = (X, Y, Z) => {
  //   self.reactComponent.setState({
  //     X: X,
  //     Y: Y,
  //     Z: Z
  //   });
  // };

  console.log(self)

  return self;
}

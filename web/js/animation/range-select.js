import $ from 'jquery';
import React from 'react';
import ReactDOM from 'react-dom';
import { RangeSelector } from 'worldview-components';
import d3 from 'd3';
import util from '../util/util';

export function animationRangeSelect(models, config, ui) {
  var self = {};
  var model;
  var timeline = ui.timeline;
  var $mountLocation = $('#wv-rangeselector-case');
  var $footer = $('#timeline-footer');
  var $header = $('#timeline-header');
  var $timeline = $('#timeline');

  /*
   * set listeners and initiates
   * widget
   *
   * @method init
   * @static
   *
   * @returns {void}
   *
   */
  self.init = function() {
    self.setDefaults();
    self.render();
    models.date.events.on('timeline-change', self.update);
    model.events.on('change', self.update);
  };

  /*
   * Sets default state for animation
   * feature
   *
   * @method setDefaults
   * @static
   *
   * @returns {void}
   *
   */
  self.setDefaults = function() {
    /*
     * Set some defaults
     */
    var rangeState;

    model = models.anim || {};
    model.rangeState = model.rangeState || {};
    rangeState = model.rangeState;
    rangeState.state = rangeState.state || null;
    rangeState.loop = rangeState.loop || false;
    rangeState.speed = rangeState.speed || 3;
  };
  /*
   * renders react rangeselector component
   *
   * @method render
   * @static
   *
   * @returns {void}
   *
   */
  self.render = function() {
    var options;
    var startLocation;
    var endLocation;
    var pick = d3.select('#guitarpick');
    var pickWidth = pick.node().getBoundingClientRect().width;
    var animEndLocation =
      d3.transform(pick.attr('transform')).translate[0] - pickWidth / 2; // getting guitar pick location
    if (model.rangeState.startDate) {
      startLocation = self.getLocationFromStringDate(
        model.rangeState.startDate
      );
      endLocation = self.getLocationFromStringDate(model.rangeState.endDate);
    } else {
      startLocation = animEndLocation - 100;
      endLocation = animEndLocation;
      self.updateRange(startLocation, endLocation);
    }

    options = {
      startLocation: startLocation, // or zero
      endLocation: endLocation,
      max: self.getMaxWidth(),
      startColor: '#40a9db',
      endColor: '#295f92',
      startTriangleColor: '#fff',
      endTriangleColor: '#4b7aab',
      rangeColor: '#45bdff',
      rangeOpacity: 0.3,
      pinWidth: 5,
      height: 45,
      onDrag: self.updateRange,
      onRangeClick: self.onRangeClick
    };
    self.reactComponent = ReactDOM.render(
      React.createElement(RangeSelector, options),
      $mountLocation[0]
    );
  };

  /*
   * calculates offset of timeline
   *
   * @method getHeaderOffset
   * @static
   *
   * @returns {number} OffsetX
   *
   */
  self.getHeaderOffset = function() {
    return (
      $header.width() +
      Number($timeline.css('left').replace('px', '')) +
      Number($footer.css('margin-left').replace('px', ''))
    );
  };

  /*
   * calculates offset of date
   * on timeline
   *
   * @method getLocationFromStringDate
   * @static
   *
   * @param date {string} date string
   * @returns {number} OffsetX
   *
   */
  self.getLocationFromStringDate = function(date) {
    return timeline.x(util.roundTimeTenMinute(date));
  };

  /*
   * updates react component state
   *
   * @method update
   * @static
   *
   * @param date {string} date string
   * @returns {void}
   *
   */
  self.update = function() {
    // being called from timeline.config.js
    var props = self.updateOptions();
    self.reactComponent.setState(props);
  };

  /*
   * returns max width of timeline
   *
   * @method getMaxWidth
   * @static
   *
   * @returns {number} max width
   *
   */
  self.getMaxWidth = function() {
    var $elWidth = $footer.width();
    var $dataWidth = timeline.x(timeline.data.end());
    if ($elWidth > $dataWidth) {
      return $dataWidth;
    }
    return $elWidth;
  };

  /*
   * Gets prop updates
   *
   * @method updateOptions
   * @static
   *
   * @returns {object} props
   *
   */
  self.updateOptions = function() {
    var state = model.rangeState;
    var props = {};
    props.startLocation = self.getLocationFromStringDate(state.startDate);
    props.endLocation = self.getLocationFromStringDate(state.endDate);
    props.max = self.getMaxWidth();

    return props;
  };

  /*
   * Handles click on widget:
   *  switches current date to
   *  date clicked
   *
   * @method onRangeClick
   * @static
   *
   * @param e {object} native event object
   *
   * @returns {object} props
   *
   */
  self.onRangeClick = function(e) {
    var headerOffset = self.getHeaderOffset();
    var offsetX = e.pageX - headerOffset;
    var date = timeline.x.invert(offsetX);
    models.date.select(date);
  };

  /*
   * Updates start and end dates and triggers
   * change events
   *
   * @method updateRange
   * @static
   *
   * @param startLocation {number} offsetX
   * @param EndLocation {number} offsetX
   *
   * @returns {object} props
   *
   */
  self.updateRange = function(startLocation, EndLocation) {
    var startDate = util.roundTimeTenMinute(timeline.x.invert(startLocation));
    var endDate = util.roundTimeTenMinute(timeline.x.invert(EndLocation));
    var state = model.rangeState;
    state.startDate = util.toISOStringSeconds(startDate) || 0;
    state.endDate = util.toISOStringSeconds(endDate);
    model.rangeState.playing = false;
    model.events.trigger('change');
    model.events.trigger('datechange');
  };
  self.init();
  return self;
}

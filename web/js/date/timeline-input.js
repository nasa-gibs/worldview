import $ from 'jquery';
import util from '../util/util';
import { getActiveDateString } from '../compare/util';
import { DateSelector } from 'worldview-components';
import React from 'react';
import ReactDOM from 'react-dom';

const dateSelectorStr = 'date-selector-main';
/**
 * Implements the date input
 *
 * @class wv.date.timeline.input
 */
export function timelineInput(models, config, ui) {
  var tl = ui.timeline;
  var model = models.date;
  var self = {};
  self.direction = 'forward';
  self.interval = 'day';
  self.delta = 1;
  self.active = false;
  self.delay = 500;
  self.reactComponent = null;
  var animator = null;
  var keyDown;

  var $incrementBtn = $('#right-arrow-group');
  var $decrementBtn = $('#left-arrow-group');

  var init = function() {
    $incrementBtn
      .mousedown(function(e) {
        e.preventDefault();
        switch (ui.timeline.config.currentZoom) {
          case 1:
            animateByIncrement(1, 'year');
            break;
          case 2:
            animateByIncrement(1, 'month');
            break;
          case 3:
            animateByIncrement(1, 'day');
            break;
          case 4:
            animateByIncrement(10, 'minute');
            break;
          default:
            animateByIncrement(1, 'day');
        }
      })
      .mouseup(stopper);

    $decrementBtn
      .mousedown(function(e) {
        e.preventDefault();
        switch (ui.timeline.config.currentZoom) {
          case 1:
            animateByIncrement(-1, 'year');
            break;
          case 2:
            animateByIncrement(-1, 'month');
            break;
          case 3:
            animateByIncrement(-1, 'day');
            break;
          case 4:
            animateByIncrement(-10, 'minute');
            break;
          default:
            animateByIncrement(-1, 'day');
        }
      })
      .mouseup(stopper);

    $(document)
      .mouseout(stopper)
      .keydown(function(event) {
        if (event.target.nodeName === 'INPUT' || keyDown === event.keyCode) {
          return;
        }
        switch (event.keyCode) {
          case util.key.LEFT:
            switch (models.date.selectedZoom) {
              case 1:
                animateByIncrement(-1, 'year');
                break;
              case 2:
                animateByIncrement(-1, 'month');
                break;
              case 3:
                animateByIncrement(-1, 'day');
                break;
              case 4:
                animateByIncrement(-10, 'minute');
                break;
            }
            break;
          case util.key.RIGHT:
            switch (models.date.selectedZoom) {
              case 1:
                animateByIncrement(1, 'year');
                break;
              case 2:
                animateByIncrement(1, 'month');
                break;
              case 3:
                animateByIncrement(1, 'day');
                break;
              case 4:
                animateByIncrement(10, 'minute');
                break;
            }
            event.preventDefault();
            break;
        }
        keyDown = event.keyCode;
      })
      .keyup(function(event) {
        switch (event.keyCode) {
          case util.key.LEFT:
          case util.key.RIGHT:
            stopper();
            event.preventDefault();
            break;
        }
        keyDown = null;
      });

    if (util.browser.tests.touchDevice()) {
      $('.button-input-group').prop('disabled', true);
    }
    self.reactComponent = ReactDOM.render(
      React.createElement(DateSelector, getProps()),
      document.getElementById(dateSelectorStr)
    );
    model.events.on('select', date => {
      console.log('select');
      self.reactComponent.setState({ date: date });
    });

    if (config.features.compare) {
      models.compare.events.on('toggle-state', () => {
        var dateModel = models.date;
        var activeDate =
          model.activeDate === 'selected' ? 'selectedB' : 'selected';
        model.activeDate = activeDate;
        self.reactComponent.setState({
          date: dateModel[activeDate]
        });
      });
    }
    self.update();
  };
  var getProps = function() {
    var dateSelection = 'selected';
    var model = models.date;
    var min = model.minDate();
    var max = model.maxDate();
    if (models.compare.active) {
      let compareModel = models.compare;
      dateSelection = getActiveDateString(
        compareModel.active,
        compareModel.isCompareA
      );
    }
    var date = model[dateSelection];
    return {
      width: '120',
      height: '30',
      id: 'main',
      idSuffix: 'animation-widget-main',
      minDate: min,
      maxDate: max,
      maxZoom: model.maxZoom,
      onDateChange: onDateSelect,
      date: date
    };
  };
  var onDateSelect = function(date) {
    var dateSelection = '';
    if (models.compare.active) {
      let compareModel = models.compare;
      dateSelection = getActiveDateString(
        compareModel.active,
        compareModel.isCompareA
      );
    }
    models.date.select(date, dateSelection);
  };
  /**
   * Add timeout to date change when buttons are being held so that
   * date changes don't happen too quickly
   *
   * @todo Create smart precaching so animation is smooth
   *
   * @param  {number} delta Amount of time to change
   * @param  {String} increment Zoom level of timeline
   *                  e.g. months,minutes, years, days
   * @return {void}
   */
  var animateByIncrement = function(delta, increment) {
    self.delta = Math.abs(delta);
    var dateSelection = '';
    if (models.compare.active) {
      let compareModel = models.compare;
      dateSelection = getActiveDateString(
        compareModel.active,
        compareModel.isCompareA
      );
    }
    function animate() {
      var nextTime = getNextTimeSelection(delta, increment);
      if (tl.data.start() <= nextTime <= util.now()) {
        models.date.add(increment, delta, dateSelection);
      }
      animator = setTimeout(animate, self.delay);
    }
    animate();
  };
  /**
   *  Clear animateByIncrement's Timeout
   *
   * @return {void}
   */
  var stopper = function() {
    clearInterval(animator);
    animator = 0;
  };
  /**
   * @param  {Number} delta Date and direction to change
   * @param  {Number} increment Zoom level of change
   *                  e.g. months,minutes, years, days
   * @return {Object} JS Date Object
   */
  var getNextTimeSelection = function(delta, increment) {
    switch (increment) {
      case 'year':
        return new Date(
          new Date(model.selected).setUTCFullYear(
            model.selected.getUTCFullYear() + increment
          )
        );
      case 'month':
        return new Date(
          new Date(model.selected).setUTCMonth(
            model.selected.getUTCMonth() + increment
          )
        );
      case 'day':
        return new Date(
          new Date(model.selected).setUTCDate(
            model.selected.getUTCDate() + increment
          )
        );
      case 'minute':
        return new Date(
          new Date(model.selected).setUTCMinutes(
            model.selected.getUTCMinutes() + increment
          )
        );
    }
  };

  // TODO: Cleanup
  self.update = function(date) {
    var ms = date || new Date(model.selected);
    var nd = new Date(ms.setUTCDate(ms.getUTCDate() + 1));
    var pd = new Date(ms.setUTCDate(ms.getUTCDate() - 1));

    // Disable arrows if nothing before/after selection
    if (model.selectedZoom === 4 && ms >= util.now()) {
      $incrementBtn.addClass('button-disabled');
    } else if (model.selectedZoom !== 4 && nd > util.now()) {
      $incrementBtn.addClass('button-disabled');
    } else {
      $incrementBtn.removeClass('button-disabled');
    }
    if (pd.toUTCString() === tl.data.start().toUTCString()) {
      $decrementBtn.addClass('button-disabled');
    } else {
      $decrementBtn.removeClass('button-disabled');
    }

    tl.pick.update();
  };

  init();
  return self;
}

import util from '../util/util';
import DateSelector from '../components/date-selector/date-selector';
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
    models.layers.events.on('subdaily-updated', updateMaxZoom);
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

    self.reactComponent = ReactDOM.render(
      React.createElement(DateSelector, getProps()),
      document.getElementById(dateSelectorStr)
    );
    model.events.on('select', date => {
      self.reactComponent.setState({ date: date });
    });

    if (config.features.compare) {
      let dateModel = models.date;
      dateModel.events.on('state-update', () => {
        self.reactComponent.setState({
          date: dateModel[dateModel.activeDate]
        });
        self.update();
      });
    }
    self.update();
  };
  var getProps = function() {
    var model = models.date;
    var min = model.minDate();
    var max = model.maxDate();
    var date = model[model.activeDate];
    var maxZoom = model.maxZoom;
    if (model.maxZoom >= 4 || config.parameters.showSubdaily) {
      document.getElementById('timeline-header').classList.add('subdaily');
      maxZoom = 4;
    }

    return {
      width: '120',
      height: '30',
      id: 'main',
      idSuffix: 'animation-widget-main',
      minDate: min,
      maxDate: max,
      maxZoom: maxZoom,
      onDateChange: onDateSelect,
      date: date,
      fontSize: null
    };
  };
  var onDateSelect = function(date) {
    models.date.select(date);
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
    var endTime = models.layers.lastDateTime();
    var endDate = models.layers.lastDate();
    self.delta = Math.abs(delta);

    function animate() {
      var nextTime = getNextTimeSelection(delta, increment);
      if (ui.timeline.config.currentZoom >= 4) {
        if (tl.data.start() <= nextTime && nextTime <= endTime) {
          models.date.add(increment, delta);
        }
      } else {
        if (tl.data.start() <= nextTime && nextTime <= endDate) {
          models.date.add(increment, delta);
        }
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
    var prevDate = model[model.activeDate];

    switch (increment) {
      case 'year':
        return new Date(
          new Date(prevDate).setUTCFullYear(prevDate.getUTCFullYear() + delta)
        );
      case 'month':
        return new Date(
          new Date(prevDate).setUTCMonth(prevDate.getUTCMonth() + delta)
        );
      case 'day':
        return new Date(
          new Date(prevDate).setUTCDate(prevDate.getUTCDate() + delta)
        );
      case 'minute':
        return new Date(
          new Date(prevDate).setUTCMinutes(prevDate.getUTCMinutes() + delta)
        );
    }
  };

  self.update = function(date) {
    var ms = date || new Date(model[model.activeDate]);
    var endDate = models.layers.lastDate();
    var endDateTime = models.layers.lastDateTime();
    let nt = new Date(ms);
    let nd = new Date(ms);
    let pd = new Date(ms);

    nt = new Date(nt.setUTCMinutes(nt.getUTCMinutes() + 10));
    nd = new Date(nd.setUTCDate(nd.getUTCDate() + 1));
    pd = new Date(pd.setUTCDate(pd.getUTCDate() - 1));

    // Disable arrows if nothing before/after selection
    if (model.selectedZoom > 3 && nt >= endDateTime) {
      $incrementBtn.addClass('button-disabled');
    } else if (model.selectedZoom < 4 && nd > endDate) {
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

  var updateMaxZoom = function() {
    if (model.maxZoom >= 4) {
      document.getElementById('timeline-header').classList.add('subdaily');
    } else {
      if (ui.timeline && ui.timeline.config.currentZoom > 3) {
        document.getElementById('zoom-days').click();
      }
      document.getElementById('timeline-header').classList.remove('subdaily');
    }
    self.reactComponent.setState({ maxZoom: model.maxZoom });
    model.events.trigger('update-timewheel');
  };

  init();
  return self;
}

import $ from 'jquery';
import util from '../util/util';
import lodashParseInt from 'lodash/parseInt';
import lodashDebounce from 'lodash/debounce';

/**
 * Implements the date input
 *
 * @class wv.date.timeline.input
 */
export function timelineInput(models, config, ui) {
  var tl = ui.timeline;
  var model = models.date;
  var self = {};
  var rollingDate;
  self.direction = 'forward';
  self.interval = 'day';
  self.delta = 1;
  self.active = false;
  self.delay = 500;
  var animator = null;
  var keyDown;

  var $incrementBtn = $('#right-arrow-group');
  var $decrementBtn = $('#left-arrow-group');

  var init = function () {
    $incrementBtn
      .mousedown(function (e) {
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
      .mousedown(function (e) {
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
      .keydown(function (event) {
        if (event.target.nodeName === 'INPUT' || keyDown === event.keyCode) return;
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
      .keyup(function (event) {
        switch (event.keyCode) {
          case util.key.LEFT:
          case util.key.RIGHT:
            stopper();
            event.preventDefault();
            break;
        }
        keyDown = null;
      });
    // bind click action to interval radio buttons
    var $buttons = $('.button-input-group');
    var $oneIntervalButtons = $('.1-interval-group');
    var $tenIntervalButtons = $('.10-interval-group');
    $buttons.unbind();
    $oneIntervalButtons.unbind();
    $tenIntervalButtons.unbind();
    // FIXME: Quick fix for fixing the propagation
    // of events with arrow keys and input field
    $oneIntervalButtons.keydown(function (event) {
      var interval = $(this)
        .attr('id')
        .split('-')[0];
      event.stopPropagation();
      if (event.keyCode === (util.key.LEFT || util.key.RIGHT)) {
        event.preventDefault();
        $(this)
          .select()
          .focus();
      } else if (event.keyCode === (util.key.UP)) {
        event.preventDefault();
        roll(interval, 1);
        $(this)
          .select()
          .focus();
      } else if (event.keyCode === (util.key.DOWN)) {
        event.preventDefault();
        roll(interval, -1);
        $(this)
          .select()
          .focus();
      }
    });

    // FIXME: Quick fix for fixing the propagation
    // of events with arrow keys and input field
    $tenIntervalButtons.keydown(function (event) {
      var interval = $(this)
        .attr('id')
        .split('-')[0];
      event.stopPropagation();
      if (event.keyCode === (util.key.LEFT || util.key.RIGHT)) {
        event.preventDefault();
        $(this)
          .select()
          .focus();
      } else if (event.keyCode === (util.key.UP)) {
        event.preventDefault();
        roll(interval, 10);
        $(this)
          .select()
          .focus();
      } else if (event.keyCode === (util.key.DOWN)) {
        event.preventDefault();
        roll(interval, -10);
        $(this)
          .select()
          .focus();
      }
    });

    $buttons.on('focus', function (e) {
      e.preventDefault();
      $buttons.siblings('.date-arrows')
        .css('visibility', '');
      $buttons.parent()
        .removeClass('selected');
      $(this)
        .parent()
        .addClass('selected');
      $(this)
        .siblings('.date-arrows')
        .css('visibility', 'visible');
    });

    $buttons.focusout(function (e) {
      $buttons.siblings('.date-arrows')
        .css('visibility', '');
      $buttons.parent()
        .removeClass('selected');
    });

    var $incrementIntDate = $('.date-arrow-up');
    $incrementIntDate.click(roll);
    $incrementIntDate.mousedown(function (e) {
      e.preventDefault();
    });

    var $decrementIntDate = $('.date-arrow-down');
    $decrementIntDate.click(roll);
    $decrementIntDate.mousedown(function (e) {
      e.preventDefault();
    });

    // select all input on focus
    $('input')
      .focus(function (e) {
        $(this)
          .select();
      })
      .mouseup(function (e) {
        e.preventDefault();
      });

    $('.button-input-group')
      .keydown(validateInput)
      .focusout(function (event) {
        if ($(this)
          .hasClass('focus')) {
          $(this)
            .removeClass('focus');
          validateInput.call(this, event);
        }
      })
      .focus(function () {
        $(this)
          .addClass('focus');
      });

    $('#focus-guard-1')
      .on('focus', function () {
        $('#minute-input-group')
          .focus()
          .select();
      });
    $('#focus-guard-2')
      .on('focus', function () {
        $('#year-input-group')
          .focus()
          .select();
      });

    if (util.browser.tests.touchDevice()) {
      $('.button-input-group')
        .prop('disabled', true);
    }

    self.update();
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
    var endDate = models.layers.lastDate();
    self.delta = Math.abs(delta);
    function animate() {
      var nextTime = getNextTimeSelection(delta, increment);
      if (tl.data.start() <= nextTime <= endDate) {
        models.date.add(increment, delta);
      };
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
        return new Date(new Date(model.selected).setUTCFullYear(model.selected.getUTCFullYear() + increment));
      case 'month':
        return new Date(new Date(model.selected).setUTCMonth(model.selected.getUTCMonth() + increment));
      case 'day':
        return new Date(new Date(model.selected).setUTCDate(model.selected.getUTCDate() + increment));
      case 'minute':
        return new Date(new Date(model.selected).setUTCMinutes(model.selected.getUTCMinutes() + increment));
    }
  };
  /**
   * Change date input with up or down button and roll date if
   * max or min date is reached when changed
   *
   * @param  {String} dataInterval Interval of change
   *                  e.g. months,minutes, years, days
   * @param  {Number} amt Amount to change
   * @return {void}
   */
  var roll = function (dataInterval, amt) {
    var interval = $(this)
      .attr('data-interval') || dataInterval;
    var amount = lodashParseInt($(this)
      .attr('data-value')) || amt;
    var date = rollingDate || models.date.selected;
    var min = models.date.minDate();
    var max = models.date.maxDate();
    var newDate = util.rollDate(date, interval, amount, min, max);
    if (newDate !== date) {
      rollingDate = newDate;
      $(this)
        .parent()
        .css('border-color', '');
      updateDateInputs(rollingDate);
      debounceDateChange(rollingDate, this);
    }
  };
  /**
   * @param  {Object} newDate JS date Object
   * @param  {el} el JS element
   * @return {void}
   */
  var selectNewDate = function(newDate, el) {
    model.select(newDate);
    $(el)
      .parent()
      .find('input')
      .select();
  };
  var debounceDateChange = lodashDebounce(selectNewDate, self.delay);

  // TODO: Replace with WVC
  var validateInput = function (event) {
    var endDate = models.layers.lastDate();
    var kc = event.keyCode || event.which;
    var entered = (kc === 13) || (kc === 9); // carriage return or horizontal tab
    if (event.type === 'focusout' || entered) {
      if (entered) {
        event.preventDefault();
      }

      let selected = $(this);
      let YMDInterval = selected.attr('id');
      let newInput = selected.val();
      let selectedDateObj = null;
      switch (YMDInterval) {
        case 'year-input-group':
          if ((newInput > 1000) && (newInput < 9999)) {
            selectedDateObj = new Date(
              (new Date(model.selected))
                .setUTCFullYear(newInput));
          }
          break;
        case 'month-input-group':
          if (($.isNumeric(newInput)) &&
            (newInput < 13) && (newInput > 0)) {
            selectedDateObj = new Date(
              (new Date(model.selected))
                .setUTCMonth(newInput - 1));
          } else {
            let validStr = false;
            let newIntInput;
            newInput = newInput.toUpperCase();

            for (var i = 0; i < model.monthAbbr.length; i++) {
              if (newInput === model.monthAbbr[i]) {
                validStr = true;
                newIntInput = i;
              }
            }
            if (validStr) {
              selectedDateObj = new Date(
                (new Date(model.selected))
                  .setUTCMonth(newIntInput));
            }
          }
          break;
        case 'day-input-group':
          if (newInput > 0 &&
            newInput <= (new Date(model.selected.getYear(),
              model.selected.getMonth() + 1, 0)
              .getDate())) {
            selectedDateObj = new Date(
              (new Date(model.selected))
                .setUTCDate(newInput));
          }
          break;
        case 'hour-input-group':
          if ((newInput >= 0) && (newInput <= 23)) {
            selectedDateObj = new Date(
              (new Date(model.selected))
                .setUTCHours(newInput));
          }
          break;
        case 'minute-input-group':
          if ((newInput >= 0) && (newInput <= 59)) {
            let coeff = 1000 * 60 * 10;
            selectedDateObj = new Date(Math.round(
              (new Date(model.selected))
                .setUTCMinutes(newInput) / coeff) * coeff);
          }
          break;
      }
      if ((selectedDateObj > tl.data.start()) &&
        (selectedDateObj <= endDate)) {
        var parent = selected.parent();
        var sib = parent.next('div.input-wrapper.selectable')
          .find('input.button-input-group');
        if (parent.next('#input-time-divider').length) {
          sib = parent.next().next('div.input-wrapper.selectable')
            .find('input.button-input-group');
        }

        if (entered && sib.length < 1) {
          $('#focus-guard-2')
            .focus();
        }

        if (selectedDateObj) model.select(selectedDateObj);

        $('.button-input-group')
          .parent()
          .css('border-color', '');

        selected.parent()
          .removeClass('selected');

        if (entered) {
          sib.select()
            .addClass('selected');
        }
      } else {
        selected.parent()
          .css('border-color', '#ff0000');
        if (event.type !== 'focusout') {
          selected.select();
        } else {
          if (document.selection) {
            document.selection.empty();
          } else {
            window.getSelection()
              .removeAllRanges();
          }
          selected.parent()
            .animate({
              borderColor: 'rgba(40, 40, 40, .9)'
            }, {
              complete: function () {
                selected.parent()
                  .css('border-color', '');
              }
            });
          self.update();
        }
      }
    }
  };

  // TODO: Combine with self.update
  var updateDateInputs = function (date) {
    date = date || models.selected.date;
    $('#year-input-group')
      .val(date.getUTCFullYear());
    $('#month-input-group')
      .val(model.monthAbbr[date.getUTCMonth()]);
    $('#day-input-group')
      .val(util.pad(date.getUTCDate(), 2, '0'));
    $('#hour-input-group')
      .val(util.pad(date.getUTCHours(), 2, '0'));
    $('#minute-input-group')
      .val(util.pad(date.getUTCMinutes(), 2, '0'));
  };

  // TODO: Cleanup
  self.update = function (date) {
    var ms = date || new Date(model.selected);
    var nd = new Date(ms.setUTCDate(ms.getUTCDate() + 1));
    var pd = new Date(ms.setUTCDate(ms.getUTCDate() - 1));
    var endDate = models.layers.lastDate();

    // Update fields
    $('#year-input-group')
      .val(model.selected.getUTCFullYear());
    $('#month-input-group')
      .val(model.monthAbbr[model.selected.getUTCMonth()]);
    if (model.selected.getUTCDate() < 10) {
      $('#day-input-group')
        .val('0' + model.selected.getUTCDate());
    } else {
      $('#day-input-group')
        .val(model.selected.getUTCDate());
    }
    if (model.selected.getUTCHours() < 10) {
      $('#hour-input-group')
        .val('0' + model.selected.getUTCHours());
    } else {
      $('#hour-input-group')
        .val(model.selected.getUTCHours());
    }
    if (model.selected.getUTCMinutes() < 10) {
      $('#minute-input-group')
        .val('0' + model.selected.getUTCMinutes());
    } else {
      $('#minute-input-group')
        .val(model.selected.getUTCMinutes());
    }

    // Disable arrows if nothing before/after selection
    if ((model.selectedZoom === 4) && ms >= endDate) {
      $incrementBtn.addClass('button-disabled');
    } else if ((model.selectedZoom !== 4) && nd > endDate) {
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
};

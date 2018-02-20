import $ from 'jquery';
import util from '../util/util';
import lodashParseInt from 'lodash/parseInt';

/**
 * Implements the date input
 *
 * @class wv.date.timeline.input
 */
export function timelineInput(models, config, ui) {
  var tl = ui.timeline;
  var model = models.date;
  var timer;
  var self = {};
  var rollingDate;
  self.direction = 'forward';
  self.interval = 'day';
  self.delta = 1;
  self.active = false;
  self.delay = 500;

  var $incrementBtn = $('#right-arrow-group');
  var $decrementBtn = $('#left-arrow-group');

  var forwardNextMinute = function () { // FIXME: Limit animation correctly
    var nextMinute = new Date(new Date(model.selected)
      .setUTCMinutes(model.selected.getUTCMinutes() + 10));
    if (nextMinute <= util.now()) {
      animateForward('minute', 10);
    } else {
      self.stop();
    }
  };

  var forwardNextDay = function () { // FIXME: Limit animation correctly
    var nextDay = new Date(new Date(model.selected)
      .setUTCDate(model.selected.getUTCDate() + 1));
    if (nextDay <= util.today()) {
      animateForward('day', 1);
    } else {
      self.stop();
    }
  };

  var forwardNextMonth = function () {
    var nextMonth = new Date(new Date(model.selected)
      .setUTCMonth(model.selected.getUTCMonth() + 1));
    if (nextMonth <= util.today()) {
      animateForward('month', 1);
    } else {
      self.stop();
    }
  };

  var forwardNextYear = function () {
    var nextYear = new Date(new Date(model.selected)
      .setUTCFullYear(model.selected.getUTCFullYear() + 1));
    if (nextYear <= util.today()) {
      animateForward('year', 1);
    } else {
      self.stop();
    }
  };

  self.forward = function () {
    self.play('forward');
  };

  self.reverse = function () {
    self.play('reverse');
  };

  self.stop = function () {
    if (timer) {
      clearTimeout(timer);
    }
    timer = null;
    self.active = false;
  };

  var prepareFrame = function () {
    if (!self.active) {
      return;
    }
    var amount = (self.direction === 'forward')
      ? self.delta : -self.delta;
    var newDate = util.dateAdd(model.selected, self.interval, amount);
    timer = setTimeout(function () {
      advance(newDate);
    }, self.delay);
  };

  var advance = function (newDate) {
    var updated = model.select(newDate);
    if (!updated) {
      self.stop();
    } else {
      prepareFrame();
    }
  };

  self.play = function (direction) {
    if (self.active && direction !== self.direction) {
      self.stop();
    } else if (self.active) {
      return;
    }
    self.direction = direction || self.direction;
    self.active = true;
    prepareFrame();
  };

  var reversePrevMinute = function () {
    var prevMinute = new Date(new Date(model.selected)
      .setUTCMinutes(model.selected.getUTCMinutes() - 10));
    if (prevMinute >= tl.data.start()) {
      animateReverse('minute', -10);
    } else {
      self.stop();
    }
  };

  var reversePrevDay = function () { // FIXME: Limit animation correctly
    var prevDay = new Date(new Date(model.selected)
      .setUTCDate(model.selected.getUTCDate() - 1));
    if (prevDay >= tl.data.start()) {
      animateReverse('day', -1);
    } else {
      self.stop();
    }
  };

  var reversePrevMonth = function () {
    var prevMonth = new Date(new Date(model.selected)
      .setUTCMonth(model.selected.getUTCMonth() - 1));
    if (prevMonth >= tl.data.start()) {
      animateReverse('month', -1);
    } else {
      self.stop();
    }
  };

  var reversePrevYear = function () {
    var prevYear = new Date(new Date(model.selected)
      .setUTCFullYear(model.selected.getUTCFullYear() - 1));
    if (prevYear >= tl.data.start()) {
      animateReverse('year', -1);
    } else {
      self.stop();
    }
  };

  var animateForward = function (interval, amount) {
    if (self.active) {
      return;
    }
    models.date.add(interval, amount);
    self.interval = interval;
    self.play('forward');
  };

  var animateReverse = function (interval, amount) {
    if (self.active) {
      return;
    }
    models.date.add(interval, amount);
    self.interval = interval;
    self.play('reverse');
  };

  var roll = function (dataInterval, amt) {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
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
      var that = this;
      timer = setTimeout(function () {
        model.select(rollingDate);
        $(that)
          .parent()
          .find('input')
          .select();
        rollingDate = null;
        timer = null;
      }, 400);
    }
  };

  // TODO: Cleanup
  var validateInput = function (event) {
    var kc = event.keyCode || event.which;
    var entered = (kc === 13) || (kc === 9);
    if (event.type === 'focusout' || entered) {
      if (entered) {
        event.preventDefault();
      }

      var selected = $(this);
      var YMDInterval = selected.attr('id');
      var newInput = selected.val();
      var selectedDateObj = null;
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
            var validStr = false;
            var newIntInput;
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
          if ((newInput > 23) && (newInput < 0)) {
            selectedDateObj = new Date(
              (new Date(model.selected))
                .setUTCHours(newInput));
          }
          break;
        case 'minute-input-group':
          if ((newInput > 59) && (newInput < 0)) {
            selectedDateObj = new Date(
              (new Date(model.selected))
                .setUTCMinutes(newInput));
          }
          break;
      }
      if ((selectedDateObj > tl.data.start()) &&
        (selectedDateObj <= util.today())) {
        var sib = selected.parent()
          .next('div.input-wrapper')
          .find('input.button-input-group');

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
    if (nd > util.today()) {
      $incrementBtn.addClass('button-disabled');
    } else {
      $incrementBtn.removeClass('button-disabled');
    }
    if (pd.toUTCString() === tl.data.start()
      .toUTCString()) {
      $decrementBtn.addClass('button-disabled');
    } else {
      $decrementBtn.removeClass('button-disabled');
    }

    tl.pick.update();
  };

  var init = function () {
    $incrementBtn
      .mousedown(function (e) {
        e.preventDefault();
        switch (ui.timeline.config.currentZoom) {
          case 1:
            forwardNextYear();
            break;
          case 2:
            forwardNextMonth();
            break;
          case 3:
            forwardNextDay();
            break;
          case 4:
            forwardNextMinute();
            break;
          default:
            forwardNextDay();
        }
      })
      .mouseup(self.stop);

    $decrementBtn
      .mousedown(function (e) {
        e.preventDefault();
        switch (ui.timeline.config.currentZoom) {
          case 1:
            reversePrevYear();
            break;
          case 2:
            reversePrevMonth();
            break;
          case 3:
            reversePrevDay();
            break;
          case 4:
            reversePrevMinute();
            break;
          default:
            reversePrevDay();
        }
      })
      .mouseup(self.stop);

    $(document)
      .mouseout(self.stop)
      .keydown(function (event) {
        if (event.target.nodeName === 'INPUT') {
          return;
        }
        switch (event.keyCode) {
          case util.key.LEFT:
            animateReverse('day', -1);
            event.preventDefault();
            break;
          case util.key.RIGHT:
            animateForward('day', 1);
            event.preventDefault();
            break;
        }
      })
      .keyup(function (event) {
        switch (event.keyCode) {
          case util.key.LEFT:
          case util.key.RIGHT:
            self.stop();
            event.preventDefault();
            break;
        }
      });
    // bind click action to interval radio buttons
    var $buttons = $('.button-input-group');
    $buttons.unbind();

    // FIXME: Quick fix for fixing the propagation
    // of events with arrow keys and input field
    $buttons.keydown(function (event) {
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
        $('#day-input-group')
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

  init();
  return self;
};

import $ from 'jquery';
import 'mobiscroll';
import util from '../util/util';

var dateWheels = function(models, config) {
  var id = 'timewheels';
  var $container = $('#' + id);
  var MSEC_TO_MIN = 1000 * 60;
  var model = models.date;

  var self = {};
  self.enabled = false;

  var init = function () {
    render();
    model.events.on('select', update);
    model.events.on('update-timewheel', update);
    $(window)
      .on('resize', resize);
    update();
    updateRange();
    resize();
  };

  var dateWheel = function () {
    $('#wv-date-mobile-label').css('width', 100);
    $('#wv-date-mobile-label')
      .html(util.toISOStringDate(model.selected));
    $('#linkmode')
      .mobiscroll()
      .date({
        display: 'bottom',
        onChange: function (valueText) {
          var d = util.parseDateUTC(valueText);
          model.select(d);
        },
        onShow: function () {
          $('#wv-date-mobile-label')
            .css('display', 'none');
        },
        onClose: function () {
          $('#wv-date-mobile-label')
            .css('display', 'block');
        },
        dateFormat: 'yyyy-mm-dd',
        setText: 'OK'
      });
  };

  var dateTimeWheel = function () {
    $('#wv-date-mobile-label').css('width', 140);
    $('#wv-date-mobile-label')
      .html(util.toISOStringSeconds(model.selected).split('T').join(' T'));
    $('#linkmode')
      .mobiscroll()
      .datetime({
        display: 'bottom',
        onChange: function (valueText) {
          var d = util.parseDateUTC(valueText);
          model.select(d);
        },
        onShow: function () {
          $('#wv-date-mobile-label')
            .css('display', 'none');
        },
        onClose: function () {
          $('#wv-date-mobile-label')
            .css('display', 'block');
        },
        stepMinute: 10,
        dateFormat: 'yyyy-mm-dd',
        setText: 'OK',
        timeFormat: 'T' + 'HH:ii:ss' + 'Z',
        timeWheels: '|HH:ii|'
      });
  };

  var setTimeWheel = function () {
    if (models.date.maxZoom === 4) {
      dateTimeWheel();
    } else {
      dateWheel();
    }
    updateRange();
  };

  var render = function () {
    models.layers.events.trigger('toggle-subdaily');
    $container
      .addClass('datespan')
      .html('<div id=\'wv-date-mobile-label\'></div><input type=\'hidden\' id=\'linkmode\' readonly>');
    setTimeWheel();
    $('#linkmode')
      .mobiscroll('setDate', UTCToLocal(model.selected), true);
    $('#wv-date-mobile-label')
      .click(function (e) {
        $('#linkmode')
          .mobiscroll('show');
      });
  };

  var UTCToLocal = function (d) {
    var timezoneOffset = d.getTimezoneOffset() * MSEC_TO_MIN;
    return new Date(d.getTime() + timezoneOffset);
  };

  var resize = function () {
    if (!self.enabled && util.browser.small) {
      self.enabled = true;
      $container.show();
    } else if (self.enabled && !util.browser.small) {
      self.enabled = false;
      $container.hide();
    }
  };

  var updateRange = function () {
    var startDate = util.parseDateUTC(config.startDate);
    var endDate = models.layers.lastDate();
    $('#linkmode')
      .mobiscroll('option', 'disabled', false);
    $('#linkmode')
      .mobiscroll('option', 'minDate', UTCToLocal(startDate));
    $('#linkmode')
      .mobiscroll('option', 'maxDate', UTCToLocal(endDate));
  };

  var update = function () {
    setTimeWheel();
    $('#linkmode')
      .mobiscroll('setDate', UTCToLocal(model.selected), true);
  };

  init();
  return self;
};

export default dateWheels;

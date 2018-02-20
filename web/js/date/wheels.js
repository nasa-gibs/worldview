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
    $(window)
      .on('resize', resize);
    updateRange();
    update();
    resize();
  };

  var render = function () {
    $container
      .addClass('datespan')
      .html('<div id=\'wv-date-mobile-label\'></div><input type=\'hidden\' id=\'linkmode\' readonly>');
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
    var endDate = util.today();
    $('#linkmode')
      .mobiscroll('option', 'disabled', false);
    $('#linkmode')
      .mobiscroll('option', 'minDate', UTCToLocal(startDate));
    $('#linkmode')
      .mobiscroll('option', 'maxDate', UTCToLocal(endDate));
  };

  var update = function () {
    $('#wv-date-mobile-label')
      .html(util.toISOStringDate(model.selected));
    $('#linkmode')
      .mobiscroll('setDate', UTCToLocal(model.selected), true);
  };

  init();
  return self;
};

export default dateWheels;

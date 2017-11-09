import $ from 'jquery';
import util from '../util/util';
import mobiscroll from 'mobiscroll-jquery';

export function dateWheels(models, config) {
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
    console.log(mobiscroll);
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

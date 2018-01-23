import $ from 'jquery';
import util from '../util/util';

/**
 * Undocumented.
 *
 * @class wv.date.label
 */
export function dateLabel(models) {
  var id = 'timedsdateHolder';
  var $container = $('#' + id);
  var model = models.date;

  var self = {};

  var init = function () {
    model.events.on('select', update);
    update();
  };

  var update = function () {
    $container.html(util.toISOStringDate(model.selected));
  };

  init();
  return self;
};

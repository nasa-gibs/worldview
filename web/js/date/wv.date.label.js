/**
 * @module wv.date
 */
var wv = wv || {};
wv.date = wv.date || {};

/**
 * Undocumented.
 *
 * @class wv.date.label
 */
wv.date.label = wv.date.label || function (models) {
  var id = 'timedsdateHolder';
  var $container = $('#' + id);
  var model = models.date;

  var self = {};

  var init = function () {
    model.events.on('select', update);
    update();
  };

  var update = function () {
    $container.html(wv.util.toISOStringDate(model.selected));
  };

  init();
  return self;
};

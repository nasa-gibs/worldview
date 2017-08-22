/**
 * @module wv.naturalEvents
 */
var wv = wv || {};
wv.naturalEvents = wv.naturalEvents || {};

/**
 * @class wv.naturalEvents.model
 */
wv.naturalEvents.model = wv.naturalEvents.model || function(models, config) {

  var self = {};
  self.selected = null;
  self.active = false;
  self.layers = config.naturalEvents.layers;

  /**
   * Handler for events fired by this class.
   *
   * @attribute events {Events}
   * @readOnly
   * @type Events
   */
  self.events = wv.util.events();

  self.save = function(state) {
    if (self.active) {
      var id = wvx.ui.naturalEvents.selected.id;
      var date = wvx.ui.naturalEvents.selected.date;
      var value = id?date?[id, date].join(','):id:true;
      state.e = value;
    }
  };

  self.load = function(state) {
    if (!state.e) return;
    var values = state.e.split(',');
    var id = values[0];
    var date = values[1];
    if (values) {
      models.wv.events.on('startup', function() {
        wvx.ui.sidebar.selectTab('events');
      });
      self.events.on('hasData', function() {
        wvx.ui.naturalEvents.select(id, date);
      });
    }
  };

  return self;
};

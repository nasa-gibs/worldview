import util from '../util/util';

export default function naturalEventsModel(models, config, ui) {
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
  self.events = util.events();

  self.events.on('selected-event', function(selected) {
    var id = selected.id;
    var date = selected.date;
    self.selected = id ? (date ? [id, date].join(',') : id) : 'true';
  });
  self.save = function(state) {
    if (self.active) {
      state.e = self.selected;
    }
  };

  self.load = function(state) {
    if (!state.e) return self;
    models.wv.events.on('startup', function() {
      self.events.trigger('activate');
    });
    var values = state.e.split(',');
    var id = values[0] || '';
    var date = values[1] || '';
    id = id.match(/^EONET_[0-9]+/i) ? values[0] : null;
    date = date.match(/\d{4}-\d{2}-\d{2}/) ? values[1] : null;
    if (id) {
      self.events.on('hasData', function() {
        self.events.trigger('select-init-event', id, date, null, true);
      });
    }
    self.loaded = true;
    return self;
  };

  return self;
}

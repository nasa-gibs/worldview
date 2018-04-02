import util from '../util/util';

export function projectionChange(models) {
  var self = {};

  self.events = util.events();
  self.crs = null;
  self.epsg = null;

  var init = function () {
    models.proj.register('EPSG:3995',
      '+title=WGS 84 / Arctic Polar Stereographic +proj=stere ' +
      'lat_0=90 +lat_ts=71 +lon_0=0 +k=1 +x_0=0 +y_0=0 ' +
      '+datum=WGS84 +units=m +no_def');
    models.proj.events.on('select', onChange);
    models.date.events.on('select', onChange);
    update();
  };

  var update = function () {
    var proj = models.proj.selected;

    if (proj.id === 'arctic' || proj.id === 'antarctic') {
    }
    self.crs = proj.crs;
    self.epsg = proj.epsg;
  };

  var onChange = function () {
    update();
    self.events.trigger('select', self);
  };

  init();
  return self;
};

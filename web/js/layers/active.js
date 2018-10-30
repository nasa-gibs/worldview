import lodashEach from 'lodash/each';

export function layersActive(models, ui, config) {
  var model = models.layers;
  var self = {};
  self.id = 'products';
  self.selector = '#products';

  var init = function() {
    model.events
      .on('add', toggleSubdaily)
      .on('remove', toggleSubdaily)
      .on('update', toggleSubdaily)
      .on('toggle-subdaily', toggleSubdaily)
      .on('set-zoom', toggleSubdaily);
    models.proj.events.on('select', toggleSubdaily);
  };
  var subdailyCheck = function() {
    var activeLayers = model[model.activeLayers];
    var currentProjection = models.proj.selected.id;
    var check;

    if (model.maxZoom >= 4 || config.parameters.showSubdaily) {
      check = true;
    } else {
      lodashEach(activeLayers, function(activeLayer) {
        if (
          Object.keys(activeLayer.projections).some(function(k) {
            return ~k.indexOf(currentProjection);
          })
        ) {
          if (
            activeLayer.period === 'subdaily' &&
            activeLayer.projections[currentProjection]
          ) {
            check = true;
          }
        }
      });
    }
    return check;
  };
  var setMaxZoomlevel = function(zoomLevel) {
    if (zoomLevel !== models.date.maxZoom) {
      models.date.maxZoom = zoomLevel;
      model.events.trigger('subdaily-updated');
    }
  };
  var toggleSubdaily = function() {
    if (subdailyCheck()) {
      setMaxZoomlevel(4);
    } else {
      setMaxZoomlevel(3);
    }
    if (ui.timeline) ui.timeline.resize();
  };

  init();
  return self;
}

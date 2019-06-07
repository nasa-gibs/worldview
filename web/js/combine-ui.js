import util from './util/util';
import { mapui } from './map/ui';
import { mapAnimate } from './map/animate';
import { dataUi } from './map/data/ui';
import naturalEventsUI from './map/natural-events/ui';

/**
 *  Legacy UI Rendering
 * @param {Object} models | Legacy Models Object
 * @param {Object} config
 * @param {Object} MapMouseEvents | Map events object that is registered here and used in react to render coords
 */
export function combineUi(models, config, MapMouseEvents, store) {
  let ui = {};
  ui.map = mapui(models, config, store, ui);
  ui.map.animate = mapAnimate(config, ui, store);
  if (config.features.tour) {
    // ui.alert = alertUi(ui, config);
    // ui.tour = tourUi(models, ui, config);
  }
  // ui.activeLayers = layersActive(models, ui, config);
  // ui.addModal = layersModal(models, ui, config);
  // ui.layerSettingsModal = layersOptions(models, ui, config);
  // Test via a getter in the options object to see if the passive property is accessed
  ui.supportsPassive = false;
  try {
    var opts = Object.defineProperty({}, 'passive', {
      get: function() {
        ui.supportsPassive = true;
      }
    });
    window.addEventListener('testPassive', null, opts);
    window.removeEventListener('testPassive', null, opts);
  } catch (e) {
    util.warn(e);
  }

  // ui.dateLabel = dateLabel(models);

  if (config.startDate) {
    if (!util.browser.small) {
      // If mobile device, do not build timeline
      // timelineInit();
    }
    // ui.dateWheels = dateWheels(models, config);
  }
  if (config.features.dataDownload) {
    ui.data = dataUi(store, ui, config);
  }
  if (config.features.naturalEvents) {
    ui.naturalEvents = naturalEventsUI(ui, config, store, models);
  }
  registerMapMouseHandlers(ui.map.proj, MapMouseEvents);
  // Sink all focus on inputs if click unhandled
  $(document).click(function(event) {
    if (event.target.nodeName !== 'INPUT') {
      $('input').blur();
    }
  });
  document.activeElement.blur();
  $('input').blur();

  return ui;
}
function registerMapMouseHandlers(maps, events) {
  Object.values(maps).forEach(map => {
    let element = map.getTargetElement();
    let crs = map
      .getView()
      .getProjection()
      .getCode();
    element.addEventListener('mousemove', event => {
      events.trigger('mousemove', event, map, crs);
    });
    element.addEventListener('mouseout', event => {
      events.trigger('mouseout', event, map, crs);
    });
  });
}

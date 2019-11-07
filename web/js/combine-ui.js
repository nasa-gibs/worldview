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
  const ui = {};
  ui.events = util.events();
  const subscribeToStore = function () {
    const state = store.getState();
    const action = state.lastAction;
    return ui.events.trigger('last-action', action);
  };
  store.subscribe(subscribeToStore);
  ui.map = mapui(models, config, store, ui);
  ui.map.animate = mapAnimate(config, ui, store);
  ui.supportsPassive = false;
  try {
    var opts = Object.defineProperty({}, 'passive', {
      get: function () {
        ui.supportsPassive = true;
      }
    });
    window.addEventListener('testPassive', null, opts);
    window.removeEventListener('testPassive', null, opts);
  } catch (e) {
    util.warn(e);
  }
  if (config.features.dataDownload) {
    ui.data = dataUi(store, ui, config);
  }
  if (config.features.naturalEvents) {
    ui.naturalEvents = naturalEventsUI(ui, config, store, models);
  }
  registerMapMouseHandlers(ui.map.proj, MapMouseEvents);
  // Sink all focus on inputs if click unhandled
  $(document).click(function (event) {
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
    const element = map.getTargetElement();
    const crs = map
      .getView()
      .getProjection()
      .getCode();
    element.addEventListener('mousemove', event => {
      events.trigger('mousemove', event, map, crs);
    });
    element.addEventListener('mouseout', event => {
      events.trigger('mouseout', event, map, crs);
    });
    map.on('singleclick', event => {
      events.trigger('singleclick', event, map, crs);
    });
    element.addEventListener('click', event => {
      events.trigger('click', event, map, crs);
    });
  });
}

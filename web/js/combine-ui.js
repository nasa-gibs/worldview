import util from './util/util';
import mapui from './map/ui';
import mapAnimate from './map/animate';
import dataUi from './map/data/ui';
import naturalEventsUI from './map/natural-events/ui';

const { events } = util;

/**
 *  Legacy UI Rendering
 * @param {Object} models | Legacy Models Object
 * @param {Object} config
 * @param {Object} store
 */
export default function combineUi(models, config, store) {
  const ui = {};
  const subscribeToStore = function() {
    const state = store.getState();
    const action = state.lastAction;
    return events.trigger('redux:action-dispatched', action);
  };
  store.subscribe(subscribeToStore);
  ui.map = mapui(models, config, store, ui);
  ui.map.animate = mapAnimate(config, ui, store);
  ui.supportsPassive = false;
  try {
    const opts = Object.defineProperty({}, 'passive', {
      // eslint-disable-next-line getter-return
      get() {
        ui.supportsPassive = true;
      },
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
  registerMapMouseHandlers(ui.map.proj);
  // Sink all focus on inputs if click unhandled
  $(document).click((event) => {
    if (event.target.nodeName !== 'INPUT') {
      $('input').blur();
    }
  });
  document.activeElement.blur();
  $('input').blur();

  return ui;
}

function registerMapMouseHandlers(maps) {
  Object.values(maps).forEach((map) => {
    const element = map.getTargetElement();
    const crs = map
      .getView()
      .getProjection()
      .getCode();
    element.addEventListener('mousemove', (event) => {
      events.trigger('map:mousemove', event, map, crs);
    });
    element.addEventListener('mouseout', (event) => {
      events.trigger('map:mouseout', event, map, crs);
    });
    map.on('singleclick', (event) => {
      events.trigger('map:singleclick', event, map, crs);
    });
    map.on('contextmenu', (event) => {
      events.trigger('contextmenu', event, map, crs);
    });
    element.addEventListener('click', (event) => {
      events.trigger('map:click', event, map, crs);
    });
  });
}

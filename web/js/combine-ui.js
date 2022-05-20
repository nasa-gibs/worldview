import util from './util/util';
import mapui from './map/ui';

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

  registerMapMouseHandlers(ui.map.proj);

  // Sink all focus on inputs if click unhandled
  document.addEventListener('click', (e) => {
    if (e.target.nodeName !== 'INPUT') {
      document.querySelectorAll('input').forEach((el) => el.blur());
    }
  });
  document.activeElement.blur();
  document.querySelectorAll('input').forEach((el) => el.blur());

  return ui;
}

function registerMapMouseHandlers(maps) {
  Object.values(maps).forEach((map) => {
    const element = map.getTargetElement();
    const crs = map.getView().getProjection().getCode();

    element.addEventListener('mouseleave', (event) => {
      events.trigger('map:mouseout', event);
    });
    map.on('moveend', (event) => {
      events.trigger('map:moveend', event, map, crs);
    });
    map.on('pointermove', (event) => {
      events.trigger('map:mousemove', event, map, crs);
    });
    map.on('singleclick', (event) => {
      events.trigger('map:singleclick', event, map, crs);
    });
    map.on('contextmenu', (event) => {
      events.trigger('map:contextmenu', event, map, crs);
    });
  });
}

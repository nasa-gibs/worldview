import Swipe from './swipe';
import Opacity from './opacity';
import Spy from './spy';
import util from '../../util/util';
import { setValue } from '../../modules/compare/actions';

const TOUCH_EVENT = {
  type: 'touch',
  start: 'touchstart',
  move: 'touchmove',
  end: 'touchend',
};
const MOUSE_EVENT = {
  type: 'default',
  start: 'mousedown',
  move: 'mousemove',
  end: 'mouseup',
};
export default function mapCompare(config, store) {
  const self = {};
  let comparison = null;
  let mode = 'swipe';
  let proj = '';
  self.events = util.events();
  self.swipe = Swipe;
  self.opacity = Opacity;
  self.spy = Spy;
  self.active = false;
  self.dragging = false;
  self.value = 50;

  self.EventTypeObject = util.browser.mobileAndTabletDevice
    ? TOUCH_EVENT
    : MOUSE_EVENT;

  const init = function () {
    self.events
      .on('movestart', () => {
        self.dragging = true;
      })
      .on('moveend', (value) => {
        self.dragging = false;
        store.dispatch(setValue(value));
      });
  };
  self.update = function (group) {
    const state = store.getState();
    if (comparison) {
      comparison.update(state.compare.isCompareA, group);
    }
  };
  /**
   * Create, update, or replace a Compare instance with a given compare-type
   * @param {Object} map | OpenLayers Map object
   * @param {String} compareMode | Active compare mode
   */
  self.create = function (map, compareMode) {
    const state = store.getState();

    if (compareMode === mode && comparison && proj === state.proj.selected && self.value === state.compare.value) {
      comparison.update(state.compare.isCompareA);
    } else if (comparison) {
      mode = compareMode;
      self.destroy();
      comparison = new self[compareMode](
        map,
        state.compare.isCompareA,
        self.events,
        self.EventTypeObject,
        state.compare.value || null,
      ); // e.g. new self.swipe()
    } else {
      mode = compareMode;
      comparison = new self[compareMode](
        map,
        state.compare.isCompareA,
        self.events,
        self.EventTypeObject,
        state.compare.value || null,
      ); // e.g. new self.swipe()
    }
    self.active = true;
    self.value = state.compare.value || 50;
    proj = state.proj.selected;
  };
  /**
   * Return offset value (for running-data use)
   */
  self.getOffset = function () {
    if (mode === 'swipe' && comparison) {
      return comparison.getSwipeOffset();
    }
    return null;
  };
  /**
   * Destroy instance in full and nullify vars
   */
  self.destroy = function () {
    comparison.destroy();
    store.dispatch(setValue(50)); // set Value to default
    comparison = null;
    self.active = false;
  };
  init();
  return self;
}

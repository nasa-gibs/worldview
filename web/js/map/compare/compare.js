import Swipe from './swipe';
import Opacity from './opacity';
import Spy from './spy';
import util from '../../util/util';
import { setValue } from '../../modules/compare/actions';
import { COMPARE_MOVE_START, COMPARE_MOVE_END } from '../../util/constants';

const { events } = util;

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
export default function mapCompare(store) {
  const self = {};
  let comparison = null;
  let mode = 'swipe';
  let selectedProj = '';

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
    events.on(COMPARE_MOVE_START, () => {
      self.dragging = true;
    });
    events.on(COMPARE_MOVE_END, (value) => {
      self.dragging = false;
      self.value = value;
      store.dispatch(setValue(value));
    });
  };

  self.update = function (group) {
    if (comparison) {
      comparison.update(store, group);
    }
  };

  /**
   * Create, update, or replace a Compare instance with a given compare-type
   * @param {Object} map | OpenLayers Map object
   * @param {String} compareMode | Active compare mode
   */
  self.create = function (map, compareMode) {
    const state = store.getState();
    const { proj, compare } = state;

    if (compareMode === mode && comparison
        && selectedProj === proj.selected
        && self.value === compare.value) {
      comparison.update(store);
    } else if (comparison) {
      mode = compareMode;
      self.destroy();
      comparison = new self[compareMode](
        map,
        store,
        self.EventTypeObject,
        compare.value || null,
      ); // e.g. new self.swipe()
    } else {
      mode = compareMode;
      comparison = new self[compareMode](
        map,
        store,
        self.EventTypeObject,
        compare.value || null,
      ); // e.g. new self.swipe()
    }
    self.value = state.compare.value || 50;
    self.active = true;
    selectedProj = proj.selected;
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
    self.value = 50;
    store.dispatch(setValue(50)); // set Value to default
    comparison = null;
    self.active = false;
  };
  init();
  return self;
}

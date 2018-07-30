import { Swipe } from './swipe';
import { Opacity } from './opacity';
import { Spy } from './spy';
import util from '../../util/util';
export function mapCompare(models, config) {
  var self = {};
  var comparison = null;
  var mode = 'swipe';
  var proj = '';
  self.events = util.events();
  self.swipe = Swipe;
  self.opacity = Opacity;
  self.spy = Spy;
  self.active = false;
  self.dragging = false;
  var init = function() {
    self.events
      .on('mousedown', () => {
        self.dragging = true;
      })
      .on('mouseup', () => {
        self.dragging = false;
      });
  };
  self.create = function(map, compareMode) {
    if (compareMode === mode && comparison && proj === models.proj.selected) {
      comparison.update(models.compare.isCompareA);
    } else if (comparison) {
      mode = compareMode;
      self.destroy();
      comparison = new self[compareMode](
        map,
        models.compare.isCompareA,
        self.events
      ); // e.g. new self.swipe()
    } else {
      mode = compareMode;
      comparison = new self[compareMode](
        map,
        models.compare.isCompareA,
        self.events
      ); // e.g. new self.swipe()
    }
    self.active = true;
    proj = models.proj.selected;
  };
  self.getOffset = function() {
    if (mode === 'swipe') {
      return comparison.getSwipeOffset();
    } else {
      return null;
    }
  };
  self.destroy = function() {
    comparison.destroy();
    comparison = null;
    self.active = false;
  };
  init();
  return self;
}

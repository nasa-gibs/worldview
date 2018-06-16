import { Swipe } from './swipe';
import { Opacity } from './opacity';
import { Spy } from './spy';
export function mapCompare(models, config) {
  var self = {};
  var comparison = null;
  var mode = 'swipe';
  var proj = '';
  self.swipe = Swipe;
  self.opacity = Opacity;
  self.spy = Spy;
  self.active = false;

  self.create = function(map, compareMode) {
    if (compareMode === mode && comparison && proj === models.proj.selected) {
      comparison.update();
    } else if (comparison) {
      mode = compareMode;
      self.destroy();
      comparison = new self[compareMode](map); // e.g. new self.swipe()
    } else {
      mode = compareMode;
      comparison = new self[compareMode](map); // e.g. new self.swipe()
    }
    self.active = true;
    proj = models.proj.selected;
  };
  self.destroy = function() {
    comparison.destroy();
    comparison = null;
    self.active = false;
  };
  return self;
}

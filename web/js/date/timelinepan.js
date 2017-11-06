
/**
 * Perform timeline panning functions
 */
export function timelinePan(models, config, ui) {
  var tl = ui.timeline;
  var model = models.date;
  var self = {};

  self.xPosition = tl.axisZoom.translate()[0];

  self.axis = function (event) {
    if (event) {
      var evt = event.sourceEvent || event;
      var delX = evt.deltaX;
      if ((evt.type === 'wheel') && ((delX <= 0) || (delX > 0))) { // when user is panning
        update(self.xPosition - delX, 0);
      }
    } else {
      self.xPosition = tl.axisZoom.translate()[0];
    }

    tl.axis.call(tl.xAxis);

    tl.ticks.check();

    tl.ticks.boundary.update();
    tl.ticks.normal.update();

    tl.pick.update();
    tl.pick.checkLocation();
    model.events.trigger('timeline-change');

    tl.data.set();
  };

  var update = function (x, y) {
    tl.axisZoom.translate([x, y]);
    self.xPosition = tl.axisZoom.translate()[0];
  };

  self.toSelection = function () {
    var x = -tl.x(model.selected) +
      (tl.width - tl.margin.left - tl.margin.right) / 2;

    update(x, 0);

    tl.data.set();
  };

  self.toCursor = function (mousePos, mouseOffset) {
    var x = -tl.x(mousePos) +
      (tl.width - tl.margin.left - tl.margin.right) / 2 - mouseOffset;

    update(x, 0);

    tl.data.set();
  };

  var init = function () {

  };

  init();
  return self;
};

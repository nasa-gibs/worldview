buster.testCase('wv.ui.mouse.click', (function () {
  var self = {};
  var element, down, up;

  self.setUp = function () {
    element = {
      mousedown: function (handler) {
        down = handler;
      },
      mouseup: function (handler) {
        up = handler;
      }
    };
  };

  self['Within click limit'] = function () {
    var callback = this.stub();
    wv.ui.mouse.click(element, callback);
    down({
      clientX: 0,
      clientY: 0
    });
    up({
      clientX: 2,
      clientY: 2
    });
    buster.assert.called(callback);
  };

  self['Outside click limit'] = function () {
    var callback = this.stub();
    wv.ui.mouse.click(element, callback);
    down({
      clientX: 0,
      clientY: 0
    });
    up({
      clientX: 12,
      clientY: 12
    });
    buster.refute.called(callback);
  };

  return self;
}()));

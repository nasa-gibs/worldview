buster.testCase('wv.ui.indicator', (function () {
  var self = {};
  self.setUp = function () {
    wv.ui.indicator.active = [];
  };

  self['Delayed indicator shown'] = function (done) {
    this.stub(wv.ui.indicator, '_show');
    this.stub(wv.ui.indicator, 'hide');
    var promise = $.Deferred();
    wv.ui.indicator.delayed(promise, 10);
    setTimeout(function () {
      promise.resolve();
      buster.assert.called(wv.ui.indicator._show);
      buster.assert.called(wv.ui.indicator.hide);
      done();
    }, 50);
  };

  self['Delayed indicator not shown'] = function (done) {
    this.stub(wv.ui.indicator, '_show');
    this.stub(wv.ui.indicator, 'hide');
    var promise = $.Deferred();
    wv.ui.indicator.delayed(promise, 1000);
    setTimeout(function () {
      promise.resolve();
      buster.refute.called(wv.ui.indicator._show);
      buster.refute.called(wv.ui.indicator.hide);
      done();
    }, 20);
  };

  self['Pop message'] = function () {
    this.stub(wv.ui.indicator, '_show');
    this.stub(wv.ui.indicator, '_hide');

    wv.ui.indicator.show('Bottom');
    var id = wv.ui.indicator.show('Top');
    wv.ui.indicator.hide(id);
    buster.assert.equals(1, wv.ui.indicator.active.length);
    buster.assert.equals('Bottom', wv.ui.indicator.active[0].message);
  };

  self['Remove bottom message'] = function () {
    this.stub(wv.ui.indicator, '_show');
    this.stub(wv.ui.indicator, '_hide');

    var id = wv.ui.indicator.show('Bottom');
    wv.ui.indicator.show('Top');
    wv.ui.indicator.hide(id);
    buster.assert.equals(1, wv.ui.indicator.active.length);
    buster.assert.equals('Top', wv.ui.indicator.active[0].message);
  };

  self['Hide group'] = function () {
    this.stub(wv.ui.indicator, '_show');
    this.stub(wv.ui.indicator, '_hide');
    var indicators = {
      two: null,
      three: null
    };
    wv.ui.indicator.show('One');
    indicators.two = wv.ui.indicator.show('Two');
    indicators.three = wv.ui.indicator.show('Three');
    wv.ui.indicator.hide(indicators);
    buster.assert.equals(1, wv.ui.indicator.active.length);
    buster.assert.equals('One', wv.ui.indicator.active[0].message);
  };

  return self;
}()));

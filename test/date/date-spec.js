buster.testCase('wv.date', (function () {
  var self = {};
  var config, models, errors;

  self.setUp = function () {
    config = fixtures.config();
    models = fixtures.models(config);
    errors = [];
  };

  self.tearDown = function () {
    wv.util.resetNow();
  };

  self['1.1: Parses valid date'] = function () {
    var d = new Date(Date.UTC(2013, 0, 5));
    var state = {
      time: '2013-01-05'
    };
    wv.date.parse(state, errors);
    buster.assert.equals(state.t, d);
    buster.assert.equals(errors.length, 0);
  };

  self['1.2: Parses valid date'] = function () {
    var d = new Date(Date.UTC(2013, 0, 5));
    var state = {
      t: '2013-01-05'
    };
    wv.date.parse(state, errors);
    buster.assert.equals(state.t, d);
    buster.assert.equals(errors.length, 0);
  };

  self['Error added if date is invalid'] = function () {
    var state = {
      time: 'X'
    };
    wv.date.parse(state, errors);
    buster.assert.equals(errors.length, 1);
    buster.refute(state.time);
  };

  self['Overrides now'] = function () {
    var d = new Date(Date.UTC(2013, 0, 5));
    var state = {
      now: '2013-01-05'
    };
    wv.date.parse(state, errors);
    buster.assert.equals(wv.util.now(), d);
    buster.assert.equals(errors.length, 0);
  };

  self['Error added if now is invalid'] = function () {
    var state = {
      now: 'X'
    };
    var errors = [];
    wv.date.parse(state, errors);
    buster.assert.equals(errors.length, 1);
    buster.refute(state.now);
  };

  return self;
}()));

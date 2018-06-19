buster.testCase('wv.date.model', (function () {
  var self = {};
  var config, models, now;

  self.setUp = function () {
    now = new Date(Date.UTC(2013, 0, 15));
    this.stub(wv.util, 'now')
      .returns(now);
    config = fixtures.config();
    models = fixtures.models(config);
  };

  self['Initializes to today'] = function () {
    buster.assert.equals(models.date.selected.getUTCFullYear(), 2013);
    buster.assert.equals(models.date.selected.getUTCMonth(), 0);
    buster.assert.equals(models.date.selected.getUTCDate(), 15);
    buster.assert.equals(models.date.selected.getUTCHours(), 0);
    buster.assert.equals(models.date.selected.getUTCMinutes(), 0);
    buster.assert.equals(models.date.selected.getUTCSeconds(), 0);
  };

  self['Initializes with a specified date'] = function () {
    var initial = new Date(Date.UTC(2013, 0, 5));
    var date = wv.date.model(models, config, {
      initial: initial
    });
    buster.assert.equals(date.selected, initial);
  };

  self['Select new date'] = function () {
    var d = new Date(Date.UTC(2013, 0, 5));
    var listener = this.stub();
    models.date.events.on('select', listener);
    models.date.select(d);
    buster.assert.equals(models.date.selected, d);
    buster.assert.calledWith(listener, d);
  };

  self['Saves state'] = function () {
    var d = new Date(Date.UTC(2013, 0, 5));
    models.date.select(d);
    var state = {};
    models.date.save(state);
    buster.assert.equals(state.t, '2013-01-05-T00:00:00Z');
  };

  self['Loads state'] = function () {
    var date = new Date(Date.UTC(2013, 0, 5));
    var state = {
      t: date
    };
    models.date.load(state);
    buster.assert.equals(models.date.selected, date);
  };

  self['Nothing selected when missing in state'] = function () {
    models.date.load({});
    buster.assert.equals(models.date.selected, now);
  };

  self['Date and time is unchanged when selecting'] = function () {
    var date = new Date(Date.UTC(2012, 1, 2, 3, 4, 5));
    models.date.select(date);
    var selected = models.date.selected;
    buster.assert.equals(selected.getUTCFullYear(), 2012);
    buster.assert.equals(selected.getUTCMonth(), 1);
    buster.assert.equals(selected.getUTCDate(), 2);
    buster.assert.equals(selected.getUTCHours(), 3);
    buster.assert.equals(selected.getUTCMinutes(), 4);
    buster.assert.equals(selected.getUTCSeconds(), 5);
  };

  return self;
}()));

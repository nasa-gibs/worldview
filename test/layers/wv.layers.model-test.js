buster.testCase('wv.layers.model', (function () {
  var self = {};
  var config, models, errors, listener, changeListener;
  var today;
  var l;

  self.setUp = function () {
    today = new Date(Date.UTC(2014, 0, 1));
    this.stub(wv.util, 'now')
      .returns(today);
    config = fixtures.config();
    models = fixtures.models(config);
    l = models.layers;
    errors = [];
    listener = this.stub();
    changeListener = this.stub();
  };

  var stack = function () {
    l.add('terra-cr');
    l.add('aqua-cr');
    l.add('terra-aod');
    l.add('aqua-aod');
  };

  self['Adds base layer'] = function () {
    stack();
    l.events.on('add', listener);
    l.events.on('change', changeListener);
    l.add('mask');
    buster.assert.equals(_.pluck(l.get(), 'id'), ['mask', 'aqua-cr', 'terra-cr', 'aqua-aod', 'terra-aod']);
    buster.assert.calledWith(listener, config.layers.mask);
    buster.assert.called(changeListener);
  };

  self['Adds overlay'] = function () {
    stack();
    l.events.on('add', listener);
    l.events.on('change', changeListener);
    l.add('combo-aod');
    buster.assert.equals(_.pluck(l.get(), 'id'), ['aqua-cr', 'terra-cr', 'combo-aod', 'aqua-aod', 'terra-aod']);
    buster.assert.calledWith(listener, config.layers['combo-aod']);
    buster.assert.called(changeListener);
  };

  self['Doesn\'t add duplicate layer'] = function () {
    stack();
    l.events.on('add', listener);
    l.events.on('change', changeListener);
    l.add('terra-cr');
    buster.assert.equals(_.pluck(l.get(), 'id'), ['aqua-cr', 'terra-cr', 'aqua-aod', 'terra-aod']);
    buster.refute.called(listener);
    buster.refute.called(changeListener);
  };

  self['Removes base layer'] = function () {
    stack();
    l.events.on('remove', listener);
    l.events.on('change', changeListener);
    l.remove('terra-cr');
    buster.assert.equals(_.pluck(l.get(), 'id'), ['aqua-cr', 'aqua-aod', 'terra-aod']);
    buster.assert.calledWith(listener, config.layers['terra-cr']);
    buster.assert.called(changeListener);
  };

  self['Does nothing on removing a non-existant layer'] = function () {
    stack();
    l.events.on('remove', listener);
    l.events.on('change', changeListener);
    l.remove('mask');
    buster.assert.equals(_.pluck(l.get(), 'id'), ['aqua-cr', 'terra-cr', 'aqua-aod', 'terra-aod']);
    buster.refute.called(listener);
    buster.refute.called(changeListener);
  };

  self['Clears all layers'] = function () {
    stack();
    l.events.on('remove', listener);
    l.events.on('change', changeListener);
    l.clear();
    buster.assert.equals(_.pluck(l.get(), 'id'), []);
    buster.assert.called(listener);
    buster.assert.called(changeListener);
  };

  self['Clears layers for projection'] = function () {
    stack();
    models.proj.select('arctic');
    l.clear();
    models.proj.select('geographic');
    buster.assert.equals(_.pluck(l.get(), 'id'), ['aqua-aod', 'terra-aod']);
  };

  self['Resets to default layers'] = function () {
    config.defaults.startingLayers = [
      {
        id: 'terra-cr'
      },
      {
        id: 'terra-aod'
      }
    ];
    models = fixtures.models(config);
    stack();
    l.reset();
    buster.assert.equals(_.pluck(l.get(), 'id'), ['terra-cr', 'terra-aod']);
  };

  self['No date range for static products'] = function () {
    l.add('mask');
    buster.refute(l.dateRange());
  };

  self['Date range for ongoing layers'] = function () {
    stack();
    var range = l.dateRange();
    buster.assert.equals(range.start, new Date(Date.UTC(2000, 0, 1)));
    buster.assert.equals(range.start, new Date(Date.UTC(2000, 0, 1)));
  };

  self['Date range for ended layers'] = function () {
    config.layers.end1 = {
      id: 'end1',
      group: 'overlays',
      projections: {
        geographic: {}
      },
      startDate: '1990-01-01',
      endDate: '2005-01-01',
      inactive: true
    };
    config.layers.end2 = {
      id: 'end1',
      group: 'overlays',
      projections: {
        geographic: {}
      },
      startDate: '1992-01-01',
      endDate: '2007-01-01',
      inactive: true
    };
    l.add('end1');
    l.add('end2');
    var range = l.dateRange();
    buster.assert.equals(range.start, new Date(Date.UTC(1990, 0, 1)));
    buster.assert.equals(range.end, new Date(Date.UTC(2007, 0, 1)));
  };

  self['Gets layers in reverse'] = function () {
    stack();
    var list = l.get({
      reverse: true
    });
    buster.assert.equals(_.pluck(list, 'id'), ['terra-cr', 'aqua-cr', 'terra-aod', 'aqua-aod']);
  };

  self['Gets baselayers'] = function () {
    stack();
    var list = l.get({
      group: 'baselayers'
    });
    buster.assert.equals(_.pluck(list, 'id'), ['aqua-cr', 'terra-cr']);
  };

  self['Gets overlays'] = function () {
    stack();
    var list = l.get({
      group: 'overlays'
    });
    buster.assert.equals(_.pluck(list, 'id'), ['aqua-aod', 'terra-aod']);
  };

  self['Gets all groups'] = function () {
    stack();
    var results = l.get({
      group: 'all'
    });
    buster.assert.equals(results.baselayers[0].id, 'aqua-cr');
    buster.assert.equals(results.baselayers[1].id, 'terra-cr');
    buster.assert.equals(results.overlays[0].id, 'aqua-aod');
    buster.assert.equals(results.overlays[1].id, 'terra-aod');
  };

  self['Gets layers for other projection'] = function () {
    stack();
    var list = l.get({
      proj: 'arctic'
    });
    buster.assert.equals(_.pluck(list, 'id'), ['aqua-cr', 'terra-cr']);
  };

  self['Obscured base layer is not renderable'] = function () {
    stack();
    var list = l.get({
      renderable: true
    });
    buster.assert.equals(_.pluck(list, 'id'), ['aqua-cr', 'aqua-aod', 'terra-aod']);
  };

  self['Base layer is not obscured by a hidden layer'] = function () {
    stack();
    l.setVisibility('aqua-cr', false);
    var list = l.get({
      renderable: true
    });
    buster.assert.equals(_.pluck(list, 'id'), ['terra-cr', 'aqua-aod', 'terra-aod']);
  };

  self['Layer with zero opacity is not renderable'] = function () {
    stack();
    l.setOpacity('aqua-aod', 0);
    var list = l.get({
      renderable: true
    });
    buster.assert.equals(_.pluck(list, 'id'), ['aqua-cr', 'terra-aod']);
  };

  self['Layer outside date range is not renderable'] = function () {
    stack();
    models.date.select(new Date(Date.UTC(2001, 0, 1)));
    var list = l.get({
      renderable: true
    });
    buster.assert.equals(_.pluck(list, 'id'), ['terra-cr', 'terra-aod']);
  };

  self['All layers are visible'] = function () {
    stack();
    var list = l.get({
      visible: true
    });
    buster.assert.equals(_.pluck(list, 'id'), ['aqua-cr', 'terra-cr', 'aqua-aod', 'terra-aod']);
  };

  self['Only visible layers'] = function () {
    stack();
    l.setVisibility('terra-cr', false);
    l.setVisibility('terra-aod', false);
    var list = l.get({
      visible: true
    });
    buster.assert.equals(_.pluck(list, 'id'), ['aqua-cr', 'aqua-aod']);
  };

  self['Replace base layer'] = function () {
    stack();
    l.events.on('update', listener);
    l.events.on('change', changeListener);
    l.replace('aqua-cr', 'mask');
    var list = l.get();
    buster.assert.equals(_.pluck(list, 'id'), ['mask', 'terra-cr', 'aqua-aod', 'terra-aod']);
    buster.assert.called(listener);
    buster.assert.called(changeListener);
  };

  self['Replace overlay'] = function () {
    stack();
    l.events.on('update', listener);
    l.events.on('change', changeListener);
    l.replace('aqua-aod', 'combo-aod');
    var list = l.get();
    buster.assert.equals(_.pluck(list, 'id'), ['aqua-cr', 'terra-cr', 'combo-aod', 'terra-aod']);
    buster.assert.called(listener);
    buster.assert.called(changeListener);
  };

  self['Push base layer to bottom'] = function () {
    stack();
    l.events.on('update', listener);
    l.events.on('change', changeListener);
    l.pushToBottom('aqua-cr');
    var list = l.get();
    buster.assert.equals(_.pluck(list, 'id'), ['terra-cr', 'aqua-cr', 'aqua-aod', 'terra-aod']);
    buster.assert.called(listener);
    buster.assert.called(changeListener);
  };

  self['Push overlay to bottom'] = function () {
    stack();
    l.events.on('update', listener);
    l.events.on('change', changeListener);
    l.pushToBottom('aqua-aod');
    var list = l.get();
    buster.assert.equals(_.pluck(list, 'id'), ['aqua-cr', 'terra-cr', 'terra-aod', 'aqua-aod']);
    buster.assert.called(listener);
    buster.assert.called(changeListener);
  };

  self['Move base layer before'] = function () {
    stack();
    l.events.on('update', listener);
    l.events.on('change', changeListener);
    l.moveBefore('terra-cr', 'aqua-cr');
    var list = l.get();
    buster.assert.equals(_.pluck(list, 'id'), ['terra-cr', 'aqua-cr', 'aqua-aod', 'terra-aod']);
    buster.assert.called(listener);
    buster.assert.called(changeListener);
  };

  self['Move overlay before'] = function () {
    stack();
    l.events.on('update', listener);
    l.events.on('change', changeListener);
    l.moveBefore('terra-aod', 'aqua-aod');
    var list = l.get();
    buster.assert.equals(_.pluck(list, 'id'), ['aqua-cr', 'terra-cr', 'terra-aod', 'aqua-aod']);
    buster.assert.called(listener);
    buster.assert.called(changeListener);
  };

  self['Saves state'] = function () {
    l.add('terra-cr');
    l.add('terra-aod');
    var state = {};
    l.save(state);
    buster.assert.equals(state.l, [
      {
        id: 'terra-cr',
        attributes: []
      },
      {
        id: 'terra-aod',
        attributes: []
      }
    ]);
  };

  self['Saves state with hidden layer'] = function () {
    l.add('terra-cr');
    l.setVisibility('terra-cr', false);
    var state = {};
    l.save(state);
    buster.assert.equals(state.l, [
      {
        id: 'terra-cr',
        attributes: [{
          id: 'hidden'
        }]
      }
    ]);
  };

  self['Loads state'] = function () {
    var state = {
      l: [
        {
          id: 'terra-cr',
          attributes: []
        },
        {
          id: 'terra-aod',
          attributes: []
        }
      ]
    };
    l.load(state, errors);
    buster.assert(_.find(l.active, {
      id: 'terra-aod'
    }));
    buster.assert(_.find(l.active, {
      id: 'terra-cr'
    }));
    buster.assert.equals(errors.length, 0);
  };

  self['Loads state with hidden layer'] = function () {
    var state = {
      l: [
        {
          id: 'terra-cr',
          attributes: [{
            id: 'hidden',
            value: true
          }]
        }
      ]
    };
    l.load(state, errors);
    var def = _.find(models.layers.active, {
      id: 'terra-cr'
    });
    buster.assert(def);
    buster.refute(def.visible);
    buster.assert.equals(errors.length, 0);
  };

  self['Loads state with opacity'] = function () {
    var state = {
      l: [
        {
          id: 'terra-cr',
          attributes: [{
            id: 'opacity',
            value: 0.12
          }]
        }
      ]
    };
    l.load(state, errors);
    var def = _.find(models.layers.active, {
      id: 'terra-cr'
    });
    buster.assert(0.12, def.opacity);
    buster.assert.equals(errors.length, 0);
  };

  self['Loads state, opacity clamped at 1'] = function () {
    var state = {
      l: [
        {
          id: 'terra-cr',
          attributes: [{
            id: 'opacity',
            value: 5
          }]
        }
      ]
    };
    l.load(state, errors);
    var def = _.find(models.layers.active, {
      id: 'terra-cr'
    });
    buster.assert.equals(1, def.opacity);
    buster.assert.equals(errors.length, 0);
  };

  self['Loads state, opacity clamped at 0'] = function () {
    var state = {
      l: [
        {
          id: 'terra-cr',
          attributes: [{
            id: 'opacity',
            value: -5
          }]
        }
      ]
    };
    l.load(state, errors);
    var def = _.find(models.layers.active, {
      id: 'terra-cr'
    });
    buster.assert.equals(0, def.opacity);
    buster.assert.equals(errors.length, 0);
  };

  self['Starts with default layers when no permalink'] = function () {
    config.defaults.startingLayers = [
      {
        id: 'terra-cr'
      }
    ];
    l = wv.layers.model(models, config);
    l.load({});
    buster.assert(l.active[0].id, 'terra-cr');
    buster.assert(l.active[0].visible);
  };

  self['Starts with a default hidden layer'] = function () {
    config.defaults.startingLayers = [
      {
        id: 'terra-cr',
        hidden: true
      }
    ];
    l = wv.layers.model(models, config);
    l.load({});
    buster.assert(l.active[0].id, 'terra-cr');
    buster.refute(l.active[0].visible);
  };

  return self;
}()));

buster.testCase('wv.data.model', {

  config: null,
  models: null,
  model: null,
  errors: null,

  setUp: function () {
    this.config = {
      products: {
        'product1': {}
      },
      layers: {
        'layer1': {
          id: 'layer1',
          product: 'product1',
          group: 'overlays',
          projections: {
            geographic: {}
          }
        }
      }
    };
    this.models = {};
    this.models.proj = wv.proj.model(this.config);
    this.models.proj.selected = {
      id: 'geographic'
    };
    this.models.layers = wv.layers.model(this.models, this.config);
    this.models.layers.add('layer1');
    this.models.date = wv.date.model(this.models, this.config);
    this.model = wv.data.model(this.models, this.config);
    this.errors = [];
  },

  'Doesn\'t save state when not active': function () {
    this.model.selectProduct('product1');
    var state = {};
    this.model.save(state);
    buster.refute(state.download);
  },

  'Saves state': function () {
    this.model.active = true;
    this.model.selectedProduct = 'product1';
    var state = {};
    this.model.save(state);
    buster.assert.equals(state.download, 'product1');
  },

  'Subscribed for startup event when data download in load state': function () {
    this.models.wv = {
      events: {
        on: this.stub()
      }
    };
    var state = {
      download: 'product1'
    };
    this.model.load(state, this.errors);
    buster.assert.equals(this.errors.length, 0);
    buster.assert.calledWith(this.models.wv.events.on, 'startup');
  },

  'Error product is in state when no active layer is found': function () {
    this.models.wv = {
      events: {
        on: this.stub()
      }
    };
    this.models.layers.remove('layer1');
    var state = {
      download: 'product1'
    };
    this.model.load(state, this.errors);
    buster.assert.equals(this.errors.length, 1);
    buster.refute.calledWith(this.models.wv.events.on, 'startup');
  }
});

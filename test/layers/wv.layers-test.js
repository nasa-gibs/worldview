/* jshint sub: true */

buster.testCase('wv.layers', (function () {
  var self = {};
  var config;
  var errors;

  self.setUp = function () {
    config = fixtures.config();
    errors = [];
  };

  self['1.1: Parses only one baselayer'] = function () {
    var state = {
      products: 'baselayers,terra-cr'
    };
    wv.layers.parse(state, errors, config);
    buster.assert(state.l[0].id, 'terra-cr');
    buster.assert.equals(errors.length, 0);
  };

  self['1.1: Parses only one overlay'] = function () {
    var state = {
      products: 'overlays,terra-aod'
    };
    wv.layers.parse(state, errors, config);
    buster.assert.equals(state.l[0].id, 'terra-aod');
    buster.assert.equals(errors.length, 0);
  };

  self['1.2: Parses only one layer'] = function () {
    var state = {
      l: 'terra-cr'
    };
    wv.layers.parse(state, errors, config);
    buster.assert(state.l[0].id, 'terra-cr');
    buster.assert.equals(errors.length, 0);
  };

  self['1.1: Parses multiple layers'] = function () {
    var state = {
      products: 'baselayers,terra-cr~overlays,terra-aod,aqua-aod'
    };
    wv.layers.parse(state, errors, config);
    buster.assert(_.find(state.l, {
      id: 'terra-cr'
    }));
    buster.assert(_.find(state.l, {
      id: 'terra-aod'
    }));
    buster.assert(_.find(state.l, {
      id: 'aqua-aod'
    }));
    buster.assert.equals(errors.length, 0);
  };

  self['1.2: Parses multiple layers'] = function () {
    var state = {
      l: 'terra-cr,terra-aod,aqua-aod'
    };
    wv.layers.parse(state, errors, config);
    buster.assert(_.find(state.l, {
      id: 'terra-cr'
    }));
    buster.assert(_.find(state.l, {
      id: 'terra-aod'
    }));
    buster.assert(_.find(state.l, {
      id: 'aqua-aod'
    }));
    buster.assert.equals(errors.length, 0);
  };

  self['1.1: Empty layer list'] = function () {
    var state = {
      products: 'baselayers~overlays'
    };
    wv.layers.parse(state, errors, config);
    buster.assert.equals(state.l.length, 0);
  };

  self['1.2: Empty layer list'] = function () {
    var state = {
      l: ''
    };
    wv.layers.parse(state, errors, config);
    buster.assert.equals(state.l.length, 0);
  };

  self['1.0: Supports old style period delimiters'] = function () {
    var state = {
      products: 'baselayers.terra-cr~overlays.terra-aod.aqua-aod'
    };
    wv.layers.parse(state, errors, config);
    buster.assert(_.find(state.l, {
      id: 'terra-cr'
    }));
    buster.assert(_.find(state.l, {
      id: 'terra-aod'
    }));
    buster.assert(_.find(state.l, {
      id: 'aqua-aod'
    }));
    buster.assert.equals(errors.length, 0);
  };

  self['1.1: Skips invalid layers and records an error'] = function () {
    var state = {
      products: 'baselayers,terra-cr~overlays,layerx,aqua-aod'
    };
    wv.layers.parse(state, errors, config);
    buster.assert(_.find(state.l, {
      id: 'terra-cr'
    }));
    buster.assert(_.find(state.l, {
      id: 'aqua-aod'
    }));
    buster.assert.equals(errors.length, 1);
  };

  self['1.2: Skips invalid layers and records an error'] = function () {
    var state = {
      products: 'terra-cr,layerx,aqua-aod'
    };
    wv.layers.parse(state, errors, config);
    buster.assert(_.find(state.l, {
      id: 'terra-cr'
    }));
    buster.assert(_.find(state.l, {
      id: 'aqua-aod'
    }));
    buster.assert.equals(errors.length, 1);
  };

  self['1.1: No layers and no error if no groups found'] = function () {
    var state = {
      products: 'layerx,layery'
    };
    wv.layers.parse(state, errors, config);
    buster.assert.equals(state.l.length, 0);
  };

  self['1.1: Hidden layers'] = function () {
    var state = {
      products: 'baselayers,!terra-cr'
    };
    wv.layers.parse(state, errors, config);
    buster.assert.equals(state.l[0].id, 'terra-cr');
    buster.assert.equals(state.l[0].attributes[0].id, 'hidden');
    buster.assert.equals(errors.length, 0);
  };

  self['1.2: Hidden layers'] = function () {
    var state = {
      l: 'terra-cr(hidden)'
    };
    wv.layers.parse(state, errors, config);
    buster.assert.equals(state.l[0].id, 'terra-cr');
    buster.assert.equals(state.l[0].attributes[0].id, 'hidden');
    buster.assert.equals(errors.length, 0);
  };

  self['Opacity'] = function () {
    var state = {
      l: 'terra-cr(opacity=0.5)'
    };
    wv.layers.parse(state, errors, config);
    buster.assert.equals(state.l[0].id, 'terra-cr');
    var attr = state.l[0].attributes[0];
    buster.assert.equals(attr.id, 'opacity');
    buster.assert.equals(attr.value, '0.5');
    buster.assert.equals(errors.length, 0);
  };

  self['Minimum threshold'] = function () {
    var state = {
      l: 'terra-cr(min=0.5)'
    };
    wv.layers.parse(state, errors, config);
    buster.assert.equals(state.l[0].id, 'terra-cr');
    var attr = state.l[0].attributes[0];
    buster.assert.equals(attr.id, 'min');
    buster.assert.equals(attr.value, '0.5');
    buster.assert.equals(errors.length, 0);
  };

  self['Maximum threshold'] = function () {
    var state = {
      l: 'terra-cr(max=0.5)'
    };
    wv.layers.parse(state, errors, config);
    buster.assert.equals(state.l[0].id, 'terra-cr');
    var attr = state.l[0].attributes[0];
    buster.assert.equals(attr.id, 'max');
    buster.assert.equals(attr.value, '0.5');
    buster.assert.equals(errors.length, 0);
  };

  self['1.1: Layer redirects'] = function () {
    config.redirects = {
      layers: {
        'terra-cr': 'aqua-cr'
      }
    };
    var state = {
      products: 'baselayers,terra-cr'
    };
    wv.layers.parse(state, errors, config);
    buster.assert.equals(state.l[0].id, 'aqua-cr');
    buster.assert.equals(errors.length, 0);
  };

  self['1.2: Layer redirects'] = function () {
    config.redirects = {
      layers: {
        'terra-cr': 'aqua-cr'
      }
    };
    var state = {
      l: 'terra-cr'
    };
    wv.layers.parse(state, errors, config);
    buster.assert.equals(state.l[0].id, 'aqua-cr');
    buster.assert.equals(errors.length, 0);
  };

  return self;
}()));

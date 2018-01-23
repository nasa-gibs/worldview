buster.testCase('wv.palettes', (function () {
  var self = {};
  var config, models, errors;

  self.setUp = function () {
    config = fixtures.config();
    models = fixtures.models(config);
    errors = [];
  };

  self['Parses palette for valid layer'] = function () {
    var state = {
      l: 'terra-aod(palette=blue-1)'
    };
    wv.layers.parse(state, errors, config);
    var attr = state.l[0].attributes[0];
    buster.assert.equals(attr.id, 'palette');
    buster.assert.equals(attr.value, 'blue-1');
    buster.assert.equals(errors.length, 0);
  };

  self['1.1: Parses palette for valid layer'] = function () {
    var state = {
      l: 'terra-aod',
      palettes: 'terra-aod,blue-1'
    };
    wv.layers.parse(state, errors, config);
    wv.palettes.parse(state, errors, config);
    var attr = state.l[0].attributes[0];
    buster.assert.equals(attr.id, 'palette');
    buster.assert.equals(attr.value, 'blue-1');
    buster.assert.equals(errors.length, 0);
  };

  self['1.1: Parses palette for two valid layers'] = function () {
    var state = {
      l: 'terra-aod,aqua-aod',
      palettes: 'terra-aod,blue-1~aqua-aod,red-1'
    };
    wv.layers.parse(state, errors, config);
    wv.palettes.parse(state, errors, config);

    var attr1 = state.l[0].attributes[0];
    buster.assert.equals(attr1.id, 'palette');
    buster.assert.equals(attr1.value, 'blue-1');

    var attr2 = state.l[1].attributes[0];
    buster.assert.equals(attr2.id, 'palette');
    buster.assert.equals(attr2.value, 'red-1');

    buster.assert.equals(errors.length, 0);
  };

  self['1.1: Error if palette assigned to a layer that is not active'] = function () {
    var state = {
      l: 'terra-aod',
      palettes: 'aqua-aod,red-1'
    };
    wv.layers.parse(state, errors, config);
    wv.palettes.parse(state, errors, config);
    buster.assert.equals(errors.length, 1);
  };

  return self;
}()));

buster.testCase('wv.data', (function () {
  var self = {};

  var config;
  var errors;
  self.setUp = function () {
    config = {
      products: {
        'product1': {}
      }
    };
    errors = [];
  };

  self['Parses state, 1.1'] = function () {
    var state = {
      dataDownload: 'product1'
    };
    wv.data.parse(state, errors, config);
    buster.assert.equals(state.download, 'product1');
    buster.assert.equals(errors.length, 0);
  };

  self['Parses state, 1.2'] = function () {
    var state = {
      download: 'product1'
    };
    wv.data.parse(state, errors, config);
    buster.assert.equals(state.download, 'product1');
    buster.assert.equals(errors.length, 0);
  };

  self['Error on an invalid product'] = function () {
    var state = {
      download: 'productX'
    };
    wv.data.parse(state, errors, config);
    buster.refute(state.download);
    buster.assert.equals(errors.length, 1);
  };

  return self;
}()));

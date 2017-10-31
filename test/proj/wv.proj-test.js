buster.testCase('wv.proj', {

  config: null,

  setUp: function () {
    this.config = {
      projections: {
        geographic: {}
      }
    };
  },

  '1.1: Parses valid projection': function () {
    var state = {
      'switch': 'geographic'
    };
    var errors = [];
    wv.proj.parse(state, errors, this.config);
    buster.assert.equals(state.p, 'geographic');
    buster.assert.equals(errors.length, 0);
  },

  '1.2: Parses valid projection': function () {
    var state = {
      'p': 'geographic'
    };
    var errors = [];
    wv.proj.parse(state, errors, this.config);
    buster.assert.equals(state.p, 'geographic');
    buster.assert.equals(errors.length, 0);
  },

  'Rejects unsupported projection': function () {
    var state = {
      'p': 'albers'
    };
    var errors = [];
    wv.proj.parse(state, errors, this.config);
    buster.refute(state.p);
    buster.assert.equals(errors.length, 1);
  }

});

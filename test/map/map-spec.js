buster.testCase('wv.map', {

  errors: null,

  setUp: function () {
    this.errors = [];
  },

  '1.1: Parses state': function () {
    var state = {
      map: '0,1,2,3'
    };
    wv.map.parse(state, this.errors);
    buster.assert.equals(state.v, [0, 1, 2, 3]);
    buster.assert.equals(this.errors.length, 0);
  },

  '1.2: Parses state': function () {
    var state = {
      v: '0,1,2,3'
    };
    wv.map.parse(state, this.errors);
    buster.assert.equals(state.v, [0, 1, 2, 3]);
    buster.assert.equals(this.errors.length, 0);
  },

  'Error on invalid extent': function () {
    var state = {
      map: '0,1,x,3'
    };
    wv.map.parse(state, this.errors);
    buster.refute(state.map);
    buster.assert.equals(this.errors.length, 1);
  }

});

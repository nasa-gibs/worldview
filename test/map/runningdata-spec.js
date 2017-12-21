buster.testCase('wv.map.runningdata', {
  models: null,
  errors: null,

  setUp: function () {
    var models = {
      layers: {
        events: {
          on: this.stub()
        }
      }
    };
    this.runner = new wv.map.runningdata(models);
  },
  '1.0: Get Label from Palette object': function () {
    var scale = {
      colors: ['fbd1fbff', 'a605b0ff', '1e00eaff'],
      tooltips: ['40 – 40.4', '40.4 – 50', '50 – 60'],
      units: 'ppb'
    };
    var value = this.runner.getDataLabel(scale, '1e00eaff');
    buster.assert.equals(value.label, '50 – 60 ppb');
  },
  '1.2: Removes layers that are no longer present': function () {
    var arra1 = ['layer1', 'layer2', 'layer3'];
    var arra2 = ['layer1', 'layer2'];

    var value = this.runner.LayersToRemove(arra1, arra2);
    buster.assert.equals(value, ['layer3']);
  }

});

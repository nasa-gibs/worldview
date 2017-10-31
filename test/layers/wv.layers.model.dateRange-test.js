buster.testCase('wv.layers.model.dateRange', {

  config: null,
  models: null,
  model: null,

  setUp: function () {
    this.models = {};
    this.models.proj = wv.proj.model({
      defaults: {
        projection: 'geographic'
      },
      projections: {
        geographic: {
          id: 'geographic'
        }
      }
    });
    this.models.layers = wv.layers.model(this.models, {
      layers: {
        'historical_1': {
          id: 'historical_1',
          startDate: '2000-01-01',
          endDate: '2002-01-01',
          group: 'baselayers',
          projections: {
            geographic: {}
          }
        },
        'historical_2': {
          id: 'historical_2',
          startDate: '2001-01-01',
          endDate: '2003-01-01',
          group: 'overlays',
          projections: {
            geographic: {}
          }
        },
        'active_1': {
          id: 'active_1',
          startDate: '2005-01-01',
          group: 'overlays',
          projections: {
            geographic: {}
          }
        },
        'static': {
          id: 'static',
          group: 'overlays',
          projections: {
            geographic: {}
          }
        }
      }
    });
    this.model = this.models.layers;
    this.stub(wv.util, 'now')
      .returns(new Date(Date.UTC(2010, 0, 1)));
  },

  'Date range with one layer': function () {
    this.model.add('historical_1');
    var range = this.model.dateRange();
    buster.assert.equals(range.start.getTime(),
      new Date(Date.UTC(2000, 0, 1))
        .getTime());
    buster.assert.equals(range.end.getTime(),
      new Date(Date.UTC(2010, 0, 1))
        .getTime());
  },

  'Date range with two layers': function () {
    this.model.add('historical_1');
    this.model.add('historical_2');
    var range = this.model.dateRange();
    buster.assert.equals(range.start.getTime(),
      new Date(Date.UTC(2000, 0, 1))
        .getTime());
    buster.assert.equals(range.end.getTime(),
      new Date(Date.UTC(2010, 0, 1))
        .getTime());
  },

  'End of date range is today if no end date': function () {
    this.model.add('active_1');
    var range = this.model.dateRange();
    buster.assert.equals(range.start.getTime(),
      new Date(Date.UTC(2005, 0, 1))
        .getTime());
    buster.assert.equals(range.end.getTime(),
      new Date(Date.UTC(2010, 0, 1))
        .getTime());
  },

  'No date range with static': function () {
    this.model.add('static');
    buster.refute(this.model.dateRange());
  }

});

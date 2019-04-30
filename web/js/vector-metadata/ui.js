import React from 'react';
import ReactDOM from 'react-dom';
import VectorMeta from '../containers/vector-metadata';

export function vectorMetaUi(models, ui, config) {
  var self = {};
  var map;

  var init = function() {
    var metaTitle;
    map = ui.map.selected;

    self.reactComponent = ReactDOM.render(
      React.createElement(VectorMeta, getInitialProps()),
      document.getElementById('wv-vector-metadata')
    );

    // Clicking on a vector shows it's attributes in console.
    map.on('click', function(e) {
      var metaArray = [];
      var def;
      map.forEachFeatureAtPixel(e.pixel, function(feature, layer) {
        def = layer.wv.def;
        metaTitle = def.title;
        if (def.vectorData && def.vectorData.id) {
          let features = feature.getProperties();
          let vectorDataId = def.vectorData.id;
          let data = config.vectorData[vectorDataId];
          let obj = {
            'legend': data,
            'features': features
          };
          metaArray.push(obj);
        }
      });
      const uniqueMeta = metaArray
        .map(e => e['layer'])
        // store the keys of the unique objects
        .map((e, i, final) => final.indexOf(e) === i && i)
        // eliminate the dead keys & store unique objects
        .filter(e => metaArray[e]).map(e => metaArray[e]);

      if (uniqueMeta.length) {
        let vectorPointMeta = uniqueMeta[0];
        let legend = vectorPointMeta.legend;
        // MVT Features table (Use legend object as tooltips)
        let features = vectorPointMeta.features;

        // Object.entries(features).forEach(feature => {
        //   let featureName = feature[0];
        //   console.log(featureName); // TITLE LINE
        //   Object.values(legend['mvt_properties']).forEach(property => {
        //     if (property['Identifier'] === featureName) { console.log(property); } //TOOLTIP LINE
        //   });
        // });
        // console.log('-------------------');
        // Object.entries(features).forEach(feature => {
        //   let featureData = feature[1];
        //   console.log(featureData); // DATA LINE (Should match table headings)
        // });
        // console.log('-------------------');
        self.reactComponent.setState({
          metaModal: true,
          metaTitle: metaTitle,
          metaFeatures: features,
          metaLegend: legend
        });
      }
    });
  };

  var getInitialProps = function() {
    return {
      models: models,
      config: config,
      ui: ui,
      metaModal: false, // initial modal state
      metaTitle: '',
      metaFeatures: {},
      metaLegend: {}
    };
  };

  init();
  return self;
}

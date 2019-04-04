import React from 'react';
import ReactDOM from 'react-dom';
import VectorMeta from '../components/vector-metadata/vector-metadata';

export function vectorMetaUI(models, ui, config) {
  var self = {};

  var init = function() {
    self.reactComponent = ReactDOM.render(
      React.createElement(VectorMeta, getInitialProps()),
      document.getElementById('wv-vector-metadata')
    );
  };

  var getInitialProps = function() {
    return {
      models: models,
      config: config,
      ui: ui,
      modalMeta: false
    };
  };

  init();
  return self;
}

import React from 'react';
import ReactDOM from 'react-dom';
import Tour from '../components/tour/tour';

export function tourUi(models, ui, config) {
  var self = {};

  var init = function() {
    self.reactComponent = ReactDOM.render(
      React.createElement(Tour, {
        models: models,
        ui: ui,
        config: config
      }),
      document.getElementById('wv-tour')
    );
  };
  init();
  return self;
}
//   var init = function() {
//     self.show();
//   };

//   self.show = function() {
//     var TourWidget = React.createElement(TourStart);

//     self.reactComponent = ReactDOM.render(TourWidget, document.getElementById('app'));
//   };

//   init();
//   return self;
// }

import React from 'react';
import ReactDOM from 'react-dom';
import TourStart from '../components/tour/start';

export function tourUi(models, ui, config) {
  var self = {};

  var init = function() {
    self.reactComponent = ReactDOM.render(
      React.createElement(TourStart),
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

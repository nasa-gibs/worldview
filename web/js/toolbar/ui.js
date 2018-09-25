import React from 'react';
import ReactDOM from 'react-dom';
import Toolbar from '../components/toolbar/toolbar';

export function toolbarUi(models, ui, config) {
  var self = {};

  var init = function() {
    self.reactComponent = ReactDOM.render(
      React.createElement(Toolbar),
      document.getElementById('wv-toolbar')
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

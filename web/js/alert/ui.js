import React from 'react';
import ReactDOM from 'react-dom';
import TourAlert from '../components/alert/alert-tour';

export function alertUi(ui) {
  var self = {};

  var init = function() {
    self.reactComponent = ReactDOM.render(
      React.createElement(TourAlert, getInitialAlertProps()),
      document.getElementById('wv-alerts')
    );
  };

  var getInitialAlertProps = function() {
    return {
      visible: false,
      showTourAlert: self.showTourAlert
    };
  };

  self.showTourAlert = function(e) {
    var hideTour = localStorage.getItem('hideTour');
    if (!hideTour) return;

    self.reactComponent.setState({
      visible: true
    });

    setTimeout(() => {
      self.reactComponent.setState({
        visible: false
      });
    }, 10000);
  };

  init();
  return self;
}

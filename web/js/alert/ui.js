import React from 'react';
import ReactDOM from 'react-dom';
import TourAlert from '../components/alert/alert-tour';
import util from '../util/util';

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
      showTourAlert: self.showTourAlert,
      message: null
    };
  };

  self.showTourAlert = function(e) {
    if (!util.browser.localStorage) return;
    var hideTour = localStorage.getItem('hideTour');
    if (!hideTour) return;

    self.reactComponent.setState({
      visible: true,
      message: 'To view these tours again, click the \'Start Tour\' link within the "i" button menu.'
    });

    setTimeout(() => {
      self.reactComponent.setState({
        visible: false
      });
    }, 10000);
  };

  self.noTourAvailable = function(e) {
    self.reactComponent.setState({
      visible: true,
      message: 'Sorry, this tour is no longer supported.'
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

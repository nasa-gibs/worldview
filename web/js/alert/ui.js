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
      showTourAlert: self.showTourAlert
    };
  };

  self.showTourAlert = function(e) {
    var tourAlert = localStorage.getItem('tourAlert');

    if (!util.browser.localStorage) return;
    if (tourAlert) return;

    localStorage.setItem('tourAlert', !tourAlert);

    self.reactComponent.setState({
      visible: true
    });

    setTimeout(() => {
      self.reactComponent.setState({
        visible: false
      });
    }, 5000);
  };

  init();
  return self;
}

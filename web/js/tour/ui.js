import React from 'react';
import ReactDOM from 'react-dom';
import Tour from '../components/tour/tour';
import util from '../util/util';

export function tourUi(models, ui, config) {
  var self = {};

  var init = function() {
    if (!config.features.tour || !config.stories || !config.storyOrder) {
      return;
    }

    self.reactComponent = ReactDOM.render(
      React.createElement(Tour, getInitialProps()),
      document.getElementById('wv-tour')
    );
  };

  var getInitialProps = function() {
    return {
      models: models,
      config: config,
      ui: ui,
      stories: config['stories'],
      storyOrder: config['storyOrder'],
      modalStart: self.checkBuildTimestamp(),
      modalInProgress: false,
      modalComplete: false,
      currentStep: 1,
      totalSteps: 10,
      tourParameter: config.parameters.tr || null,
      currentStoryIndex: 0,
      currentStory: {},
      currentStoryId: '',
      startTour: self.startTour,
      selectTour: self.selectTour,
      notifyUserOfTour: self.notifyUserOfTour,
      showTourAlert: ui.alert.showTourAlert,
      hideTour: self.hideTour,
      showTour: self.showTour
    };
  };

  self.checkBuildTimestamp = function() {
    var hideTour = localStorage.getItem('hideTour');

    if (!util.browser.localStorage) return;

    if (hideTour && config.buildDate) {
      let buildDate = new Date(config.buildDate);
      let tourDate = new Date(hideTour);
      if (buildDate > tourDate) {
        localStorage.removeItem('hideTour');
        return true;
      } else {
        return false;
      }
    } else if (hideTour) {
      return false;
    } else {
      return true;
    }
  };

  self.startTour = function(e) {
    if (e) e.preventDefault();
    self.reactComponent.setState({
      currentStep: 1,
      modalStart: true,
      modalInProgress: false,
      modalComplete: false
    });
  };

  self.selectTour = function(e, currentStory, currentStoryIndex, currentStoryId) {
    if (e) e.preventDefault();
    self.reactComponent.setState({
      currentStep: 1,
      currentStoryIndex: currentStoryIndex,
      modalStart: false,
      modalInProgress: true,
      modalComplete: false,
      currentStory: currentStory,
      currentStoryId: currentStoryId
    });
  };

  self.hideTour = function(e) {
    var hideTour = localStorage.getItem('hideTour');

    if (!util.browser.localStorage) return;
    if (hideTour) return;

    localStorage.setItem('hideTour', new Date());
  };

  self.showTour = function(e) {
    var hideTour = localStorage.getItem('hideTour');

    if (!util.browser.localStorage) return;
    if (!hideTour) return;

    localStorage.removeItem('hideTour');
  };

  init();
  return self;
}

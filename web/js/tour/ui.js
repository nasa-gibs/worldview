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
      modalStart: !localStorage.hideTour,
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

    localStorage.setItem('hideTour', !hideTour);
  };

  self.showTour = function(e) {
    var hideTour = localStorage.getItem('hideTour');

    if (!util.browser.localStorage) return;
    if (!hideTour) return;

    localStorage.removeItem('hideTour', !hideTour);
  };

  init();
  return self;
}

import React from 'react';
import ReactDOM from 'react-dom';
import Tour from '../components/tour/tour';

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
      stories: config['stories'],
      storyOrder: config['storyOrder'],
      modalStart: true,
      modalInProgress: false,
      modalComplete: false,
      currentStep: 1,
      totalSteps: 10,
      tourParameter: config.parameters.tr || null,
      currentStoryIndex: 0,
      currentStory: {},
      currentStoryId: '',
      startTour: self.startTour,
      selectTour: self.selectTour
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

  init();
  return self;
}

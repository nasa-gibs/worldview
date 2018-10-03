import React from 'react';
import PropTypes from 'prop-types';
import TourStart from './modal-start';
import TourInProgress from './modal-in-progress';
import TourComplete from './modal-complete';

class Tour extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      models: this.props.models,
      ui: this.props.ui,
      config: this.props.config,
      stories: this.props.config.stories,
      storyOrder: this.props.config.storyOrder,
      modalStart: true,
      modalInProgress: false,
      modalComplete: false,
      currentStep: 1,
      totalSteps: 10,
      tourParameter: this.props.config.parameters.tr || null,
      currentStoryIndex: 0,
      currentStory: {},
      currentStoryId: ''
    };

    this.toggleModalStart = this.toggleModalStart.bind(this);
    this.toggleModalInProgress = this.toggleModalInProgress.bind(this);
    this.toggleModalComplete = this.toggleModalComplete.bind(this);
    this.startTour = this.startTour.bind(this);
    this.restartTour = this.restartTour.bind(this);
    this.incrementStep = this.incrementStep.bind(this);
    this.decreaseStep = this.decreaseStep.bind(this);
  }

  toggleModalStart(e) {
    e.preventDefault();
    this.setState({
      modalStart: !this.state.modalStart
    });
  }

  toggleModalInProgress(e) {
    e.preventDefault();
    this.setState({
      modalInProgress: !this.state.modalInProgress
    });
  }

  toggleModalComplete(e) {
    e.preventDefault();
    this.setState({
      modalComplete: !this.state.modalComplete
    });
  }

  startTour(e, currentStory, currentStoryIndex, currentStoryId) {
    if (e) e.preventDefault();
    this.setState({
      steps: 1,
      currentStoryIndex: currentStoryIndex,
      modalStart: false,
      modalInProgress: true,
      modalComplete: false,
      currentStory: currentStory,
      currentStoryId: currentStoryId
    });
  }

  restartTour(e) {
    e.preventDefault();
    this.setState({
      steps: 1,
      modalStart: true,
      modalInProgress: false,
      modalComplete: false
    });
  }

  incrementStep(e) {
    if (this.state.currentStep + 1 <= this.state.totalSteps) this.setState({ currentStep: this.state.currentStep + 1 });
    if (this.state.currentStep + 1 === this.state.totalSteps + 1) {
      this.toggleModalInProgress(e);
      this.toggleModalComplete(e);
    }
  }

  decreaseStep(e) {
    if (this.state.currentStep - 1 >= 1) this.setState({ currentStep: this.state.currentStep - 1 });
  }

  render() {
    if (this.state.stories) {
      return (
        <div>
          <TourStart
            stories={this.state.stories}
            storyOrder={this.state.storyOrder}
            modalStart={this.state.modalStart}
            toggleModalStart={this.toggleModalStart}
            toggleModalInProgress={this.toggleModalInProgress}
            toggleModalComplete={this.toggleModalComplete}
            startTour={this.startTour}
          ></TourStart>

          <TourInProgress
            models={this.state.models}
            config={this.state.config}
            ui={this.state.ui}
            modalInProgress={this.state.modalInProgress}
            toggleModalStart={this.toggleModalStart}
            toggleModalInProgress={this.toggleModalInProgress}
            toggleModalComplete={this.toggleModalComplete}
            startTour={this.startTour}
            currentStep={this.state.currentStep}
            totalSteps={this.state.totalSteps}
            incrementStep={this.incrementStep}
            decreaseStep={this.decreaseStep}
            currentStoryIndex={this.state.currentStoryIndex}
            stories={this.state.stories}
            currentStoryId={this.state.currentStoryId}
            currentStory={this.state.currentStory}
          ></TourInProgress>

          <TourComplete
            modalComplete={this.state.modalComplete}
            toggleModalStart={this.toggleModalStart}
            toggleModalInProgress={this.toggleModalInProgress}
            toggleModalComplete={this.toggleModalComplete}
            restartTour={this.restartTour}
          ></TourComplete>
        </div>
      );
    } else {
      return null;
    }
  }
}

Tour.propTypes = {
  models: PropTypes.object.isRequired,
  ui: PropTypes.object.isRequired,
  config: PropTypes.object.isRequired,
  stories: PropTypes.object.isRequired,
  storyOrder: PropTypes.array.isRequired,
  modalStart: PropTypes.bool.isRequired,
  modalInProgress: PropTypes.bool.isRequired,
  modalComplete: PropTypes.bool.isRequired,
  currentStep: PropTypes.number,
  totalSteps: PropTypes.number,
  tourParameter: PropTypes.string,
  currentStoryIndex: PropTypes.number,
  currentStory: PropTypes.object,
  currentStoryId: PropTypes.string
};

export default Tour;

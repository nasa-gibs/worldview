import React from 'react';
import PropTypes from 'prop-types';
import TourStart from './modal-tour-start';
import TourInProgress from './modal-tour-in-progress';
import TourComplete from './modal-tour-complete';

class Tour extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      models: props.models,
      config: props.config,
      ui: props.ui,
      stories: props.stories,
      storyOrder: props.storyOrder,
      modalStart: props.modalStart,
      modalInProgress: props.modalInProgress,
      modalComplete: props.modalComplete,
      currentStep: props.currentStep,
      totalSteps: props.totalSteps,
      tourParameter: props.tourParameter,
      currentStoryIndex: props.currentStoryIndex,
      currentStory: props.currentStory,
      currentStoryId: props.currentStoryId,
      showTourAlert: props.showTourAlert,
      hideTour: props.hideTour
    };

    this.toggleModalStart = this.toggleModalStart.bind(this);
    this.toggleModalInProgress = this.toggleModalInProgress.bind(this);
    this.toggleModalComplete = this.toggleModalComplete.bind(this);
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
            selectTour={this.props.selectTour}
            showTourAlert={this.props.showTourAlert}
            hideTour={this.props.hideTour}
            showTour={this.props.showTour}
          ></TourStart>

          <TourInProgress
            models={this.state.models}
            config={this.state.config}
            ui={this.state.ui}
            modalInProgress={this.state.modalInProgress}
            toggleModalStart={this.toggleModalStart}
            toggleModalInProgress={this.toggleModalInProgress}
            toggleModalComplete={this.toggleModalComplete}
            selectTour={this.props.selectTour}
            currentStep={this.state.currentStep}
            totalSteps={this.state.totalSteps}
            incrementStep={this.incrementStep}
            decreaseStep={this.decreaseStep}
            currentStoryIndex={this.state.currentStoryIndex}
            stories={this.state.stories}
            currentStoryId={this.state.currentStoryId}
            currentStory={this.state.currentStory}
            showTourAlert={this.props.showTourAlert}
          ></TourInProgress>

          <TourComplete
            currentStory={this.state.currentStory}
            modalComplete={this.state.modalComplete}
            toggleModalStart={this.toggleModalStart}
            toggleModalInProgress={this.toggleModalInProgress}
            toggleModalComplete={this.toggleModalComplete}
            startTour={this.props.startTour}
            restartTour={this.props.restartTour}
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
  config: PropTypes.object.isRequired,
  ui: PropTypes.object.isRequired,
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
  currentStoryId: PropTypes.string,
  startTour: PropTypes.func.isRequired,
  restartTour: PropTypes.func.isRequired,
  selectTour: PropTypes.func.isRequired,
  showTourAlert: PropTypes.func.isRequired,
  hideTour: PropTypes.func.isRequired,
  showTour: PropTypes.func.isRequired
};

export default Tour;

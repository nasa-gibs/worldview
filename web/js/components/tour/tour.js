import React from 'react';
import PropTypes from 'prop-types';
import TourStart from './modal-tour-start';
import TourInProgress from './modal-tour-in-progress';
import TourComplete from './modal-tour-complete';
import googleTagManager from 'googleTagManager';

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
      hideTour: props.hideTour,
      restartTour: props.restartTour,
      metaLoaded: props.metaLoaded
    };

    this.toggleModalStart = this.toggleModalStart.bind(this);
    this.toggleModalInProgress = this.toggleModalInProgress.bind(this);
    this.toggleModalComplete = this.toggleModalComplete.bind(this);
    this.toggleRestartTour = this.toggleRestartTour.bind(this);
    this.toggleMetaLoaded = this.toggleMetaLoaded.bind(this);
    this.incrementStep = this.incrementStep.bind(this);
    this.decreaseStep = this.decreaseStep.bind(this);
  }

  componentDidMount() {
    window.addEventListener('resize', this.resize.bind(this));
    this.resize();
  }

  resize() {
    if (window.innerWidth < 740) {
      this.setState({ modalStart: false, modalInProgress: false, modalComplete: false });
    }
    if (window.innerHeight < 450) {
      this.setState({ modalStart: false, modalInProgress: false, modalComplete: false });
    }
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
    // When tour is not in progress, remove from URL
    this.props.models.tour.toggle();
    this.props.models.tour.select(this.state.currentStoryId);
    this.toggleMetaLoaded();
  }

  toggleModalComplete(e) {
    e.preventDefault();
    this.setState({
      modalComplete: !this.state.modalComplete
    });
    // The tour completed modal has been shown (all steps complete)
    googleTagManager.pushEvent({
      'event': 'tour_completed',
      'story': {
        'id': this.state.currentStoryId
      }
    });
  }

  toggleRestartTour() {
    this.setState({
      restartTour: !this.state.restartTour,
      metaLoaded: false
    });
  }

  toggleMetaLoaded() {
    this.setState({
      metaLoaded: !this.state.metaLoaded
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
    if (this.state.currentStep - 1 >= 1) {
      this.setState({ currentStep: this.state.currentStep - 1 });
    } else {
      this.setState({
        currentStep: 1,
        modalInProgress: false,
        modalStart: true
      });
    }
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
            restartTour={this.state.restartTour}
            metaLoaded={this.state.metaLoaded}
            toggleRestartTour={this.toggleRestartTour}
            toggleMetaLoaded={this.toggleMetaLoaded}
          ></TourInProgress>

          <TourComplete
            currentStory={this.state.currentStory}
            modalComplete={this.state.modalComplete}
            toggleModalStart={this.toggleModalStart}
            toggleModalInProgress={this.toggleModalInProgress}
            toggleModalComplete={this.toggleModalComplete}
            startTour={this.props.startTour}
            resetTour={this.props.resetTour}
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
  resetTour: PropTypes.func.isRequired,
  selectTour: PropTypes.func.isRequired,
  showTourAlert: PropTypes.func.isRequired,
  hideTour: PropTypes.func.isRequired,
  showTour: PropTypes.func.isRequired,
  restartTour: PropTypes.bool.isRequired,
  metaLoaded: PropTypes.bool.isRequired
};

export default Tour;

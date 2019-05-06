import React from 'react';
import PropTypes from 'prop-types';
import TourStart from '../components/tour/modal-tour-start';
import TourInProgress from '../components/tour/modal-tour-in-progress';
import TourComplete from '../components/tour/modal-tour-complete';
import { connect } from 'react-redux';
import googleTagManager from 'googleTagManager';
import { endTour, selectStory } from '../modules/tour/actions';
import { findIndex as lodashFindIndex, get as lodashGet } from 'lodash';
import update from 'immutability-helper';
import { history } from '../main';
import util from '../util/util';

class Tour extends React.Component {
  constructor(props) {
    super(props);
    const storyOrder = props.storyOrder;
    const stories = props.stories;
    const currentStoryIndex =
      lodashFindIndex(storyOrder, { id: props.currentStoryId }) || null;
    const currentStory =
      currentStoryIndex >= 0 ? stories[props.currentStoryId] : {};
    const steps = lodashGet(currentStory, 'steps') || [];

    this.state = {
      modalStart: true,
      modalInProgress: false,
      modalComplete: false,
      currentStep: currentStoryIndex !== -1 ? 1 : 0,
      totalSteps: steps.length,
      metaLoaded: false,
      isLoadingMeta: false,
      restartTour: true,
      currentStory,
      currentStoryId: props.currentStoryId,
      currentStoryIndex: currentStoryIndex
    };

    this.toggleModalStart = this.toggleModalStart.bind(this);
    this.toggleModalInProgress = this.toggleModalInProgress.bind(this);
    this.toggleModalComplete = this.toggleModalComplete.bind(this);
    this.toggleRestartTour = this.toggleRestartTour.bind(this);
    this.incrementStep = this.incrementStep.bind(this);
    this.decreaseStep = this.decreaseStep.bind(this);
  }
  toggleModalStart(e) {
    e.preventDefault();
    this.setState({
      modalStart: !this.state.modalStart
    });
  }
  selectTour(e, currentStory, currentStoryIndex, currentStoryId) {
    if (e) e.preventDefault();
    this.setState({
      currentStep: 1,
      currentStoryIndex: currentStoryIndex,
      modalStart: false,
      modalInProgress: true,
      metaLoaded: false,
      modalComplete: false,
      currentStory: currentStory,
      currentStoryId: currentStoryId,
      totalSteps: currentStory.steps.length
    });
    this.props.selectTour(currentStoryId);
    this.fetchMetadata(currentStory, 0);
    this.props.processStepLink(
      currentStory.steps[0]['stepLink'] + '&tr=' + currentStoryId
    );
  }
  fetchMetadata(currentStory, stepIndex) {
    var description = currentStory.steps[stepIndex]['description'];
    var { origin, pathname } = window.location;
    var errorMessage = '<p>There was an error loading this description.</p>';
    var uri = `${origin}${pathname}config/metadata/stories/${
      currentStory.id
    }/${description}`;
    this.setState({ isLoadingMeta: true, metaLoaded: false });
    fetch(uri)
      .then(res => (res.ok ? res.text() : errorMessage))
      .then(body => {
        let isMetadataSnippet = !body.match(
          /<(head|body|html|style|script)[^>]*>/i
        );
        let description = isMetadataSnippet ? body : errorMessage;
        this.setState({
          description: description,
          isLoadingMeta: false,
          metaLoaded: true
        });
      })
      .catch(error =>
        this.setState({ description: error, isLoadingMeta: false })
      );
  }
  resetTour(e) {
    if (e) e.preventDefault();
    // Tour startup modal shown by clicking "More Stories" button at end of story
    selectStory('');
    googleTagManager.pushEvent({
      event: 'tour_more_stories_button'
    });
    this.setState({
      modalInProgress: false,
      modalComplete: false,
      restartTour: true
    });
  }
  toggleModalInProgress(e) {
    e.preventDefault();
    this.setState({
      modalInProgress: !this.state.modalInProgress
    });
    this.toggleMetaLoaded();
  }

  toggleModalComplete(e) {
    e.preventDefault();
    this.setState({
      modalComplete: !this.state.modalComplete
    });
    // The tour completed modal has been shown (all steps complete)
    googleTagManager.pushEvent({
      event: 'tour_completed',
      story: {
        id: this.state.currentStoryId
      }
    });
  }

  toggleRestartTour() {
    this.setState({
      restartTour: !this.state.restartTour,
      metaLoaded: false
    });
  }
  incrementStep(e) {
    const {
      currentStep,
      currentStory,
      totalSteps,
      currentStoryId
    } = this.state;

    if (currentStep + 1 <= totalSteps) {
      let newStep = currentStep + 1;
      this.fetchMetadata(currentStory, currentStep);
      this.setState({ currentStep: newStep });
      this.props.processStepLink(
        currentStory.steps[newStep - 1]['stepLink'] + '&tr=' + currentStoryId
      );
    }
    if (currentStep + 1 === totalSteps + 1) {
      this.toggleModalInProgress(e);
      this.toggleModalComplete(e);
    }
  }

  decreaseStep(e) {
    const { currentStep, currentStory, currentStoryId } = this.state;
    if (currentStep - 1 >= 1) {
      let newStep = currentStep - 1;
      this.fetchMetadata(currentStory, newStep - 1);
      this.setState({ currentStep: newStep });
      this.props.processStepLink(
        currentStory.steps[newStep - 1]['stepLink'] + '&tr=' + currentStoryId
      );
    } else {
      this.setState({
        currentStep: 1,
        modalInProgress: false,
        modalStart: true
      });
    }
  }

  render() {
    const {
      stories,
      storyOrder,
      showTourAlert,
      hideTour,
      showTour,
      config,
      restartTour,
      screenHeight,
      screenWidth,
      endTour,
      processStepLink,
      isActive
    } = this.props;
    const {
      modalInProgress,
      metaLoaded,
      currentStory,
      currentStoryId,
      currentStep,
      totalSteps,
      modalComplete,
      models,
      modalStart,
      currentStoryIndex,
      description,
      isLoadingMeta
    } = this.state;
    if (screenWidth < 740 || screenHeight < 450) {
      endTour();
    }
    if (stories && isActive) {
      return (
        <div>
          {modalStart ? (
            <TourStart
              stories={stories}
              storyOrder={storyOrder}
              modalStart={modalStart}
              toggleModalStart={this.toggleModalStart}
              toggleModalInProgress={this.toggleModalInProgress}
              toggleModalComplete={this.toggleModalComplete}
              selectTour={this.selectTour.bind(this)}
              showTourAlert={showTourAlert}
              hideTour={hideTour}
              showTour={showTour}
            />
          ) : modalInProgress ? (
            <TourInProgress
              config={config}
              models={models}
              endTour={endTour}
              modalInProgress={modalInProgress}
              toggleModalStart={this.toggleModalStart}
              toggleModalInProgress={this.toggleModalInProgress}
              toggleModalComplete={this.toggleModalComplete}
              currentStep={currentStep}
              totalSteps={totalSteps}
              currentStoryIndex={currentStoryIndex}
              incrementStep={this.incrementStep}
              decreaseStep={this.decreaseStep}
              stories={stories}
              currentStoryId={currentStoryId}
              currentStory={currentStory}
              showTourAlert={showTourAlert}
              restartTour={restartTour}
              metaLoaded={metaLoaded}
              isLoadingMeta={isLoadingMeta}
              description={description}
              toggleRestartTour={this.toggleRestartTour}
              toggleMetaLoaded={this.toggleMetaLoaded}
              processStepLink={processStepLink}
            />
          ) : (
            <TourComplete
              currentStory={currentStory}
              modalComplete={modalComplete}
              toggleModalStart={this.toggleModalStart}
              toggleModalInProgress={this.toggleModalInProgress}
              toggleModalComplete={this.toggleModalComplete}
              resetTour={this.resetTour.bind(this)}
            />
          )}
        </div>
      );
    } else {
      return null;
    }
  }
}

Tour.propTypes = {
  config: PropTypes.object.isRequired,
  stories: PropTypes.object.isRequired,
  storyOrder: PropTypes.array.isRequired,
  currentStep: PropTypes.number,
  totalSteps: PropTypes.number,
  currentStory: PropTypes.object,
  currentStoryId: PropTypes.string,
  selectTour: PropTypes.func.isRequired,
  showTourAlert: PropTypes.func.isRequired,
  hideTour: PropTypes.func.isRequired,
  showTour: PropTypes.func.isRequired
};
const mapDispatchToProps = dispatch => ({
  processStepLink: search => {
    const location = update(history.location, {
      search: { $set: search }
    });
    dispatch({ type: 'REDUX-LOCATION-POP-ACTION', payload: location });
  },
  showTourAlert: message => {
    // dispatch(showAlert(message));
  },
  selectTour: id => {
    dispatch(selectStory(id));
  },
  showTour: showTour,
  hideTour: hideTour
});
function mapStateToProps(state) {
  const { browser, config, tour } = state;
  const { screenWidth, screenHeight } = browser;

  return {
    config,
    isActive: tour.active,
    models: state.models,
    compareState: state.compare,
    stories: config.stories,
    storyOrder: config.storyOrder,
    currentStoryId: tour.selected,
    hideTour,
    screenWidth,
    screenHeight,
    showTour
  };
}
const hideTour = function(e) {
  var hideTour = localStorage.getItem('hideTour');

  // Checkbox to "hide tour modal until a new story has been added" has been checked
  googleTagManager.pushEvent({
    event: 'tour_hide_checked'
  });

  if (!util.browser.localStorage) return;
  if (hideTour) return;

  localStorage.setItem('hideTour', new Date());
};
const showTour = function(e) {
  var hideTour = localStorage.getItem('hideTour');

  // Checkbox to "hide tour modal until a new story has been added" has been checked
  googleTagManager.pushEvent({
    event: 'tour_hide_unchecked'
  });

  if (!util.browser.localStorage) return;
  if (!hideTour) return;

  localStorage.removeItem('hideTour');
};
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Tour);

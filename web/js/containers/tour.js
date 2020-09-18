/* eslint-disable no-nested-ternary */
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import googleTagManager from 'googleTagManager';
import { findIndex as lodashFindIndex, get as lodashGet, uniqBy } from 'lodash';
import update from 'immutability-helper';
import Joyride from 'react-joyride';

import TourStart from '../components/tour/modal-tour-start';
import TourInProgress from '../components/tour/modal-tour-in-progress';
import TourComplete from '../components/tour/modal-tour-complete';
import AlertUtil from '../components/util/alert';
import safeLocalStorage from '../util/local-storage';

import {
  preloadPalettes,
  hasCustomTypePalette,
} from '../modules/palettes/util';
import { BULK_PALETTE_RENDERING_SUCCESS } from '../modules/palettes/constants';
import { stop as stopAnimation } from '../modules/animation/actions';
import { onClose as closeModal } from '../modules/modal/actions';
import { layersParse12 } from '../modules/layers/util';
import {
  endTour as endTourAction,
  selectStory as selectStoryAction,
  startTour as startTourAction,
} from '../modules/tour/actions';

import ErrorBoundary from './error-boundary';
import history from '../main';
import util from '../util/util';

const { HIDE_TOUR } = safeLocalStorage.keys;

class Tour extends React.Component {
  constructor(props) {
    super(props);
    const { storyOrder, stories, currentStoryId } = props;
    const currentStoryIndex = lodashFindIndex(storyOrder, (id) => id === currentStoryId) || null;
    const currentStory = currentStoryIndex >= 0 ? stories[currentStoryId] : {};
    const steps = lodashGet(currentStory, 'steps') || [];
    this.state = {
      modalStart: !currentStoryId,
      showSupportAlert: currentStoryId && currentStoryIndex === -1,
      showDisabledAlert: false,
      modalInProgress: currentStoryIndex !== -1,
      modalComplete: false,
      currentStep: currentStoryIndex !== -1 ? 1 : 0,
      totalSteps: steps.length,
      metaLoaded: false,
      isLoadingMeta: false,
      currentStory,
      currentStoryId,
      currentStoryIndex,
      tourEnded: false,
    };

    this.toggleModalStart = this.toggleModalStart.bind(this);
    this.toggleModalInProgress = this.toggleModalInProgress.bind(this);
    this.toggleModalComplete = this.toggleModalComplete.bind(this);
    this.incrementStep = this.incrementStep.bind(this);
    this.decreaseStep = this.decreaseStep.bind(this);
    this.endTour = this.endTour.bind(this);
    this.selectTour = this.selectTour.bind(this);
    this.resetTour = this.resetTour.bind(this);
  }

  componentDidMount() {
    const { currentStory, currentStoryIndex, currentStoryId } = this.state;
    // If app loads with tour link at step other than 1, restart that tour story
    if (currentStory && currentStoryIndex !== -1) {
      this.selectTour(null, currentStory, 1, currentStoryId);
    }
  }

  toggleModalStart(e) {
    e.preventDefault();
    const { endTour } = this.props;
    this.setState((prevState) => {
      const toggleModal = !prevState.modalStart;
      // if closing modal
      if (!toggleModal) {
        endTour();
      }
      return {
        modalStart: toggleModal,
      };
    });
  }

  selectTour(e, currentStory, currentStoryIndex, currentStoryId) {
    const {
      config, renderedPalettes, selectTour, processStepLink,
    } = this.props;
    if (e) e.preventDefault();
    this.setState({
      currentStep: 1,
      currentStoryIndex,
      modalStart: false,
      modalInProgress: true,
      metaLoaded: false,
      modalComplete: false,
      currentStory,
      currentStoryId,
      totalSteps: currentStory.steps.length,
    });
    selectTour(currentStoryId);
    this.fetchMetadata(currentStory, 0);
    const storyStep = currentStory.steps[0];
    const transitionParam = getTransitionAttr(storyStep.transition);
    processStepLink(
      currentStoryId,
      1,
      currentStory.steps.length,
      `${storyStep.stepLink}&tr=${currentStoryId}${transitionParam}`,
      config,
      renderedPalettes,
    );
  }

  fetchMetadata(currentStory, stepIndex) {
    const { description } = currentStory.steps[stepIndex];
    const errorMessage = '<p>There was an error loading this description.</p>';
    const uri = `config/metadata/stories/${currentStory.id}/${description}`;
    this.setState({
      isLoadingMeta: true,
      metaLoaded: false,
      description: 'Loading story description...',
    });
    fetch(uri)
      .then((res) => (res.ok ? res.text() : errorMessage))
      .then((body) => {
        const isMetadataSnippet = !body.match(
          /<(head|body|html|style|script)[^>]*>/i,
        );
        const desc = isMetadataSnippet ? body : errorMessage;
        this.setState({
          description: desc,
          isLoadingMeta: false,
          metaLoaded: true,
        });
      })
      .catch((error) => this.setState({ description: error, isLoadingMeta: false }));
  }

  resetTour(e) {
    const { startTour } = this.props;
    if (e) e.preventDefault();
    // Tour startup modal shown by clicking "More Stories" button at end of story
    startTour();
    googleTagManager.pushEvent({
      event: 'tour_more_stories_button',
    });
    this.setState({
      modalInProgress: false,
      modalComplete: false,
      metaLoaded: false,
      modalStart: true,
      currentStep: 0,
    });
  }

  toggleModalInProgress(e) {
    e.preventDefault();
    this.setState((prevState) => ({
      modalInProgress: !prevState.modalInProgress,
    }));
  }

  toggleModalComplete(e) {
    const { currentStoryId } = this.state;
    e.preventDefault();
    this.setState((prevState) => ({
      modalComplete: !prevState.modalComplete,
      currentStep: prevState.totalSteps,
    }));

    // The tour completed modal has been shown (all steps complete)
    googleTagManager.pushEvent({
      event: 'tour_completed',
      story: {
        id: currentStoryId,
      },
    });
  }

  incrementStep(e) {
    const {
      currentStep,
      currentStory,
      totalSteps,
      currentStoryId,
    } = this.state;
    const {
      config, renderedPalettes, processStepLink,
    } = this.props;

    if (currentStep + 1 <= totalSteps) {
      const newStep = currentStep + 1;
      this.fetchMetadata(currentStory, currentStep);
      this.setState({ currentStep: newStep });
      const storyStep = currentStory.steps[newStep - 1];
      const { stepLink } = storyStep;
      const transitionParam = getTransitionAttr(storyStep.transition);
      processStepLink(
        currentStoryId,
        newStep,
        currentStory.steps.length,
        `${stepLink}&tr=${currentStoryId}${transitionParam}`,
        config,
        renderedPalettes,
      );
    }
    if (currentStep + 1 === totalSteps + 1) {
      this.toggleModalInProgress(e);
      this.toggleModalComplete(e);
    }
  }

  decreaseStep(e) {
    const {
      config, renderedPalettes, processStepLink,
    } = this.props;
    const {
      currentStep, currentStory, currentStoryId,
    } = this.state;
    if (currentStep - 1 >= 1) {
      const newStep = currentStep - 1;
      this.fetchMetadata(currentStory, newStep - 1);
      this.setState({ currentStep: newStep });
      const storyStep = currentStory.steps[newStep - 1];
      const { stepLink } = storyStep;
      const transitionParam = getTransitionAttr(storyStep.transition);
      processStepLink(
        currentStoryId,
        newStep,
        currentStory.steps.length,
        `${stepLink}&tr=${currentStoryId}${transitionParam}`,
        config,
        renderedPalettes,
      );
    } else {
      this.setState({
        currentStep: 0,
        modalInProgress: false,
        modalStart: true,
      });
    }
  }

  endTour(e) {
    e.preventDefault();
    const { showDisabledAlert } = this.state;
    const { endTour } = this.props;
    if (!showDisabledAlert) {
      endTour();
    } else {
      this.setState({ tourEnded: true });
    }
  }

  renderSupportAlert() {
    const { endTour } = this.props;
    return (
      <AlertUtil
        isOpen
        timeout={10000}
        onDismiss={endTour}
        iconClassName=" "
        message="Sorry, this tour is no longer supported."
      />
    );
  }

  renderDisableAlert() {
    const { endTour } = this.props;
    return (
      <AlertUtil
        isOpen
        timeout={10000}
        onDismiss={endTour}
        iconClassName=" "
        message="To view these tours again, click the 'Explore Worldview' link in the “i” menu."
      />
    );
  }

  renderTourStart() {
    const {
      stories,
      storyOrder,
      showTourAlert,
      hideTour,
      showTour,
      screenHeight,
    } = this.props;
    const { modalStart } = this.state;
    const checked = !!safeLocalStorage.getItem(HIDE_TOUR);
    return (
      <TourStart
        stories={stories}
        storyOrder={storyOrder}
        modalStart={modalStart}
        height={screenHeight}
        checked={checked}
        toggleModalStart={this.toggleModalStart}
        toggleModalInProgress={this.toggleModalInProgress}
        toggleModalComplete={this.toggleModalComplete}
        selectTour={this.selectTour}
        showTourAlert={showTourAlert}
        hideTour={() => {
          hideTour();
          this.setState({ showDisabledAlert: true });
        }}
        showTour={() => {
          showTour();
          this.setState({ showDisabledAlert: false });
        }}
        endTour={this.endTour}
      />
    );
  }

  renderTourInProgress() {
    const {
      stories,
      showTourAlert,
      config,
    } = this.props;
    const {
      modalInProgress,
      metaLoaded,
      currentStory,
      currentStoryId,
      currentStep,
      totalSteps,
      models,
      currentStoryIndex,
      description,
      isLoadingMeta,
    } = this.state;
    return (
      <TourInProgress
        config={config}
        models={models}
        endTour={this.endTour}
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
        metaLoaded={metaLoaded}
        isLoadingMeta={isLoadingMeta}
        description={description}
      />
    );
  }

  renderTourComplete() {
    const { currentStory, modalComplete } = this.state;
    return (
      <TourComplete
        currentStory={currentStory}
        modalComplete={modalComplete}
        toggleModalStart={this.toggleModalStart}
        toggleModalInProgress={this.toggleModalInProgress}
        toggleModalComplete={this.toggleModalComplete}
        resetTour={this.resetTour}
        endTour={this.endTour}
      />
    );
  }

  render() {
    const {
      stories,
      screenHeight,
      screenWidth,
      isActive,
      endTour,
    } = this.props;
    const {
      currentStory,
      currentStep,
      modalInProgress,
      modalComplete,
      modalStart,
      showSupportAlert,
      showDisabledAlert,
      tourEnded,
    } = this.state;
    if (screenWidth < 740 || screenHeight < 450) {
      endTour();
    }
    if (showDisabledAlert && tourEnded) return this.renderDisableAlert();

    if (showSupportAlert) {
      return this.renderSupportAlert();
    }
    if (!stories && !isActive) {
      return null;
    }
    if (!modalStart && !modalInProgress && !modalComplete) {
      this.setState({ modalStart: true });
    }


    const joyride = (currentStep && currentStory.steps[currentStep - 1].joyride) || {};
    const {
      continuous, spotlightClicks, steps, disableOverlayClose,
    } = joyride;
    const styleOptions = {
      arrowColor: '#ccc',
      backgroundColor: '#ccc',
      beaconSize: 44,
      overlayColor: 'rgba(0, 0, 0, 0.5)',
      primaryColor: '#d54e21',
      spotlightShadow: '0 0 25px rgba(0, 0, 0, 0.75)',
      textColor: '#333',
      width: undefined,
      zIndex: 1050,
    };

    return (
      <ErrorBoundary>
        <div>
          {joyride && (
            <Joyride
              steps={steps}
              continuous={continuous}
              spotlightClicks={spotlightClicks}
              disableOverlayClose={disableOverlayClose || false}
              styles={{ options: styleOptions }}
            />
          )}
          {modalStart
            ? this.renderTourStart()
            : modalInProgress
              ? this.renderTourInProgress()
              : this.renderTourComplete()}
        </div>
      </ErrorBoundary>
    );
  }
}

const mapDispatchToProps = (dispatch) => ({
  processStepLink: (currentStoryId, currentStep, totalSteps, search, config, rendered) => {
    search = search.split('/?').pop();
    const location = update(history.location, {
      search: { $set: search },
    });
    const parameters = util.fromQueryString(search);
    let layers = [];

    // Record selected story's id, current steps, and total steps to analytics
    googleTagManager.pushEvent({
      event: 'tour_selected_story',
      story: {
        id: currentStoryId,
        selectedStep: currentStep,
        totalSteps,
      },
    });
    dispatch(stopAnimation());
    dispatch(closeModal());
    if (
      (parameters.l && hasCustomTypePalette(parameters.l))
      || (parameters.l1 && hasCustomTypePalette(parameters.l1))
    ) {
      layers = layersParse12(parameters.l, config);
      if (parameters.l1 && hasCustomTypePalette(parameters.l1)) {
        layers.push(layersParse12(parameters.l1, config));
      }
      layers = uniqBy(layers, 'id');

      preloadPalettes(layers, rendered, true).then((obj) => {
        dispatch({
          type: BULK_PALETTE_RENDERING_SUCCESS,
          rendered: obj.rendered,
        });
        dispatch({ type: 'REDUX-LOCATION-POP-ACTION', payload: location });
      });
    } else {
      dispatch({ type: 'REDUX-LOCATION-POP-ACTION', payload: location });
    }
  },
  startTour: () => {
    dispatch(startTourAction());
  },
  endTour: () => {
    dispatch(endTourAction());
  },
  showTourAlert: (message) => {
    // dispatch(showAlert(message));
  },
  selectTour: (id) => {
    dispatch(selectStoryAction(id));
  },
});
function mapStateToProps(state) {
  const {
    browser, config, tour, palettes,
  } = state;
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
    showTour,
    renderedPalettes: palettes.rendered,
  };
}

const getTransitionAttr = function(transition) {
  if (!transition) return '';
  const { element, action } = transition;
  if (element === 'animation' && action === 'play') {
    return '&playanim=true';
  }
  return '';
};

const hideTour = function(e) {
  const shouldHideTour = safeLocalStorage.getItem(HIDE_TOUR);
  // Checkbox to "hide tour modal until a new story has been added" has been checked
  googleTagManager.pushEvent({
    event: 'tour_hide_checked',
  });
  if (shouldHideTour) return;
  safeLocalStorage.setItem(HIDE_TOUR, new Date());
};

const showTour = function(e) {
  const shouldHideTour = safeLocalStorage.getItem(HIDE_TOUR);
  // Checkbox to "hide tour modal until a new story has been added" has been checked
  googleTagManager.pushEvent({
    event: 'tour_hide_unchecked',
  });
  if (!shouldHideTour) return;
  safeLocalStorage.removeItem(HIDE_TOUR);
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Tour);
Tour.propTypes = {
  config: PropTypes.object.isRequired,
  hideTour: PropTypes.func.isRequired,
  selectTour: PropTypes.func.isRequired,
  showTour: PropTypes.func.isRequired,
  showTourAlert: PropTypes.func.isRequired,
  stories: PropTypes.object.isRequired,
  storyOrder: PropTypes.array.isRequired,
  currentStoryId: PropTypes.string,
  endTour: PropTypes.func,
  isActive: PropTypes.bool,
  processStepLink: PropTypes.func,
  renderedPalettes: PropTypes.object,
  screenHeight: PropTypes.number,
  screenWidth: PropTypes.number,
  startTour: PropTypes.func,
};

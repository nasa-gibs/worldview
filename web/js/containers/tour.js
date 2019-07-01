import React from 'react';
import PropTypes from 'prop-types';
import TourStart from '../components/tour/modal-tour-start';
import TourInProgress from '../components/tour/modal-tour-in-progress';
import TourComplete from '../components/tour/modal-tour-complete';
import {
  preloadPalettes,
  hasCustomTypePalette
} from '../modules/palettes/util';
import { BULK_PALETTE_RENDERING_SUCCESS } from '../modules/palettes/constants';
import { stop as stopAnimation } from '../modules/animation/actions';
import { connect } from 'react-redux';
import googleTagManager from 'googleTagManager';
import { layersParse12 } from '../modules/layers/util';
import { endTour, selectStory, startTour } from '../modules/tour/actions';
import { findIndex as lodashFindIndex, get as lodashGet, uniqBy } from 'lodash';
import ErrorBoundary from './error-boundary';
import update from 'immutability-helper';
import { history } from '../main';
import util from '../util/util';

const DEFAULT_STATE = {
  modalStart: true,
  modalInProgress: false,
  modalComplete: false,
  currentStep: 0,
  totalSteps: 0,
  metaLoaded: false,
  isLoadingMeta: false,
  currentStory: {},
  currentStoryId: '',
  currentStoryIndex: -1
};
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
      currentStory,
      currentStoryId: props.currentStoryId,
      currentStoryIndex: currentStoryIndex
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
    const storyStep = currentStory.steps[0];
    const transition = getTransitionAttr(
      storyStep.transition.element,
      storyStep.transition.action
    );
    this.props.processStepLink(
      storyStep['stepLink'] + '&tr=' + currentStoryId + transition,
      this.props.config,
      this.props.renderedPalettes
    );
  }
  fetchMetadata(currentStory, stepIndex) {
    var description = currentStory.steps[stepIndex]['description'];
    var { origin, pathname } = window.location;
    var errorMessage = '<p>There was an error loading this description.</p>';
    var uri = `${origin}${pathname}config/metadata/stories/${
      currentStory.id
    }/${description}`;
    this.setState({
      isLoadingMeta: true,
      metaLoaded: false,
      description: 'Loading story description...'
    });
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
    this.props.startTour();
    googleTagManager.pushEvent({
      event: 'tour_more_stories_button'
    });
    this.setState({
      modalInProgress: false,
      modalComplete: false,
      metaLoaded: false,
      modalStart: true,
      currentStep: 0
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
      modalComplete: !this.state.modalComplete,
      currentStep: this.state.totalSteps
    });
    // The tour completed modal has been shown (all steps complete)
    googleTagManager.pushEvent({
      event: 'tour_completed',
      story: {
        id: this.state.currentStoryId
      }
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
      let storyStep = currentStory.steps[newStep - 1];
      const transition = getTransitionAttr(
        storyStep.transition.element,
        storyStep.transition.action
      );
      this.props.processStepLink(
        currentStory.steps[newStep - 1]['stepLink'] +
          '&tr=' +
          currentStoryId +
          transition,
        this.props.config,
        this.props.renderedPalettes
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
      const storyStep = currentStory.steps[newStep - 1];
      const transition = getTransitionAttr(
        storyStep.transition.element,
        storyStep.transition.action
      );
      this.props.processStepLink(
        currentStory.steps[newStep - 1]['stepLink'] +
          '&tr=' +
          currentStoryId +
          transition,
        this.props.config,
        this.props.renderedPalettes
      );
    } else {
      this.setState({
        currentStep: 0,
        modalInProgress: false,
        modalStart: true
      });
    }
  }
  endTour(e) {
    e.preventDefault();
    this.setState(DEFAULT_STATE);
    this.props.endTour();
  }
  render() {
    const {
      stories,
      storyOrder,
      showTourAlert,
      hideTour,
      showTour,
      config,
      screenHeight,
      screenWidth,
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
      if (!modalStart && !modalInProgress && !modalComplete) {
        this.setState({ modalStart: true });
      }
      return (
        <ErrorBoundary>
          <div>
            {modalStart ? (
              <TourStart
                stories={stories}
                storyOrder={storyOrder}
                modalStart={modalStart}
                checked={
                  util.browser.localStorage
                    ? !!localStorage.getItem('hideTour')
                    : false
                }
                toggleModalStart={this.toggleModalStart}
                toggleModalInProgress={this.toggleModalInProgress}
                toggleModalComplete={this.toggleModalComplete}
                selectTour={this.selectTour.bind(this)}
                showTourAlert={showTourAlert}
                hideTour={hideTour}
                showTour={showTour}
                endTour={this.endTour.bind(this)}
              />
            ) : modalInProgress ? (
              <TourInProgress
                config={config}
                models={models}
                endTour={this.endTour.bind(this)}
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
                endTour={this.endTour.bind(this)}
              />
            )}
          </div>
        </ErrorBoundary>
      );
    } else {
      return null;
    }
  }
}

const mapDispatchToProps = dispatch => ({
  processStepLink: (search, config, rendered) => {
    search = search.split('/?').pop();
    const location = update(history.location, {
      search: { $set: search }
    });
    let parameters = util.fromQueryString(search);
    let layers = [];
    dispatch(stopAnimation());
    if (
      (parameters.l && hasCustomTypePalette(parameters.l)) ||
      (parameters.l1 && hasCustomTypePalette(parameters.l1))
    ) {
      layers = layersParse12(parameters.l, config);
      if (parameters.l1 && hasCustomTypePalette(parameters.l1)) {
        layers.push(layersParse12(parameters.l1, config));
      }
      layers = uniqBy(layers, 'id');

      preloadPalettes(layers, rendered, true).then(obj => {
        dispatch({
          type: BULK_PALETTE_RENDERING_SUCCESS,
          rendered: obj.rendered
        });
        dispatch({ type: 'REDUX-LOCATION-POP-ACTION', payload: location });
      });
    } else {
      dispatch({ type: 'REDUX-LOCATION-POP-ACTION', payload: location });
    }
  },
  startTour: () => {
    dispatch(startTour());
  },
  endTour: () => {
    dispatch(endTour());
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
  const { browser, config, tour, palettes } = state;
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
    renderedPalettes: palettes.rendered
  };
}
const getTransitionAttr = function(el, action) {
  if (el === 'animation' && action === 'play') {
    return '&playanim=true';
  }
  return '';
};
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
Tour.propTypes = {
  config: PropTypes.object.isRequired,
  hideTour: PropTypes.func.isRequired,
  selectTour: PropTypes.func.isRequired,
  showTour: PropTypes.func.isRequired,
  showTourAlert: PropTypes.func.isRequired,
  stories: PropTypes.object.isRequired,
  storyOrder: PropTypes.array.isRequired,
  currentStep: PropTypes.number,
  currentStory: PropTypes.object,
  currentStoryId: PropTypes.string,
  endTour: PropTypes.func,
  isActive: PropTypes.bool,
  processStepLink: PropTypes.func,
  renderedPalettes: PropTypes.object,
  screenHeight: PropTypes.number,
  screenWidth: PropTypes.number,
  startTour: PropTypes.func,
  totalSteps: PropTypes.number
};

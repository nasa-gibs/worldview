import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import update from 'immutability-helper';
import {
  findIndex as lodashFindIndex,
  get as lodashGet,
  uniqBy,
  isEmpty as lodashIsEmpty,
} from 'lodash';
import googleTagManager from 'googleTagManager';

import JoyrideWrapper from '../components/tour/joyride-wrapper';
import TourStart from '../components/tour/modal-tour-start';
import TourInProgress from '../components/tour/modal-tour-in-progress';
import TourComplete from '../components/tour/modal-tour-complete';
import AlertUtil from '../components/util/alert';
import safeLocalStorage from '../util/local-storage';

import {
  preloadPalettes,
  hasCustomTypePalette,
} from '../modules/palettes/util';
import {
  clearCustoms,
} from '../modules/palettes/actions';
import {
  BULK_PALETTE_RENDERING_SUCCESS,
  BULK_PALETTE_PRELOADING_SUCCESS,
} from '../modules/palettes/constants';
import { stop as stopAnimation } from '../modules/animation/actions';
import { onClose as closeModal } from '../modules/modal/actions';
import { LOCATION_POP_ACTION } from '../redux-location-state-customs';
import { layersParse12 } from '../modules/layers/util';
import {
  endTour as endTourAction,
  selectStory as selectStoryAction,
  startTour as startTourAction,
} from '../modules/tour/actions';
import { resetProductPickerState as resetProductPickerStateAction } from '../modules/product-picker/actions';
import { changeTab as changeTabAction } from '../modules/sidebar/actions';
import ErrorBoundary from './error-boundary';
import history from '../main';
import util from '../util/util';
import { promiseImageryForTour } from '../modules/map/util';

const { HIDE_TOUR } = safeLocalStorage.keys;

const getTransitionAttr = function(transition) {
  if (!transition) return '';
  const { element, action } = transition;
  if (element === 'animation' && action === 'play') {
    return '&playanim=true';
  }
  return '';
};

const prepareLayersList = function(layersString, config) {
  let layers;
  layers = layersParse12(layersString, config);
  layers = uniqBy(layers, 'id');
  layers = layers.filter((layer) => !layer.custom && !layer.disabled);
  return layers;
};

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
    this.showTour = this.showTour.bind(this);
    this.hideTour = this.hideTour.bind(this);
    this.selectTour = this.selectTour.bind(this);
    this.resetTour = this.resetTour.bind(this);
  }

  componentDidMount() {
    const {
      currentStory, currentStoryIndex, currentStoryId, modalStart, modalInProgress, modalComplete,
    } = this.state;
    // If app loads with tour link at step other than 1, restart that tour story
    if (currentStory && currentStoryIndex !== -1) {
      this.selectTour(null, currentStory, 1, currentStoryId);
    }

    if (!modalStart && !modalInProgress && !modalComplete) {
      this.setState({ modalStart: true });
    }
  }

  hideTour() {
    const shouldHideTour = safeLocalStorage.getItem(HIDE_TOUR);
    googleTagManager.pushEvent({
      event: 'tour_hide_checked',
    });
    this.setState({ showDisabledAlert: true });
    if (shouldHideTour) return;
    safeLocalStorage.setItem(HIDE_TOUR, new Date());
  }

  showTour() {
    const shouldHideTour = safeLocalStorage.getItem(HIDE_TOUR);
    googleTagManager.pushEvent({
      event: 'tour_hide_unchecked',
    });
    this.setState({ showDisabledAlert: false });
    if (!shouldHideTour) return;
    safeLocalStorage.removeItem(HIDE_TOUR);
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
      config, renderedPalettes, selectTour, processStepLink, isKioskModeActive, isEmbedModeActive, preProcessStepLink, promiseImageryForTour,
    } = this.props;
    if (e) e.preventDefault();
    const kioskParam = this.getKioskParam(isKioskModeActive);
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
      `${storyStep.stepLink}&tr=${currentStoryId}${transitionParam}${kioskParam}&em=${isEmbedModeActive}`,
      config,
      renderedPalettes,
    );
    if (currentStory.steps.length > 1) {
      preProcessStepLink(
        `${currentStory.steps[1].stepLink}&tr=${currentStoryId}${transitionParam}${kioskParam}&em=${isEmbedModeActive}`,
        config,
        promiseImageryForTour,
      );
    }
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
    if (!e) return;
    e.preventDefault();
    this.setState((prevState) => ({
      modalInProgress: !prevState.modalInProgress,
    }));
  }

  toggleModalComplete(e) {
    const { currentStoryId } = this.state;
    if (!e) return;
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
      config, renderedPalettes, processStepLink, isKioskModeActive, activeTab, changeTab, isEmbedModeActive, preProcessStepLink, promiseImageryForTour,
    } = this.props;
    const kioskParam = this.getKioskParam(isKioskModeActive);

    if (activeTab === 'events') changeTab('layers');

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
        `${stepLink}&tr=${currentStoryId}${transitionParam}${kioskParam}&em=${isEmbedModeActive}`,
        config,
        renderedPalettes,
      );
      if (currentStep + 2 <= totalSteps) {
        preProcessStepLink(
          `${currentStory.steps[newStep].stepLink}&tr=${currentStoryId}${transitionParam}${kioskParam}&em=${isEmbedModeActive}`,
          config,
          promiseImageryForTour,
        );
      }
    }
    if (currentStep + 1 === totalSteps + 1) {
      this.toggleModalInProgress(e);
      this.toggleModalComplete(e);
    }
  }

  getKioskParam(isKioskModeActive) {
    return isKioskModeActive ? '&kiosk=true' : '';
  }

  decreaseStep(e) {
    const {
      config, renderedPalettes, processStepLink, isKioskModeActive, activeTab, changeTab, isEmbedModeActive,
    } = this.props;
    const {
      currentStep, currentStory, currentStoryId,
    } = this.state;
    const kioskParam = this.getKioskParam(isKioskModeActive);

    if (activeTab === 'events') changeTab('layers');

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
        `${stepLink}&tr=${currentStoryId}${transitionParam}${kioskParam}&em=${isEmbedModeActive}`,
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
        message="To view these tours again, click the 'Explore @NAME@' link in the “i” menu."
      />
    );
  }

  renderTourStart() {
    const {
      stories,
      storyOrder,
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
        hideTour={this.hideTour}
        showTour={this.showTour}
        endTour={this.endTour}
      />
    );
  }

  renderTourInProgress() {
    const {
      stories,
      config,
      isKioskModeActive,
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
        metaLoaded={metaLoaded}
        isLoadingMeta={isLoadingMeta}
        description={description}
        isKioskModeActive={isKioskModeActive}
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
      map,
      stories,
      isActive,
      resetProductPicker,
    } = this.props;
    const {
      currentStory,
      currentStep,
      modalInProgress,
      modalStart,
      showSupportAlert,
      showDisabledAlert,
      tourEnded,
    } = this.state;
    if (showDisabledAlert && tourEnded) return this.renderDisableAlert();

    if (showSupportAlert) {
      return this.renderSupportAlert();
    }
    if (!stories && !isActive) {
      return null;
    }

    return (
      <ErrorBoundary>
        <div>
          {currentStory && currentStory.steps && currentStep && (
            <JoyrideWrapper
              currentTourStep={currentStep}
              tourSteps={currentStory.steps}
              map={map.ui.selected}
              proj={map.ui.selected && map.ui.selected.proj}
              resetProductPicker={resetProductPicker}
              tourComplete={!modalInProgress}
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
    if (!lodashIsEmpty(rendered)) {
      dispatch(clearCustoms());
    }
    if (
      ((parameters.l && hasCustomTypePalette(parameters.l))
      || (parameters.l1 && hasCustomTypePalette(parameters.l1)))
      && !Object.keys(rendered).includes('OPERA_Dynamic_Surface_Water_Extent')
    ) {
      layers = layersParse12(parameters.l, config);
      if (parameters.l1 && hasCustomTypePalette(parameters.l1)) {
        layers.push(...layersParse12(parameters.l1, config));
      }
      layers = uniqBy(layers, 'id');


      preloadPalettes(layers, rendered, true).then((obj) => {
        dispatch({
          type: BULK_PALETTE_RENDERING_SUCCESS,
          rendered: obj.rendered,
        });
        dispatch({ type: LOCATION_POP_ACTION, payload: location });
      });
    } else {
      dispatch({ type: LOCATION_POP_ACTION, payload: location });
    }
  },
  preProcessStepLink: async (search, config, promiseImageryForTour) => {
    search = search.split('/?').pop();
    const parameters = util.fromQueryString(search);
    let layersA = [];
    let layersB = [];
    const promisesParams = [];

    if (parameters.l) {
      layersA = prepareLayersList(parameters.l, config);
      promisesParams.push({ layers: layersA, dateString: parameters.t });
    }
    if (parameters.l1) {
      layersB = prepareLayersList(parameters.l1, config);
      promisesParams.push({ layers: layersB, dateString: parameters.t1, activeString: 'activeB' });
    }
    preloadPalettes([...layersA, ...layersB], {}, false).then(async (obj) => {
      await dispatch({
        type: BULK_PALETTE_PRELOADING_SUCCESS,
        tourStoryPalettes: obj.rendered,
      });
      const promises = [];
      promisesParams.forEach((set) => {
        promises.push(promiseImageryForTour(set.layers, set.dateString, set.activeString));
      });
      await Promise.all(promises);
    });
  },
  startTour: () => {
    dispatch(startTourAction());
  },
  endTour: () => {
    dispatch(endTourAction());
  },
  selectTour: (id) => {
    dispatch(selectStoryAction(id));
  },
  resetProductPicker: () => {
    dispatch(resetProductPickerStateAction());
  },
  changeTab: (str) => {
    dispatch(changeTabAction(str));
  },
});

const mapStateToProps = (state) => {
  const {
    screenSize, config, tour, palettes, models, compare, map, sidebar,
  } = state;
  const { screenWidth, screenHeight } = screenSize;
  const { isKioskModeActive } = state.ui;
  const { isEmbedModeActive } = state.embed;
  return {
    config,
    isActive: tour.active,
    isEmbedModeActive,
    isKioskModeActive,
    map,
    models,
    compareState: compare,
    stories: config.stories,
    storyOrder: config.storyOrder,
    currentStoryId: tour.selected,
    screenWidth,
    screenHeight,
    renderedPalettes: palettes.rendered,
    activeTab: sidebar.activeTab,
    promiseImageryForTour: (layers, dateString, activeString) => promiseImageryForTour(state, layers, dateString, activeString),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Tour);

Tour.propTypes = {
  activeTab: PropTypes.string,
  changeTab: PropTypes.func,
  config: PropTypes.object.isRequired,
  map: PropTypes.object,
  selectTour: PropTypes.func.isRequired,
  stories: PropTypes.object.isRequired,
  storyOrder: PropTypes.array.isRequired,
  currentStoryId: PropTypes.string,
  endTour: PropTypes.func,
  isActive: PropTypes.bool,
  isKioskModeActive: PropTypes.bool,
  processStepLink: PropTypes.func,
  preProcessStepLink: PropTypes.func,
  renderedPalettes: PropTypes.object,
  resetProductPicker: PropTypes.func,
  screenHeight: PropTypes.number,
  screenWidth: PropTypes.number,
  startTour: PropTypes.func,
};

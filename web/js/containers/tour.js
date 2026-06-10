import { useState, useEffect, useRef } from 'react';
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
import usePrevious from '../util/customHooks';

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
import { toggleOverlayGroups as toggleOverlayGroupsAction } from '../modules/layers/actions';
import ErrorBoundary from './error-boundary';
import history from '../main';
import util from '../util/util';
import { promiseImageryForTour as promiseImageryForTourUtil } from '../modules/map/util';

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

const getKioskParam = (isKioskModeActive) => (isKioskModeActive ? '&kiosk=true' : '');

function Tour(props) {
  const {
    config,
    map,
    stories,
    storyOrder,
    currentStoryId: currentStoryIdProp,
    isActive,
    isEmbedModeActive,
    isKioskModeActive,
    renderedPalettes,
    screenHeight,
    activeTab,
    groupOverlays,
    promiseImageryForTour,
    endTour: endTourProp,
    startTour: startTourProp,
    selectTour: selectTourProp,
    processStepLink,
    preProcessStepLink,
    resetProductPicker,
    changeTab,
    toggleOverlayGroups,
  } = props;

  // Compute initial values (same as constructor logic)
  const [initialStoryIndex] = useState(
    () => lodashFindIndex(storyOrder, (id) => id === currentStoryIdProp) || null,
  );
  const [initialStory] = useState(
    () => (initialStoryIndex >= 0 ? stories[currentStoryIdProp] : {}),
  );
  const [initialSteps] = useState(
    () => lodashGet(initialStory, 'steps') || [],
  );

  const [modalStart, setModalStart] = useState(!currentStoryIdProp);
  const [showSupportAlert] = useState(currentStoryIdProp && initialStoryIndex === -1);
  const [showDisabledAlert, setShowDisabledAlert] = useState(false);
  const [modalInProgress, setModalInProgress] = useState(initialStoryIndex !== -1);
  const [modalComplete, setModalComplete] = useState(false);
  const [currentStep, setCurrentStep] = useState(initialStoryIndex !== -1 ? 1 : 0);
  const [totalSteps, setTotalSteps] = useState(initialSteps.length);
  const [metaLoaded, setMetaLoaded] = useState(false);
  const [isLoadingMeta, setIsLoadingMeta] = useState(false);
  const [currentStory, setCurrentStory] = useState(initialStory);
  const [currentStoryId, setCurrentStoryId] = useState(currentStoryIdProp);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
  const [tourEnded, setTourEnded] = useState(false);
  const [description, setDescription] = useState('');

  const groupOverlaysBeforeTourRef = useRef(null);
  const isActiveRef = useRef(isActive);
  const prevIsActive = usePrevious(isActive);

  // Keep isActiveRef in sync for unmount cleanup
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  const restoreGroupOverlaysPreference = () => {
    const previousPreference = groupOverlaysBeforeTourRef.current;
    groupOverlaysBeforeTourRef.current = null;

    if (previousPreference === null || previousPreference === undefined) return;
    if (previousPreference !== groupOverlays) {
      toggleOverlayGroups();
    }
  };

  const fetchMetadata = (story, stepIndex) => {
    const { description: descFile } = story.steps[stepIndex];
    const errorMessage = '<p>There was an error loading this description.</p>';
    const uri = `config/metadata/stories/${story.id}/${descFile}`;
    setIsLoadingMeta(true);
    setMetaLoaded(false);
    setDescription('Loading story description...');
    fetch(uri)
      .then((res) => (res.ok ? res.text() : errorMessage))
      .then((body) => {
        const isMetadataSnippet = !body.match(
          /<(head|body|html|style|script)[^>]*>/i,
        );
        const desc = isMetadataSnippet ? body : errorMessage;
        setDescription(desc);
        setIsLoadingMeta(false);
        setMetaLoaded(true);
      })
      .catch((error) => {
        setDescription(error);
        setIsLoadingMeta(false);
      });
  };

  const selectTourHandler = (e, story, storyIndex, storyId) => {
    if (e) e.preventDefault();
    const kioskParam = getKioskParam(isKioskModeActive);
    setCurrentStep(1);
    setCurrentStoryIndex(storyIndex);
    setModalStart(false);
    setModalInProgress(true);
    setMetaLoaded(false);
    setModalComplete(false);
    setCurrentStory(story);
    setCurrentStoryId(storyId);
    setTotalSteps(story.steps.length);
    selectTourProp(storyId);
    fetchMetadata(story, 0);
    const storyStep = story.steps[0];
    const transitionParam = getTransitionAttr(storyStep.transition);
    processStepLink(
      storyId,
      1,
      story.steps.length,
      `${storyStep.stepLink}&tr=${storyId}${transitionParam}${kioskParam}&em=${isEmbedModeActive}`,
      config,
      renderedPalettes,
    );
    if (story.steps.length > 1) {
      preProcessStepLink(
        `${story.steps[1].stepLink}&tr=${storyId}${transitionParam}${kioskParam}&em=${isEmbedModeActive}`,
        config,
        promiseImageryForTour,
      );
    }
  };

  // componentDidMount
  useEffect(() => {
    if (isActive && groupOverlaysBeforeTourRef.current === null) {
      groupOverlaysBeforeTourRef.current = safeLocalStorage.getItem(safeLocalStorage.keys.GROUP_OVERLAYS) !== 'disabled';
    }

    if (initialStory && initialStoryIndex !== -1) {
      selectTourHandler(null, initialStory, 1, currentStoryIdProp);
    }

    if (!modalStart && !modalInProgress && !modalComplete) {
      setModalStart(true);
    }

    // componentWillUnmount
    return () => {
      if (isActiveRef.current) {
        restoreGroupOverlaysPreference();
      }
    };
  }, []);

  // componentDidUpdate tracking isActive
  useEffect(() => {
    if (prevIsActive === undefined) return; // skip initial render
    if (!prevIsActive && isActive) {
      groupOverlaysBeforeTourRef.current = safeLocalStorage.getItem(safeLocalStorage.keys.GROUP_OVERLAYS) !== 'disabled';
    }
    if (prevIsActive && !isActive) {
      restoreGroupOverlaysPreference();
    }
  }, [isActive]);

  const hideTour = () => {
    const shouldHideTour = safeLocalStorage.getItem(HIDE_TOUR);
    googleTagManager.pushEvent({
      event: 'tour_hide_checked',
    });
    setShowDisabledAlert(true);
    if (shouldHideTour) return;
    safeLocalStorage.setItem(HIDE_TOUR, new Date());
  };

  const showTour = () => {
    const shouldHideTour = safeLocalStorage.getItem(HIDE_TOUR);
    googleTagManager.pushEvent({
      event: 'tour_hide_unchecked',
    });
    setShowDisabledAlert(false);
    if (!shouldHideTour) return;
    safeLocalStorage.removeItem(HIDE_TOUR);
  };

  const toggleModalStart = (e) => {
    e.preventDefault();
    setModalStart((prev) => {
      const toggleModal = !prev;
      if (!toggleModal) {
        endTourProp();
      }
      return toggleModal;
    });
  };

  const resetTour = (e) => {
    if (e) e.preventDefault();
    startTourProp();
    googleTagManager.pushEvent({
      event: 'tour_more_stories_button',
    });
    setModalInProgress(false);
    setModalComplete(false);
    setMetaLoaded(false);
    setModalStart(true);
    setCurrentStep(0);
  };

  const toggleModalInProgress = (e) => {
    if (!e) return;
    e.preventDefault();
    setModalInProgress((prev) => !prev);
  };

  const toggleModalComplete = (e) => {
    if (!e) return;
    e.preventDefault();
    setModalComplete((prev) => !prev);
    setCurrentStep(totalSteps);

    googleTagManager.pushEvent({
      event: 'tour_completed',
      story: {
        id: currentStoryId,
      },
    });
  };

  const incrementStep = (e) => {
    const kioskParam = getKioskParam(isKioskModeActive);

    if (activeTab === 'events') changeTab('layers');

    if (currentStep + 1 <= totalSteps) {
      const newStep = currentStep + 1;
      fetchMetadata(currentStory, currentStep);
      setCurrentStep(newStep);
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
      toggleModalInProgress(e);
      toggleModalComplete(e);
    }
  };

  const decreaseStep = (e) => {
    const kioskParam = getKioskParam(isKioskModeActive);

    if (activeTab === 'events') changeTab('layers');

    if (currentStep - 1 >= 1) {
      const newStep = currentStep - 1;
      fetchMetadata(currentStory, newStep - 1);
      setCurrentStep(newStep);
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
      setCurrentStep(0);
      setModalInProgress(false);
      setModalStart(true);
    }
  };

  const endTour = (e) => {
    e.preventDefault();
    if (!showDisabledAlert) {
      endTourProp();
    } else {
      setTourEnded(true);
    }
  };

  // Early returns for alert states
  if (showDisabledAlert && tourEnded) {
    return (
      <AlertUtil
        isOpen
        timeout={10000}
        onDismiss={endTourProp}
        message="To view these tours again, click the 'Explore @NAME@' link in the \u201ci\u201d menu."
      />
    );
  }

  if (showSupportAlert) {
    return (
      <AlertUtil
        isOpen
        timeout={10000}
        onDismiss={endTourProp}
        message="Sorry, this tour is no longer supported."
      />
    );
  }

  if (!stories && !isActive) {
    return null;
  }

  const checked = !!safeLocalStorage.getItem(HIDE_TOUR);

  const tourStartContent = (
    <TourStart
      stories={stories}
      storyOrder={storyOrder}
      modalStart={modalStart}
      height={screenHeight}
      checked={checked}
      toggleModalStart={toggleModalStart}
      toggleModalInProgress={toggleModalInProgress}
      toggleModalComplete={toggleModalComplete}
      selectTour={selectTourHandler}
      hideTour={hideTour}
      showTour={showTour}
      endTour={endTour}
    />
  );

  const tourInProgressContent = (
    <TourInProgress
      config={config}
      endTour={endTour}
      modalInProgress={modalInProgress}
      toggleModalStart={toggleModalStart}
      toggleModalInProgress={toggleModalInProgress}
      toggleModalComplete={toggleModalComplete}
      currentStep={currentStep}
      totalSteps={totalSteps}
      currentStoryIndex={currentStoryIndex}
      incrementStep={incrementStep}
      decreaseStep={decreaseStep}
      stories={stories}
      currentStoryId={currentStoryId}
      currentStory={currentStory}
      metaLoaded={metaLoaded}
      isLoadingMeta={isLoadingMeta}
      description={description}
      isKioskModeActive={isKioskModeActive}
    />
  );

  const tourCompleteContent = (
    <TourComplete
      currentStory={currentStory}
      modalComplete={modalComplete}
      toggleModalStart={toggleModalStart}
      toggleModalInProgress={toggleModalInProgress}
      toggleModalComplete={toggleModalComplete}
      resetTour={resetTour}
      endTour={endTour}
    />
  );

  const renderModalInProgress = modalInProgress
    ? tourInProgressContent
    : tourCompleteContent;

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
          ? tourStartContent
          : renderModalInProgress}
      </div>
    </ErrorBoundary>
  );
}

const mapDispatchToProps = (dispatch) => ({
  processStepLink: (currentStoryId, currentStep, totalSteps, s, config, rendered) => {
    const search = s.split('/?').pop();
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
      ((parameters.l && hasCustomTypePalette(parameters.l)) ||
      (parameters.l1 && hasCustomTypePalette(parameters.l1))) &&
      !Object.keys(rendered).includes('OPERA_Dynamic_Surface_Water_Extent')
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
  preProcessStepLink: async (s, config, promiseImageryForTour) => {
    const search = s.split('/?').pop();
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
  toggleOverlayGroups: () => {
    dispatch(toggleOverlayGroupsAction());
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
    groupOverlays: state.layers?.[compare.activeString]?.groupOverlays,
    promiseImageryForTour: (
      layers,
      dateString,
      activeString,
    ) => promiseImageryForTourUtil(state, layers, dateString, activeString),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Tour);

Tour.propTypes = {
  activeTab: PropTypes.string,
  changeTab: PropTypes.func,
  config: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  map: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  selectTour: PropTypes.func.isRequired,
  stories: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  storyOrder: PropTypes.oneOfType([PropTypes.array, PropTypes.oneOf(['null'])]),
  currentStoryId: PropTypes.string,
  endTour: PropTypes.func,
  isActive: PropTypes.bool,
  isEmbedModeActive: PropTypes.bool,
  isKioskModeActive: PropTypes.bool,
  processStepLink: PropTypes.func,
  promiseImageryForTour: PropTypes.func,
  preProcessStepLink: PropTypes.func,
  renderedPalettes: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  resetProductPicker: PropTypes.func,
  screenHeight: PropTypes.number,
  startTour: PropTypes.func,
  groupOverlays: PropTypes.bool,
  toggleOverlayGroups: PropTypes.func,
};

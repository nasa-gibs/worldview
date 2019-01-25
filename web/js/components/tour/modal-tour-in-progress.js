import React from 'react';
import PropTypes from 'prop-types';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import Steps from './widget-steps';
import util from '../../util/util';
import lodashDebounce from 'lodash/debounce';
import { getCompareObjects } from '../../compare/util';

import { parse as dateParser } from '../../date/date';
import { parse as layerParser } from '../../layers/layers';
import { mapParser } from '../../map/map';
import { parse as animationParser } from '../../animation/anim';
import palettes from '../../palettes/palettes';
import { dataParser } from '../../data/data';
import { parse as projectionParser } from '../../projection/projection';

import googleTagManager from 'googleTagManager';

class ModalInProgress extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      metaLoaded: false,
      isLoading: false,
      error: null
    };
    this.fetchMetadata = this.fetchMetadata.bind(this);
    this.processLink = this.processLink.bind(this);
    this.loadLink = lodashDebounce(this.loadLink.bind(this), 2000);
    this.setUI = lodashDebounce(this.setUI.bind(this), 300);
    this.processActions = this.processActions.bind(this);
  }

  componentDidUpdate(prevProps) {
    var currentStory = this.props.currentStory;
    var currentStepIndex = this.props.currentStep - 1;
    var modalStarted = this.props.modalInProgress;
    var models = this.props.models;
    var ui = this.props.ui;

    // When restarting tour, reset the MetaLoaded prop
    if (this.props.restartTour) {
      this.props.toggleRestartTour();
    }

    // Scroll content div to the top when step updates
    if (this.refs.stepContent) this.refs.stepContent.parentNode.scrollTop = 0;

    // Fetch meta and load link on first step if not already loaded
    if (modalStarted && !this.props.metaLoaded) {
      // If the comparison mode is open, close it before starting
      if (models.compare.active === true) {
        models.compare.toggle();
        models.compare.load({});
        ui.sidebar.reactComponent.setState({
          isCompareMode: false
        });
        models.compare.active = false;
      }

      this.props.toggleMetaLoaded();
      this.fetchMetadata(currentStory, 0);
      this.processLink(currentStory, currentStepIndex);
    } else {
      if (prevProps.currentStep !== this.props.currentStep) {
        let prevStepIndex = prevProps.currentStep - 1;

        // Reset the prevStepIndex when a new tour is selected
        if (currentStepIndex === 0 && prevStepIndex !== 1) prevStepIndex = null;
        this.fetchMetadata(currentStory, currentStepIndex);
        this.processLink(currentStory, currentStepIndex, prevStepIndex);
      }
    }
  }

  fetchMetadata(currentStory, stepIndex) {
    var description = currentStory.steps[stepIndex]['description'];
    var { origin, pathname } = window.location;
    var currentStoryId = this.props.currentStory['id'];
    var errorMessage = '<p>There was an error loading this description.</p>';
    var uri = `${origin}${pathname}config/metadata/stories/${currentStoryId}/${description}`;

    this.setState({ isLoading: true });
    fetch(uri)
      .then(res => (res.ok ? res.text() : errorMessage))
      .then(body => {
        let isMetadataSnippet = !body.match(
          /<(head|body|html|style|script)[^>]*>/i
        );
        let description = isMetadataSnippet ? body : errorMessage;
        this.setState({ description: description, isLoading: false });
      }
      ).catch(error => this.setState({ error, isLoading: false }));
  }

  processLink(currentStory, currentStepIndex, prevStepIndex) {
    var currentState, currentStepLink, stepTransition, prevState, prevStepLink;
    var errors = [];
    var config = this.props.config;
    var models = this.props.models;

    // When the link is loaded properly, save the tour to URL
    models.tour.active = true;
    models.tour.select(this.props.currentStoryId);

    googleTagManager.pushEvent({
      'event': 'tour_selected_story',
      'story': {
        'id': this.props.currentStoryId,
        'selectedStep': this.props.currentStep,
        'totalSteps': this.props.totalSteps
      }
    });

    // Get current step link + current tour parameter
    currentStepLink = currentStory.steps[currentStepIndex]['stepLink'] +
      '&tr=' + this.props.currentStoryId;

    // Get current step transistion
    stepTransition = currentStory.steps[currentStepIndex]['transition'];

    // Get previous step link (if there is a previous step)
    if (prevStepIndex !== null && !isNaN(prevStepIndex)) {
      prevStepLink = currentStory.steps[prevStepIndex]['stepLink'];
    }

    // TESTING HERE:
    // currentStepLink =
    // 'p=geographic' +
    // '&l=VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor(hidden),MODIS_Combined_Value_Added_AOD(opacity=0.33,palette=blue_4,min=0.25,0.255,max=0.52,0.525,squash),MODIS_Terra_Aerosol_Optical_Depth_3km(hidden),Reference_Labels(hidden),Reference_Features(hidden),Coastlines' +
    // '&l1=VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),BlueMarble_NextGeneration,IMERG_Snow_Rate,IMERG_Rain_Rate' +
    // '&time=2018-09-06-T00%3A00%3A00Z' +
    // '&t1=2018-03-06-T00%3A00%3A00Z' +
    // '&z=2' +
    // '&v=-202.1385353269304,-23.272676762951903,67.8614646730696,108.6335732370481' +
    // '&download=MOD04_3K' +
    // '&e=true' +
    // '&ab=on' +
    // '&as=2018-03-26T00%3A00%3A00Z' +
    // '&ae=2018-09-26T00%3A00%3A00Z' +
    // '&av=8' +
    // '&al=false' +
    // '&ca=true' +
    // '&cm=swipe' +
    // '&cv=80' +
    // '&tr=' + this.props.currentStoryId;

    // Remove base URL from step links string
    currentStepLink = currentStepLink.split('/?').pop();
    prevStepLink = currentStepLink.split('/?').pop();

    // Create current and previous states from step links
    currentState = util.fromQueryString(currentStepLink);
    prevState = util.fromQueryString(prevStepLink);

    // Parse the current state
    projectionParser(currentState, errors, config);
    layerParser(currentState, errors, config);
    dateParser(currentState, errors, config);
    mapParser(currentState, errors, config);
    palettes.parse(currentState, errors, config);
    if (config.features.dataDownload) {
      dataParser(currentState, errors, config);
    }
    if (config.features.animation) {
      animationParser(currentState, errors, config);
    }

    // Parse the previous state
    projectionParser(prevState, errors, config);
    layerParser(prevState, errors, config);
    dateParser(prevState, errors, config);
    mapParser(prevState, errors, config);
    palettes.parse(prevState, errors, config);
    if (config.features.dataDownload) {
      dataParser(prevState, errors, config);
    }
    if (config.features.animation) {
      animationParser(prevState, errors, config);
    }

    // Pass current step query string to the browser url
    if (util.browser.history) {
      window.history.pushState(
        '',
        '@OFFICIAL_NAME@',
        '?' + currentStepLink
      );
    }

    // Layers have not yet loaded
    models.layers.loaded = false;

    // Load palette requirements
    palettes.requirements(currentState, config);

    // Ensure selectedB is set in the models before loading link
    if (currentState.t1) {
      let selectedB = util.toISOStringSeconds(currentState.t1);
      selectedB = new Date(selectedB);
      models.date.selectedB = selectedB;
    }

    // Load the step link
    // A timeout is added so that the palette data can load properly
    this.loadLink(currentState, stepTransition, prevState, currentStepIndex);
  }

  loadLink(currentState, stepTransition, prevState, currentStepIndex) {
    var errors = [];
    var models = this.props.models;
    var ui = this.props.ui;
    var rotation = 0;

    // Close the comparison mode if there is no comparison mode in the step link
    if ((!currentState.ca || !currentState.cm) && models.compare.active === true) {
      models.compare.toggle();
      models.compare.load({});
      ui.sidebar.reactComponent.setState({
        isCompareMode: false
      });
      models.compare.active = false;
    }

    // Set rotation value if it exists
    if (currentState.p === 'arctic' || currentState.p === 'antarctic') {
      if (!isNaN(currentState.r)) {
        rotation = currentState.r * (Math.PI / 180.0);
      }
    }

    // LOAD: Comparison
    models.compare.load(currentState, errors);

    // LOAD: Projection
    models.proj.load(currentState, errors);

    // LOAD: Layers
    models.layers.load(currentState, errors);

    // LOAD: Palettes
    models.palettes.load(currentState, errors);

    // LOAD: Date(s)
    models.date.load(currentState, errors);

    // LOAD: Animation
    if (!currentState.ca || !currentState.cm) {
      models.anim.load(currentState, errors);
    }

    // LOAD: Events
    // Note: Can't simple load from model since these check for startup events
    if (currentState.e && (!currentState.ca || !currentState.cm)) {
      let values = currentState.e.split(',');
      let id = values[0] || '';
      let date = values[1] || '';
      id = id.match(/^EONET_[0-9]+/i) ? values[0] : null;
      date = date.match(/\d{4}-\d{2}-\d{2}/) ? values[1] : null;
      models.naturalEvents.events.trigger('activate');
      if (id) {
        ui.naturalEvents.selectEvent(id, date, rotation);
      }
    }

    // LOAD: Data Download
    if (currentState.download && (!currentState.ca || !currentState.cm)) {
      models.anim.load(currentState, errors);
    }

    this.setUI(currentState, stepTransition, prevState, currentStepIndex);
  }

  setUI(currentState, stepTransition, prevState, currentStepIndex) {
    var models = this.props.models;
    var ui = this.props.ui;
    var rotation = 0;

    // SET UI: Select sidebar tab based on what has been loaded
    if (currentState.e && (!currentState.ca || !currentState.cm)) {
      ui.sidebar.selectTab('events');
    } else if (currentState.download && (!currentState.ca || !currentState.cm)) {
      ui.sidebar.selectTab('download');
    } else {
      ui.sidebar.selectTab('layers');
    }

    // Set rotation value if it exists
    if (currentState.p === 'arctic' || currentState.p === 'antarctic') {
      if (!isNaN(currentState.r)) {
        rotation = currentState.r * (Math.PI / 180.0);
      }
    }

    // SET UI: Comparison Mode
    if (currentState.ca || currentState.cm) {
      var compareObj = getCompareObjects(models);

      models.compare.events.trigger('toggle');
      models.compare.events.trigger('toggle-state');
      models.date.events.trigger('state-update');

      ui.sidebar.reactComponent.setState({
        isCompareMode: true,
        firstDateObject: compareObj.a,
        secondDateObject: compareObj.b,
        isCompareA: models.compare && models.compare.isCompareA,
        comparisonType: currentState.cm
      });
    }

    // SET UI: Timeline Zoom Level
    if (currentState.z) {
      let zoomLevel = Number(currentState.z);
      ui.timeline.config.zoom(zoomLevel);
    }

    // SET UI: Animation
    if (!currentState.ca || !currentState.cm) {
      if (currentState.al === 'true') {
        ui.anim.widget.reactComponent.setState({ looping: true });
        models.anim.rangeState.loop = true;
      } else {
        ui.anim.widget.reactComponent.setState({ looping: false });
        models.anim.rangeState.loop = false;
      }
      if (currentState.av) ui.anim.widget.reactComponent.setState({ value: Number(currentState.av) });
      if (currentState.ab === 'on' && !document.getElementById('timeline-footer').classList.contains('wv-anim-active')) {
        models.anim.deactivate();
        ui.anim.widget.toggleAnimationWidget();
      } else if ((currentState.ab === 'off' || !currentState.ab) && document.getElementById('timeline-footer').classList.contains('wv-anim-active')) {
        models.anim.activate();
        ui.anim.widget.toggleAnimationWidget();
      }
    }

    // SET UI: Map Zoom & View & Rotation (Animated)
    if (currentState.v) {
      // Animate to extent, zoom & rotate:
      let duration = 0;
      let extent = currentState.v;
      let coordinateX = extent[0] + (extent[2] - extent[0]) / 2;
      let coordinateY = extent[1] + (extent[3] - extent[1]) / 2;
      let coordinates = [coordinateX, coordinateY];
      let resolution = ui.map.selected.getView().getResolutionForExtent(extent);
      // Don't animate when projection changes
      if (prevState.p === currentState.p || currentStepIndex === 0) duration = 4000;
      // Don't animate when an event is selected (Event selection already animates)
      if (!currentState.e) {
        ui.map.selected.getView().animate({
          center: coordinates,
          duration: duration,
          resolution: resolution,
          rotation: rotation
        });
      }

      // Jump to extent & zoom (instead of animate):
      // ui.map.selected.getView().fit(currentState.v, ui.map.selected.getSize());
    }

    this.processActions(currentState, stepTransition);
  }

  processActions(currentState, stepTransition) {
    var ui = this.props.ui;

    if (!stepTransition) return;

    // ACTION: Play & pause animation
    if (currentState.ab === 'on') {
      if (stepTransition.element === 'animation' && stepTransition.action === 'play') {
        ui.anim.widget.onPressPlay();
        ui.anim.widget.reactComponent.setState({ playing: true });
      } else {
        ui.anim.widget.onPressPause();
        ui.anim.widget.reactComponent.setState({ playing: false });
      }
    }
  }

  render() {
    var { description } = this.state;

    return (
      <div>
        <Modal isOpen={this.props.modalInProgress} toggle={this.props.toggleModalInProgress} onClosed={this.props.showTourAlert} wrapClassName='tour tour-in-progress' className={this.props.className + ' ' + this.props.currentStory['type']} backdrop={false}>
          <ModalHeader toggle={this.props.toggleModalInProgress} charCode="">{this.props.currentStory['title']}<i className="modal-icon" aria-hidden="true"></i></ModalHeader>
          <ModalBody>
            {/* eslint-disable */}
            <div ref="stepContent" dangerouslySetInnerHTML={{ __html: description }} />
            {/* eslint-enable */}
          </ModalBody>
          <ModalFooter>
            <Steps currentStep={this.props.currentStep} totalSteps={this.props.totalSteps} decreaseStep={this.props.decreaseStep} incrementStep={this.props.incrementStep}></Steps>
          </ModalFooter>
        </Modal>
      </div>
    );
  }
}

ModalInProgress.propTypes = {
  models: PropTypes.object.isRequired,
  config: PropTypes.object.isRequired,
  ui: PropTypes.object.isRequired,
  modalInProgress: PropTypes.bool.isRequired,
  toggleModalInProgress: PropTypes.func.isRequired,
  currentStep: PropTypes.number.isRequired,
  totalSteps: PropTypes.number.isRequired,
  currentStoryIndex: PropTypes.number.isRequired,
  currentStory: PropTypes.object.isRequired,
  currentStoryId: PropTypes.string.isRequired,
  decreaseStep: PropTypes.func.isRequired,
  incrementStep: PropTypes.func.isRequired,
  showTourAlert: PropTypes.func.isRequired,
  restartTour: PropTypes.bool.isRequired,
  toggleRestartTour: PropTypes.func.isRequired,
  toggleMetaLoaded: PropTypes.func.isRequired,
  metaLoaded: PropTypes.bool.isRequired,
  className: PropTypes.string
};

export default ModalInProgress;

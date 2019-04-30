import React from 'react';
import PropTypes from 'prop-types';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import Steps from './widget-steps';
import util from '../../util/util';
import lodashEach from 'lodash/each';
import { getCompareObjects } from '../../compare/util';
import { parse as dateParser } from '../../date/date';
import {
  parse as layerParser,
  validate as layerValidate
} from '../../layers/layers';
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
    this.loadLink = this.loadLink.bind(this);
    this.setUI = this.setUI.bind(this);
    this.processActions = this.processActions.bind(this);
    this.escFunction = this.escFunction.bind(this);
  }

  componentDidMount() {
    document.addEventListener('keydown', this.escFunction, false);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.escFunction, false);
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

  // Use custom escFunction since tabIndex prevents escape key use on loading WV
  escFunction(e) {
    if (e.keyCode === 27 && this.props.modalInProgress) {
      this.props.toggleModalInProgress(e);
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
    var currentStateParsers, prevStateParsers, requirements, currentState, currentStepLink, stepTransition, prevState, prevStepLink;
    var errors = [];
    var config = this.props.config;
    var models = this.props.models;

    // When the link is loaded, save the tour to URL
    models.tour.active = true;
    models.tour.select(this.props.currentStoryId);

    // Record selected story's id, current steps, and total steps to analytics
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

    // Remove base URL from step links string
    currentStepLink = currentStepLink.split('/?').pop();

    // Get previous step link (if there is a previous step)
    // Remove base URL from step links string
    if (prevStepIndex !== null && !isNaN(prevStepIndex)) {
      prevStepLink = currentStory.steps[prevStepIndex]['stepLink'];
      prevStepLink = prevStepLink.split('/?').pop();
    }

    // Create current and previous states from step links
    currentState = util.fromQueryString(currentStepLink);
    prevState = util.fromQueryString(prevStepLink);

    // Get current step transistion
    stepTransition = currentStory.steps[currentStepIndex]['transition'];

    // Pass current step query string to the browser url
    if (util.browser.history) {
      window.history.pushState(
        '',
        '@OFFICIAL_NAME@',
        '?' + currentStepLink
      );
    }

    // Start Parsing
    layerValidate(errors, config);

    // Parse the current state
    currentStateParsers = [
      projectionParser,
      layerParser,
      dateParser,
      mapParser,
      palettes.parse
    ];
    if (config.features.dataDownload) {
      currentStateParsers.push(dataParser);
    }
    if (config.features.animation) {
      currentStateParsers.push(animationParser);
    }
    lodashEach(currentStateParsers, function(parser) {
      parser(currentState, errors, config);
    });

    // Parse the previous state
    prevStateParsers = [
      projectionParser,
      layerParser,
      dateParser,
      mapParser,
      palettes.parse
    ];
    if (config.features.dataDownload) {
      prevStateParsers.push(dataParser);
    }
    if (config.features.animation) {
      prevStateParsers.push(animationParser);
    }
    lodashEach(prevStateParsers, function(parser) {
      parser(prevState, errors, config);
    });

    // Reset the palette, min and max values if these are not present in the
    // current step url but were present in previous step.
    if (prevStepLink) {
      Object.values(prevState.l).forEach(prevLayer => {
        if (prevLayer.id) {
          Object.values(currentState.l).forEach(currentLayer => {
            if (prevLayer.id === currentLayer.id) {
              if (!util.objectsHaveSameKeys(prevLayer.attributes, currentLayer.attributes)) {
                let prevAttrArray = prevLayer.attributes;
                let currentAttrArray = currentLayer.attributes;
                if (prevAttrArray.find(prevAttrArray => (prevAttrArray.id === 'palette')) &&
                !currentAttrArray.find(currentAttrArray => (currentAttrArray.id === 'palette'))) {
                  let array = currentLayer.attributes;
                  array.push({ id: 'palette', value: '' });
                }
                if (prevAttrArray.find(prevAttrArray => (prevAttrArray.id === 'min')) &&
                !currentAttrArray.find(currentAttrArray => (currentAttrArray.id === 'min'))) {
                  let array = currentLayer.attributes;
                  array.push({ id: 'min', value: '' });
                }
                if (prevAttrArray.find(prevAttrArray => (prevAttrArray.id === 'max')) &&
                !currentAttrArray.find(currentAttrArray => (currentAttrArray.id === 'max'))) {
                  let array = currentLayer.attributes;
                  array.push({ id: 'max', value: '' });
                }
              }
            }
          });
        }
      });
    }

    requirements = palettes.requirements(currentState, config);

    // Load the step link after the palettes & defaults loaded
    Promise.all([requirements])
      .then(models.layers.loaded = false) // Layers have not yet loaded
      .then(() => { // Ensure selectedB is set in the models before loading link
        if (currentState.t1) {
          let selectedB = util.toISOStringSeconds(currentState.t1);
          selectedB = new Date(selectedB);
          models.date.selectedB = selectedB;
        }
      })
      .then(util.wrap(() => this.loadLink(currentState, stepTransition, prevState, currentStepIndex)));
  }

  loadLink(currentState, stepTransition, prevState, currentStepIndex) {
    var promises = [];
    var errors = [];
    var models = this.props.models;
    var ui = this.props.ui;
    var rotation = 0;

    // Close the comparison mode if there is no comparison mode in the step link
    if (((!currentState.ca || !currentState.cm) && models.compare.active === true) || (prevState.ca || prevState.cm)) {
      models.compare.toggle();
      models.compare.load({});
      ui.sidebar.reactComponent.setState({
        isCompareMode: false
      });
      models.compare.active = false;
    } else {
      if (!models.compare.isCompareA) {
        models.layers.activeLayers = 'active';
        models.compare.load({});
        models.compare.toggleState();
        ui.sidebar.reactComponent.setState({
          isCompareA: true
        });
        models.compare.isCompareA = true;
      }
    }

    // Set rotation value if it exists
    if (currentState.p === 'arctic' || currentState.p === 'antarctic') {
      if (!isNaN(currentState.r)) {
        rotation = currentState.r * (Math.PI / 180.0);
      }
    }

    // LOAD: Comparison
    promises.push(models.compare.load(currentState, errors));

    // LOAD: Projection
    promises.push(models.proj.load(currentState, errors));

    // LOAD: Layers
    promises.push(models.layers.load(currentState, errors));

    // LOAD: Palettes
    promises.push(models.palettes.load(currentState, errors));

    // LOAD: Date(s)
    promises.push(models.date.load(currentState, errors));

    // LOAD: Animation
    if (!currentState.ca || !currentState.cm) {
      promises.push(models.anim.load(currentState, errors));
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
        promises.push(ui.naturalEvents.selectEvent(id, date, rotation));
      }
    }

    // LOAD: Data Download
    if (currentState.download && (!currentState.ca || !currentState.cm)) {
      promises.push(models.anim.load(currentState, errors));
    }

    Promise.all([promises])
      .then(() => this.setUI(currentState, stepTransition, prevState, currentStepIndex));
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
      let extent = currentState.v;
      let coordinateX = extent[0] + (extent[2] - extent[0]) / 2;
      let coordinateY = extent[1] + (extent[3] - extent[1]) / 2;
      let coordinates = [coordinateX, coordinateY];
      let resolution = ui.map.selected.getView().getResolutionForExtent(extent);
      let zoom = ui.map.selected.getView().getZoomForResolution(resolution);

      // Animate to extent, zoom & rotate:
      // Don't animate when an event is selected (Event selection already animates)
      if (!currentState.e) {
        ui.map.animate.fly(coordinates, zoom, rotation);
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
        <Modal isOpen={this.props.modalInProgress} toggle={this.props.toggleModalInProgress} onClosed={this.props.showTourAlert} wrapClassName='tour tour-in-progress' className={this.props.className + ' ' + this.props.currentStory['type']} backdrop={false} keyboard={false}>
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

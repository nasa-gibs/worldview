import React from 'react';
import PropTypes from 'prop-types';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import Steps from './widget-steps';
import util from '../../util/util';
import lodashFind from 'lodash/find';

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
    this.loadLink = this.loadLink.bind(this);
    this.processLink = this.processLink.bind(this);
    this.processActions = this.processActions.bind(this);
  }

  componentDidUpdate(prevProps) {
    var currentStory = this.props.currentStory;
    var currentStepIndex = this.props.currentStep - 1;
    var modalStarted = this.props.modalInProgress;

    // When restarting tour, reset the MetaLoaded prop
    if (this.props.restartTour) {
      this.props.toggleRestartTour();
    }

    // Scroll content div to the top when step updates
    if (this.refs.stepContent) this.refs.stepContent.parentNode.scrollTop = 0;

    // Fetch meta and load link
    if (modalStarted && !this.props.metaLoaded) {
      this.props.toggleMetaLoaded();
      this.fetchMetadata(currentStory, 0);
      this.loadLink(currentStory, currentStepIndex);
    } else {
      if (prevProps.currentStep !== this.props.currentStep) {
        let prevStepIndex = prevProps.currentStep - 1;

        // Reset the prevStepIndex when a new tour is selected
        if (currentStepIndex === 0 && prevStepIndex !== 1) prevStepIndex = null;
        this.fetchMetadata(currentStory, currentStepIndex);
        this.loadLink(currentStory, currentStepIndex, prevStepIndex);
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

  loadLink(currentStory, currentStepIndex, prevStepIndex) {
    var currentState, currentStepLink, stepTransition, prevState, prevStepLink;
    var errors = [];
    var config = this.props.config;
    var models = this.props.models;

    googleTagManager.pushEvent({
      'event': 'tour_selected_story',
      'story': {
        'id': this.props.currentStoryId,
        'selectedStep': this.props.currentStep,
        'totalSteps': this.props.totalSteps
      }
    });

    // Get current step link
    currentStepLink = currentStory.steps[currentStepIndex]['stepLink'];

    // Get current step transistion
    stepTransition = currentStory.steps[currentStepIndex]['transition'];

    // Get previous step link (if there is a previous step)
    if (prevStepIndex !== null && !isNaN(prevStepIndex)) {
      prevStepLink = currentStory.steps[prevStepIndex]['stepLink'];
    }

    // TESTING HERE:
    // currentStepLink =
    // 'ca=false' +
    // '&cm=opacity' +
    // '&cv=80' +
    // 'p=geographic' +
    // '&l=VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor,MODIS_Combined_Value_Added_AOD,MODIS_Terra_Aerosol_Optical_Depth_3km,Reference_Labels(hidden),Reference_Features(hidden),Coastlines' +
    // '&l1=BlueMarble_NextGeneration,IMERG_Snow_Rate,IMERG_Rain_Rate' +
    // '&t=2018-09-06-T00%3A00%3A00Z' +
    // '&t1=2018-03-06-T00%3A00%3A00Z' +
    // '&z=2' +
    // '&v=-202.1385353269304,-23.272676762951903,67.8614646730696,108.6335732370481' +
    // '&download=MOD04_3K' +
    // '&e=true' +
    // '&ab=on' +
    // '&as=2018-03-26T00%3A00%3A00Z' +
    // '&ae=2018-09-26T00%3A00%3A00Z' +
    // '&av=5' +
    // '&al=true' +
    // '';

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

    // Create a query string from the current state
    currentStepLink = models.link.toQueryString(currentState);

    // Pass current step query string to the browser url
    if (util.browser.history) {
      window.history.pushState(
        '',
        '@OFFICIAL_NAME@',
        '?' + currentStepLink
      );
    }

    // Process the state of the application
    this.processLink(currentState, stepTransition, prevState, currentStepIndex);
  }

  processLink(currentState, stepTransition, prevState, currentStepIndex) {
    var errors = [];
    var config = this.props.config;
    var models = this.props.models;
    var ui = this.props.ui;
    var rotation = 0;

    // Set rotation value if it exists
    if (currentState.p === 'arctic' || currentState.p === 'antarctic') {
      if (!isNaN(currentState.r)) {
        rotation = currentState.r * (Math.PI / 180.0);
      }
    }

    // LOAD: Projection
    models.proj.load(currentState, errors);

    // LOAD: Palettes
    palettes.loadCustom(config);

    // LOAD: Layers
    models.layers.load(currentState, errors);

    // LOAD: Comparison
    if (currentState.ca || currentState.cm) {
      // Note: models.compare.load without re-selecitng t
      if (currentState.ca === 'false') {
        models.date.setActiveDate('selectedB');
      }
      // if (currentState.t) {
      //   models.date.select(currentState.t, 'selected');
      // }
      if (currentState.z) {
        models.date.selectedZoom = Number(currentState.z);
      }
      if (currentState.t1) {
        models.date.select(currentState.t1, 'selectedB');
      }
      models.compare.active = true;
      models.compare.isCompareA = true;
      if (currentState.ca === 'false') {
        models.compare.isCompareA = false;
      }

      if (currentState.cm) {
        models.compare.mode = currentState.cm;
        models.compare.setMode(currentState.cm);
      }

      if (currentState.cv) {
        models.compare.value = Number(currentState.cv);
        models.compare.setValue(currentState.cv);
      }
    }

    // TODO: Fix this area of code
    // SET UI: Set sidebar & timeline to comparison mode
    if (currentState.ca || currentState.cm) {
      models.date.events.trigger('state-update');
      ui.timeline.input.update();

      var compareObj = {};
      if (config.features.compare) {
        if (models.compare.active && models.layers.activeB) {
          compareObj.a = {
            dateString: util.toISOStringDate(currentState.t),
            layers: models.layers.get(
              { group: 'all', proj: 'all' },
              models.layers['active']
            )
          };
          compareObj.b = {
            dateString: util.toISOStringDate(currentState.t1),
            layers: models.layers.get(
              { group: 'all', proj: 'all' },
              models.layers['activeB']
            )
          };
        }
      }
      ui.sidebar.reactComponent.setState({
        isCompareMode: true,
        firstDateObject: compareObj.a,
        secondDateObject: compareObj.b,
        isCompareA: models.compare && models.compare.isCompareA,
        comparisonType: currentState.cm
      });
    }

    // LOAD: Date(s)
    models.date.load(currentState, errors);

    // LOAD: Animation
    if (!currentState.download) {
      models.anim.load(currentState, errors);
    }

    // LOAD: Events & Data Download
    // Note: Can't simple load from model since these check for startup events
    if (currentState.e) {
      let values = currentState.e.split(',');
      let id = values[0] || '';
      let date = values[1] || '';
      id = id.match(/^EONET_[0-9]+/i) ? values[0] : null;
      date = date.match(/\d{4}-\d{2}-\d{2}/) ? values[1] : null;
      models.naturalEvents.events.trigger('activate');
      if (id) {
        ui.naturalEvents.selectEvent(id, date, rotation);
      }
    } else if (currentState.download) {
      let productId = currentState.download;
      let found = lodashFind(models.layers[models.layers.activeLayers], {
        product: productId
      });
      if (!found) {
        errors.push({
          message: 'No active layers match product: ' + productId
        });
      } else {
        models.data.activate(productId);
      }
    } else {
      ui.sidebar.selectTab('layers');
    }

    // SET UI: Timeline Zoom Level
    if (currentState.z) {
      let zoomLevel = Number(currentState.z);
      ui.timeline.config.zoom(zoomLevel);
    }

    // SET UI: Animation
    if (currentState.al === 'true') {
      ui.anim.widget.reactComponent.setState({ looping: true });
      models.anim.rangeState.loop = true;
    } else {
      ui.anim.widget.reactComponent.setState({ looping: false });
      models.anim.rangeState.loop = false;
    }
    if (currentState.as) ui.anim.widget.reactComponent.setState({ startDate: currentState.as });
    if (currentState.ae) ui.anim.widget.reactComponent.setState({ endDate: currentState.ae });
    if (currentState.av) ui.anim.widget.reactComponent.setState({ value: Number(currentState.av) });

    // SET UI (During step transistion): Toggle Animation
    // If animation is current on, toggle the state and animation widget
    if (prevState.ab === 'on' && currentState.ab === 'off') {
      models.anim.activate();
      ui.anim.widget.toggleAnimationWidget();
    } else if (prevState.ab === 'on' && !currentState.ab) {
      models.anim.activate();
      ui.anim.widget.toggleAnimationWidget();
    } else if (prevState.ab === 'off' && currentState.ab === 'on') {
      models.anim.deactivate();
      ui.anim.widget.toggleAnimationWidget();
    } else if (!prevState.ab && currentState.ab === 'on') {
      models.anim.deactivate();
      ui.anim.widget.toggleAnimationWidget();
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

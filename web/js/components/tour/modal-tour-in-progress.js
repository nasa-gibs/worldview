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
import { parse as tourParser } from '../../tour/tour';

class ModalInProgress extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      desciption: '',
      metaLoaded: false,
      isLoading: false,
      error: null
    };

    this.fetchMetadata = this.fetchMetadata.bind(this);
    this.stepLink = this.stepLink.bind(this);
    this.selectLink = this.selectLink.bind(this);
  }

  componentDidUpdate(prevProps) {
    var currentStory = this.props.currentStory;
    var currentStepIndex = this.props.currentStep - 1;
    if (prevProps.currentStep !== this.props.currentStep) {
      var prevStepIndex = prevProps.currentStep - 1;
      // Reset the prevStepIndex when a new tour is selected
      if (currentStepIndex === 0 && prevStepIndex !== 1) prevStepIndex = null;

      this.fetchMetadata(currentStory, currentStepIndex);
      this.stepLink(currentStory, currentStepIndex, prevStepIndex);
    }
  }

  fetchMetadata(currentStory, stepIndex) {
    var description = currentStory.steps[stepIndex]['description'];
    this.setState({ isLoading: true });

    var { origin, pathname } = window.location;
    var currentStoryId = this.props.currentStory['id'];
    var errorMessage = '<p>There was an error loading this description.</p>';
    var uri = `${origin}${pathname}config/metadata/stories/${currentStoryId}/${description}`;
    fetch(uri)
      .then(res => (res.ok ? res.text() : errorMessage))
      .then(body => {
        var isMetadataSnippet = !body.match(
          /<(head|body|html|style|script)[^>]*>/i
        );
        let description = isMetadataSnippet ? body : errorMessage;
        this.setState({ description: description, isLoading: false });
      }).catch(error => this.setState({ error, isLoading: false }));
  }

  stepLink(currentStory, currentStepIndex, prevStepIndex) {
    var currentState, currentStepLink, stepTransition, prevState, prevStepLink;
    var config = this.props.config;
    var models = this.props.models;
    var errors = [];

    // Get current step link
    currentStepLink = currentStory.steps[currentStepIndex]['stepLink'];
    // Get the current step transistion
    stepTransition = currentStory.steps[currentStepIndex]['transition'];
    // Get the prev step link (if there is a previous step)
    if (prevStepIndex) prevStepLink = currentStory.steps[prevStepIndex]['stepLink'];

    // TESTING HERE:
    currentStepLink =
      'ca=true' +
      '&cm=opacity' +
      '&cv=50' +
      '&p=geographic' +
      '&l=VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor,MODIS_Combined_Value_Added_AOD,Reference_Labels(hidden),Reference_Features(hidden),Coastlines' +
      '&l1=BlueMarble_NextGeneration,IMERG_Snow_Rate,IMERG_Rain_Rate' +
      '&t=2018-09-06-T00%3A00%3A00Z' +
      '&z=2' +
      '&t1=2018-03-06-T00%3A00%3A00Z' +
      '&v=-202.1385353269304,-23.272676762951903,67.8614646730696,108.6335732370481';
    currentState = util.fromQueryString(currentStepLink);
    prevState = util.fromQueryString(prevStepLink);

    // Parse the current step link
    projectionParser(currentState, errors, config);
    layerParser(currentState, errors, config);
    dateParser(currentState, errors, config);
    mapParser(currentState, errors, config);
    palettes.parse(currentState, errors, config);
    tourParser(currentState, errors, config);
    if (config.features.dataDownload) {
      dataParser(currentState, errors, config);
    }
    if (config.features.animation) {
      animationParser(currentState, errors, config);
    }

    // Create a query string to be passed to the URL
    currentStepLink = models.link.toQueryString(currentState);

    // Parse the prev step link
    projectionParser(prevState, errors, config);
    layerParser(prevState, errors, config);
    dateParser(prevState, errors, config);
    mapParser(prevState, errors, config);
    palettes.parse(prevState, errors, config);
    tourParser(prevState, errors, config);
    if (config.features.dataDownload) {
      dataParser(prevState, errors, config);
    }
    if (config.features.animation) {
      animationParser(prevState, errors, config);
    }

    // Push query string to the browser url
    if (util.browser.history) {
      window.history.pushState(
        '',
        '@OFFICIAL_NAME@',
        '?' + currentStepLink
      );
    }

    // Process the state of the application
    this.selectLink(currentState, stepTransition, prevState);
  }

  selectLink(currentState, stepTransition, prevState) {
    var errors = [];
    var config = this.props.config;
    var models = this.props.models;
    var ui = this.props.ui;
    var rotation;

    // Set rotation value if it exists
    if (currentState.p === 'arctic' || currentState.p === 'antarctic') {
      if (!isNaN(currentState.r)) {
        rotation = currentState.r * (Math.PI / 180.0);
      } else {
        rotation = 0;
      }
    } else {
      rotation = 0;
    }

    // LOAD: Map Projection
    if (currentState.p) {
      models.proj.select(currentState.p);
    }

    // LOAD: Palettes
    palettes.loadCustom(config);

    // LOAD: Layers
    models.layers.load(currentState);

    // LOAD: Comparison
    if (currentState.ca) {
      models.compare.active = true;
      models.compare.isCompareA = 'true';
      if (currentState.ca === 'false') {
        models.compare.isCompareA = 'false';
      }
    }
    if (currentState.cm) {
      models.compare.active = true;
      models.compare.isCompareA = 'true';
      if (currentState.ca === 'false') {
        models.compare.isCompareA = 'false';
      }
      models.compare.mode = currentState.cm;
      models.compare.setMode(currentState.cm);
    }
    if (currentState.cv) {
      models.compare.value = Number(currentState.cv);
      models.compare.setValue(currentState.cv);
    }

    if (currentState.ca || currentState.cm) {
      models.compare.save(currentState);
      models.compare.load(currentState);

      // TODO: Tweak this
      models.date.events.trigger('state-update');
      ui.timeline.input.update();

      var compareObj = {};
      if (config.features.compare) {
        if (models.compare.active) {
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

      var toggleComparisonObject = function() {
        models.compare.toggleState();
      };

      var toggleComparisonMode = function() {
        console.log(models.date.selectedB);
        if (!models.layers.activeB || !models.date.selectedB) {
          if (!models.date.selectedB) {
            models.date.initCompare();
          }
          if (!models.layers.activeB) {
            models.layers.initCompare();
          }
        }
        models.compare.toggle();
      };
      console.log(models.compare.isCompareA);
      ui.sidebar.reactComponent.setState({
        compareFeature: config.features.compare,
        isCompareMode:
          models.compare && models.compare.active ? models.compare.active : false,
        firstDateObject: compareObj.a,
        secondDateObject: compareObj.b,
        toggleComparisonObject: toggleComparisonObject,
        toggleMode: toggleComparisonMode,
        isCompareA: models.compare && models.compare.isCompareA,
        comparisonType: currentState.cm
      });

      // models.compare.events.trigger('toggle');
    }

    // LOAD: Date(s)
    if (currentState.ca === 'false') {
      models.date.setActiveDate('selectedB');
    }
    if (currentState.t) {
      models.date.select(currentState.t, 'selected');
    }
    if (currentState.z) {
      models.date.selectedZoom = Number(currentState.z);
    }
    if (currentState.t1) {
      models.date.select(currentState.t1, 'selectedB');
    }

    // Load: Timeline Zoom Level
    if (currentState.z) {
      let zoomLevel = Number(currentState.z);
      ui.timeline.config.zoom(zoomLevel);
    }

    // LOAD: Animation
    models.anim.save(currentState);
    models.anim.load(currentState);

    // SET UI: ANIMATION
    if (currentState.al) {
      ui.anim.widget.reactComponent.setState({ looping: true });
    } else {
      ui.anim.widget.reactComponent.setState({ looping: false });
    }
    if (currentState.as) ui.anim.widget.reactComponent.setState({ startDate: currentState.as });
    if (currentState.ae) ui.anim.widget.reactComponent.setState({ endDate: currentState.ae });
    if (currentState.av) ui.anim.widget.reactComponent.setState({ value: Number(currentState.av) });

    // If animation is current on, toggle the state and animation widget
    if (prevState.ab === 'on' && currentState.ab === 'off') {
      models.anim.activate();
      ui.anim.widget.toggleAnimationWidget();
    } else
    if (prevState.ab === 'on' && !currentState.ab) {
      models.anim.activate();
      ui.anim.widget.toggleAnimationWidget();
    } else if (prevState.ab === 'off' && currentState.ab === 'on') {
      models.anim.deactivate();
      ui.anim.widget.toggleAnimationWidget();
    } else if (!prevState.ab && currentState.ab === 'on') {
      models.anim.deactivate();
      ui.anim.widget.toggleAnimationWidget();
    }

    // LOAD: Data Download
    if (currentState.download) {
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

    // LOAD: Events
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
    } else {
      ui.sidebar.selectTab('layers');
    }

    // LOAD: Map Zoom & View & Rotation(Animated)
    if (currentState.v) {
      // Animate to extent & zoom:
      let extent = currentState.v;
      var coordinateX = extent[0] + (extent[2] - extent[0]) / 2;
      var coordinateY = extent[1] + (extent[3] - extent[1]) / 2;
      let coordinates = [coordinateX, coordinateY];
      let resolution = ui.map.selected.getView().getResolutionForExtent(extent);
      var duration;
      // Don't animate when projection changes
      if (prevState.p !== currentState.p) { duration = 0; } else { duration = 4000; }
      if (!currentState.e) {
        ui.map.selected.getView().animate({
          center: coordinates,
          duration: duration,
          resolution: resolution,
          rotation: rotation
        });
      }

      // To jump to extent & zoom (instead of animate):
      // ui.map.selected.getView().fit(currentState.v, ui.map.selected.getSize());
    }

    // ACTION: Animation
    if (stepTransition) {
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
    var { description, metaLoaded } = this.state;
    var currentStory = this.props.currentStory;
    var modalStarted = this.props.modalInProgress;

    if (this.props.restartTour) {
      this.setState({
        metaLoaded: false
      });
      this.props.toggleRestartTour();
    }

    if (modalStarted && !metaLoaded) {
      this.setState({ metaLoaded: true });
      this.fetchMetadata(currentStory, 0);
      this.stepLink(currentStory, 0);
    }

    return (
      <div>
        <Modal isOpen={this.props.modalInProgress} toggle={this.props.toggleModalInProgress} onClosed={this.props.showTourAlert} wrapClassName='tour tour-in-progress' className={this.props.className + ' ' + this.props.currentStory['type']} backdrop={false}>
          <ModalHeader toggle={this.props.toggleModalInProgress} charCode="">{this.props.currentStory['title']}<i className="modal-icon" aria-hidden="true"></i></ModalHeader>
          <ModalBody>
            {/* eslint-disable */}
            <div dangerouslySetInnerHTML={{ __html: description }} />
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
  className: PropTypes.string
};

export default ModalInProgress;

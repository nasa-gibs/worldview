import React from 'react';
import PropTypes from 'prop-types';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import Steps from './widget-steps';
import util from '../../util/util';
import wvui from '../../ui/ui';
import lodashFind from 'lodash/find';
import lodashEach from 'lodash/each';
import lodashIsUndefined from 'lodash/isUndefined';
import lodashEachRight from 'lodash/eachRight';
// import lodashWithout from 'lodash/without';
// import lodashMap from 'lodash/map';
// import { getCenter } from 'ol/extent';

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

  // componentDidMount() {
  //   var currentStory = this.props.currentStory;
  //   var currentStepIndex = this.props.currentStep;
  //   this.fetchMetadata(currentStory, currentStepIndex);
  // }

  componentDidUpdate(prevProps) {
    var currentStory = this.props.currentStory;
    var currentStepIndex = this.props.currentStep - 1;
    if (prevProps.currentStep !== this.props.currentStep) {
      var prevStepIndex = prevProps.currentStep - 1;

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
        // Check that we have a metadata html snippet, rather than a fully
        // formed HTML file. Also avoid executing any script or style tags.
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
    // Get steplink from the currentstory's current step
    currentStepLink = currentStory.steps[currentStepIndex]['stepLink'];
    stepTransition = currentStory.steps[currentStepIndex]['transition'];

    if (prevStepIndex) prevStepLink = currentStory.steps[prevStepIndex]['stepLink'];

    // TESTING HERE:
    // currentStepLink = 'p=geographic&l=MODIS_Terra_SurfaceReflectance_Bands143(hidden),VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor,MODIS_Terra_Sea_Ice(hidden),MODIS_Aqua_Sea_Ice(hidden),MODIS_Aqua_Brightness_Temp_Band31_Night(hidden),MODIS_Aqua_Brightness_Temp_Band31_Day(hidden),MODIS_Terra_Brightness_Temp_Band31_Night(hidden),MODIS_Terra_Brightness_Temp_Band31_Day(hidden),VIIRS_SNPP_DayNightBand_ENCC(hidden),Reference_Labels,Reference_Features,Coastlines(hidden)&t=2018-04-20-T00%3A00%3A00Z&z=1&v=-240.4465521284557,-168.37095562787738,17.806552128455706,23.270955627877385&ab=off&as=2018-10-31T00%3A00%3A00Z&ae=2018-11-07T00%3A00%3A00Z&av=3&al=true&e=EONET_2881,2018-04-20';
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

    // Create a query string again to be passed to the URL
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

    // Push query string to browser url
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
    if (currentState.p === 'arctic' || currentState.p === 'antarctic') {
      if (!isNaN(currentState.r)) {
        rotation = currentState.r * (Math.PI / 180.0);
      } else {
        rotation = 0;
      }
    } else {
      rotation = 0;
    }

    // LOAD: Map Projection, Map Date
    // TODO: THIS PROBABLY NEEDS REWORKED
    models.link.load(currentState);

    // Zoom Level
    if (currentState.z) {
      let zoomLevel = Number(currentState.z);
      ui.timeline.config.zoom(zoomLevel);
    }

    // LOAD: Map Zoom & View & Rotation(Animated)
    // TODO: Fix rotation animation
    if (currentState.v) {
      // Animate to extent & zoom:
      let extent = currentState.v;
      var coordinateX = extent[0] + (extent[2] - extent[0]) / 2;
      var coordinateY = extent[1] + (extent[3] - extent[1]) / 2;
      let coordinates = [coordinateX, coordinateY];
      let resolution = ui.map.selected.getView().getResolutionForExtent(extent);
      ui.map.selected.getView().animate({
        center: coordinates,
        duration: 4000,
        resolution: resolution,
        rotation: rotation
      });

      // Don't animate to extent & zoom:
      // ui.map.selected.getView().fit(currentState.v, ui.map.selected.getSize());
    }

    // LOAD: Animation
    // Note: Seems like animation must come before comparison
    // Set state from URL
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

    // LOAD: Comparison
    if (currentState.ca === 'true') {
      // Close all the open dialogs
      wvui.close();
      if (currentState.cv) {
        models.compare.setValue(currentState.cv);
      } else {
        models.compare.setValue(50);
      }
      models.compare.setMode(currentState.cm);
      models.compare.events.trigger('change');
    }

    // LOAD: Layers
    var layers;
    if (config.features.compare) {
      layers = [
        {
          state: 'l',
          active: 'active'
        },
        {
          state: 'l1',
          active: 'activeB'
        }
      ];
    } else {
      layers = [{ state: 'l', active: 'active' }];
    }
    lodashEach(layers, obj => {
      if (!lodashIsUndefined(currentState[obj.state])) {
        models.layers.clear(models.proj.selected.id, obj.active);
        lodashEachRight(currentState[obj.state], function(layerDef) {
          if (!config.layers[layerDef.id]) {
            errors.push({
              message: 'No such layer: ' + layerDef.id
            });
            return;
          }
          var hidden = false;
          var opacity = 1.0;
          lodashEach(layerDef.attributes, function(attr) {
            if (attr.id === 'hidden') {
              hidden = true;
            }
            if (attr.id === 'opacity') {
              opacity = util.clamp(parseFloat(attr.value), 0, 1);
              if (isNaN(opacity)) opacity = 0; // "opacity=0.0" is opacity in URL, resulting in NaN
            }
          });

          models.layers[obj.active] = models.layers.add(
            layerDef.id,
            {
              hidden: hidden,
              opacity: opacity
            },
            obj.active
          );
        });
      }
    });
    if (currentState.ca && currentState.ca !== 'true') {
      models.layers.activeLayers = 'activeB';
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

    // LOAD: Data Download
    var productId = currentState.download;
    if (productId) {
      var found = lodashFind(models.layers[models.layers.activeLayers], {
        product: productId
      });
      if (!found) {
        errors.push({
          message: 'No active layers match product: ' + productId
        });
      } else {
        models.data.activate(productId);
      }
    }

    // LOAD: Events
    if (!currentState.e) return;
    models.naturalEvents.events.trigger('activate');
    var values = currentState.e.split(',');
    var id = values[0] || '';
    var date = values[1] || '';
    id = id.match(/^EONET_[0-9]+/i) ? values[0] : null;
    date = date.match(/\d{4}-\d{2}-\d{2}/) ? values[1] : null;
    if (id) {
      ui.naturalEvents.selectEvent(id, date);
    }
  }

  render() {
    var { description, metaLoaded } = this.state;
    var currentStory = this.props.currentStory;
    var modalStarted = this.props.modalInProgress;
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
  className: PropTypes.string
};

export default ModalInProgress;

import React from 'react';
import PropTypes from 'prop-types';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import Steps from './widget-steps';
import util from '../../util/util';
// import lodashEach from 'lodash/each';
import lodashMap from 'lodash/map';
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

  componentDidMount() {
    var currentStepIndex = this.props.currentStep;
    this.fetchMetadata(currentStepIndex);
  }

  componentWillReceiveProps(nextProps) {
    var currentStory = this.props.currentStory;
    if (nextProps.currentStep !== this.props.currentStep) {
      var currentStepIndex = nextProps.currentStep;
      this.fetchMetadata(currentStepIndex);
      this.stepLink(currentStory, currentStepIndex);
    }
  }

  fetchMetadata(currentStepIndex) {
    currentStepIndex = currentStepIndex.toString().padStart(3, '0');
    this.setState({ isLoading: true });

    var { origin, pathname } = window.location;
    var currentStoryId = this.props.currentStory['id'];
    var errorMessage = '<p>There was an error loading this description.</p>';
    var uri = `${origin}${pathname}config/metadata/stories/${currentStoryId}/step${currentStepIndex}.html`;
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

  stepLink(currentStory, currentStepIndex) {
    var prevState, currentState, prevStepLink, currentStepLink, stepTransition;
    var config = this.props.config;
    var models = this.props.models;
    var errors = [];

    // Get steplink from the currentstory's current step
    currentStepIndex = (currentStepIndex - 1).toString().padStart(0, '0');
    if (currentStory.steps[currentStepIndex - 1]) prevStepLink = currentStory.steps[currentStepIndex - 1]['stepLink'];
    currentStepLink = currentStory.steps[currentStepIndex]['stepLink'];
    stepTransition = currentStory.steps[currentStepIndex]['transition'];

    // TESTING HERE:
    // stepLink = 'p=geographic&l=VIIRS_SNPP_CorrectedReflectance_TrueColor,MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor(hidden),Reference_Labels,Reference_Features(hidden),Coastlines(hidden)&t=2018-08-31-T00%3A00%3A00Z&z=3&t1=2018-09-19-T00%3A00%3A00Z&v=-113.05825121261012,-7.7039155910611115,-10.61293871261011,58.24920940893889&ab=on&as=2018-08-31T00%3A00%3A00Z&ae=2018-09-14T00%3A00%3A00Z&av=10&al=false';
    prevState = util.fromQueryString(prevStepLink);
    currentState = util.fromQueryString(currentStepLink);

    // Parse the previous step link
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

    // Push query string to browser url
    if (util.browser.history) {
      window.history.pushState(
        '',
        '@OFFICIAL_NAME@',
        '?' + currentStepLink
      );
    }

    // Process the state of the application
    this.selectLink(currentState, prevState, stepTransition);
  }

  selectLink(currentState, prevState, stepTransition) {
    // var errors = [];
    // var config = this.props.config;
    var models = this.props.models;
    var ui = this.props.ui;
    // var map = ui.map.selected;
    // Map Projection, Map Date
    models.link.load(currentState);

    // Map Rotation (Animated)
    if (currentState.p === 'arctic' || currentState.p === 'antarctic') {
      if (!isNaN(currentState.r)) {
        let rotation = currentState.r * (Math.PI / 180.0);
        ui.map.selected.getView().animate({
          duration: 800,
          rotation: rotation
        });
      }
    }

    // Map Zoom & View (Animated)
    if (currentState.v) {
      // No animation option
      // ui.map.selected.getView().fit(currentState.v, ui.map.selected.getSize());

      // Animate to extent & zoom
      let extent = currentState.v;
      var coordinateX = extent[0] + (extent[2] - extent[0]) / 2;
      var coordinateY = extent[1] + (extent[3] - extent[1]) / 2;
      let coordinates = [coordinateX, coordinateY];
      let resolution = ui.map.selected.getView().getResolutionForExtent(extent);
      ui.map.selected.getView().animate({
        center: coordinates,
        duration: 2000,
        resolution: resolution
      });
    }

    // Animation
    if (currentState.ab) {
      if (currentState.ab === 'on') {
        models.anim.activate();
      } else {
        models.anim.deactivate();
      }
    }
    if (prevState.ab !== currentState.ab) {
      ui.anim.widget.toggleAnimationWidget();
    }
    if (stepTransition.element === 'animation' && stepTransition.action === 'play') {
      ui.anim.widget.onPressPlay();
    }
    // }
    // if (currentState.as && currentState.ae) {
    //   if (currentState.ae.length >= 10 && currentState.as.length >= 10) {
    //     self.rangeState.startDate = currentState.as;
    //     self.rangeState.endDate = currentState.ae;
    //   }
    // }
    // if (currentState.av) {
    //   self.rangeState.speed = Number(currentState.av);
    // }
    // if (currentState.al) {
    //   self.rangeState.loop = Boolean(currentState.al);
    // }

    // var comparisonOn = currentState.ca;
    // var timeA = currentState.t;
    // var timeB = currentState.t1;
    // var layersA = currentState.l;
    // // var layersB = currentState.l1;
    // var projection = currentState.p;
    // var view = currentState.v;
    // var zoom = currentState.z;
    // // Set Projection
    // if (projection) models.proj.select(projection);

    // // Set Layer A time
    // if (timeA) models.date.select(util.parseDateUTC(timeA));
    // // Set Layer B time
    // if (timeB) models.date.select(util.parseDateUTC(timeB));

    // var coordinates =
    //   olProj.transform(
    //     geometry.coordinates,
    //     'EPSG:4326',
    //     models.proj.selected.crs
    //   );

    // Set layers
    // var layerString = models.layers.activeLayers;

    // // Turn string of layersA into an array
    // if (layersA) {
    //   var layersAArray = layersA.split(',');
    //   // Turn on or add new layers
    //   layersAArray.forEach(function(layer) {
    //     var id = layer.split('(')[0];
    //     var visible = !layer.includes('hidden');
    //     if (models.layers.exists(id, models.layers[layerString])) {
    //       models.layers.setVisibility(id, visible, layerString);
    //     } else {
    //       models.layers.add(id, { visible: visible }, layerString);
    //     }
    //   });
    // }

    // Remove layers in the list
    // models.layers[layerString].forEach(function(layer) {
    //   if (layer) models.layers.remove(layer.id);
    // });

    // console.log(JSON.stringify(currentState, null, 4));

    // console.log(JSON.stringify(currentState, null, 4));
  }

  render() {
    var { description, metaLoaded } = this.state;
    var currentStory = this.props.currentStory;
    var modalStarted = this.props.modalInProgress;
    if (modalStarted && !metaLoaded) {
      this.setState({ metaLoaded: true });
      this.fetchMetadata(1);
      this.stepLink(currentStory, 1);
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

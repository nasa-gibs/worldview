import React from 'react';
import PropTypes from 'prop-types';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import Steps from './widget-steps';
import util from '../../util/util';
import lodashEach from 'lodash/each';
import lodashMap from 'lodash/map';

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
    this.registerMapMouseHandlers = this.registerMapMouseHandlers.bind(this);
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
      this.selectLink();
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
    var stepLink;
    currentStepIndex = (currentStepIndex - 1).toString().padStart(0, '0');
    stepLink = currentStory.steps[currentStepIndex]['stepLink'];

    // Get URL Link here from JSON file (for each step)
    // Push Link to Browser URL
    if (util.browser.history) {
      window.history.pushState(
        '',
        '@OFFICIAL_NAME@',
        '?' + stepLink
      );
    }
  }

  registerMapMouseHandlers(maps, events) {
    Object.values(maps).forEach((map) => {
      let element = map.getTargetElement();
      let crs = map.getView().getProjection().getCode();
      element.addEventListener('mousemove', event => {
        events.trigger('mousemove', event, map, crs);
      });
      element.addEventListener('mouseout', event => {
        events.trigger('mouseout', event, map, crs);
      });
    });
  }

  selectLink() {
    var parsers;
    var errors = [];
    var config = this.props.config;
    var models = this.props.models;
    // var ui = this.props.ui;
    var state = util.fromQueryString(location.search);

    // var comparisonOn = state.ca;
    // var timeA = state.t;
    // var timeB = state.t1;
    var layersA = state.l;
    // // var layersB = state.l1;
    // var projection = state.p;
    var view = state.v;
    // var zoom = state.z;

    // // Set Projection
    // if (projection) models.proj.select(projection);

    // // Set Layer A time
    // if (timeA) models.date.select(util.parseDateUTC(timeA));
    // // Set Layer B time
    // if (timeB) models.date.select(util.parseDateUTC(timeB));

    // Set Zoom & View
    if (view) {
      let extent = lodashMap(state.v.split(','), function (str) {
        return parseFloat(str);
      });

      models.map.update(extent);
    }
    // // if (zoom && view) ui.naturalEvents.zoomToEvent(event, date, isSameEventID)

    // Set layers
    var layerString = models.layers.activeLayers;
    // Turn string of layersA into an array

    // Set current layers visible
    models.layers[layerString].forEach(function(layer) {
      models.layers.setVisibility(layer.id, false, layerString);
    });

    // Remove layers in the list
    models.layers[layerString].forEach(function(layer) {
      models.layers.remove(layer.id, false, layerString);
    });

    if (layersA) {
      var layersAArray = layersA.split(',');
      // Turn on or add new layers
      layersAArray.forEach(function(layer) {
        var id = layer.split('(')[0];
        var visible = !layer.includes('hidden');
        if (models.layers.exists(id, models.layers[layerString])) {
          models.layers.setVisibility(id, visible, layerString);
        } else {
          models.layers.add(
            id,
            {
              visible: visible
            },
            layerString
          );
        }
      });
    }

    parsers = [
      projectionParser,
      // layerParser,
      dateParser,
      mapParser,
      palettes.parse,
      tourParser
    ];
    if (config.features.dataDownload) {
      parsers.push(dataParser);
    }
    if (config.features.animation) {
      parsers.push(animationParser);
    }
    lodashEach(parsers, function(parser) {
      parser(state, errors, config);
    });
    models.link.load(state);
  }

  render() {
    var { description, metaLoaded } = this.state;
    var currentStory = this.props.currentStory;
    var modalStarted = this.props.modalInProgress;
    if (modalStarted && !metaLoaded) {
      this.setState({ metaLoaded: true });
      this.fetchMetadata(1);
      this.stepLink(currentStory, 1);
      this.selectLink();
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

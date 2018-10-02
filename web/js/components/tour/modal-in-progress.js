import React from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import Steps from './widget-steps';
import util from '../../util/util';

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
    var currentStoryIndex = this.props.currentStoryIndex;
    var currentStepIndex = this.props.currentStep;
    this.fetchMetadata(currentStoryIndex, currentStepIndex);
  }

  componentWillReceiveProps(nextProps) {
    var currentStoryIndex = this.props.currentStoryIndex;
    if (nextProps.currentStep !== this.props.currentStep) {
      var currentStepIndex = nextProps.currentStep;
      this.fetchMetadata(currentStoryIndex, currentStepIndex);
      this.stepLink(currentStoryIndex, currentStepIndex);
      this.selectLink();
    }
  }

  fetchMetadata(currentStoryIndex, currentStepIndex) {
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

  stepLink(currentStoryIndex, currentStepIndex) {
    var stepLink;
    currentStepIndex = (currentStepIndex - 1).toString().padStart(0, '0');
    var currentStoryId = this.props.currentStoryId;
    stepLink = currentStoryId.stepLink;
    console.log(stepLink);

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

  selectLink() {
    var models, config, ui, state, stepLink, state, projection, layersA, layersB, timeA, timeB, view, zoom, comparisonOn;

    models = this.props.models;
    config = this.props.config;
    ui = this.props.ui;
    state = util.fromQueryString(location.search);
    comparisonOn = state.ca;
    timeA = state.t;
    timeB = state.t1;
    layersA = state.l;
    layersB = state.l1;
    projection = state.p;
    view = state.v;
    zoom = state.z;

    // Set Projection
    if (projection) models.proj.select(projection);

    // Set Layer A time
    if (timeA) models.date.select(util.parseDateUTC(timeA));
    // Set Layer B time
    if (timeB) models.date.select(util.parseDateUTC(timeB));

    // Set Zoom & View
    // if (view) models.map.update(view);
    // if (zoom && view) ui.naturalEvents.zoomToEvent(event, date, isSameEventID)

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
  }

  render() {
    var { description, metaLoaded } = this.state;
    var currentStoryIndex = this.props.currentStoryIndex;
    var modalStarted = this.props.modalInProgress;
    if (modalStarted && !metaLoaded) {
      this.setState({ metaLoaded: true });
      this.fetchMetadata(currentStoryIndex, 1);
      this.stepLink(currentStoryIndex, 1);
      this.selectLink();
    }

    return (
      <div>
        <Modal isOpen={this.props.modalInProgress} toggle={this.props.toggleModalInProgress} wrapClassName='tour tour-in-progress' className={this.props.className + ' ' + this.props.currentStory['type']} backdrop={false}>
          <ModalHeader toggle={this.props.toggleModalInProgress} charCode="">{this.props.currentStory['title']}<i className="modal-icon" aria-hidden="true"></i></ModalHeader>
          <ModalBody>
            <div dangerouslySetInnerHTML={{ __html: description }} />
          </ModalBody>
          <ModalFooter>
            <Steps currentStep={this.props.currentStep} totalSteps={this.props.totalSteps} decreaseStep={this.props.decreaseStep} incrementStep={this.props.incrementStep}></Steps>
          </ModalFooter>
        </Modal>
      </div>
    );
  }
}

export default ModalInProgress;

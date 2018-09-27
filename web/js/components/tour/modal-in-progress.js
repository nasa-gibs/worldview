import React from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import Steps from './widget-steps';
import util from '../../util/util';

class ModalInProgress extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      title: 'Story Title',
      desciption: '',
      metaLoaded: false,
      isLoading: false,
      error: null
    };

    this.fetchMetadata = this.fetchMetadata.bind(this);
    this.stepLink = this.stepLink.bind(this);
  }

  componentDidMount() {
    var tourId = this.props.tourId;
    var stepIndex = this.props.steps;
    this.fetchMetadata(tourId, stepIndex);
  }

  componentWillReceiveProps(nextProps) {
    var tourIndex = this.props.tourIndex;
    var tourId = this.props.tourId;
    if (nextProps.steps !== this.props.steps) {
      var stepIndex = nextProps.steps;
      this.fetchMetadata(tourId, stepIndex);
      this.stepLink(tourIndex, stepIndex);
    }
  }

  fetchMetadata(tourId, stepIndex) {
    stepIndex = stepIndex.toString().padStart(3, '0');
    this.setState({ isLoading: true });

    var { origin, pathname } = window.location;
    var errorMessage = '<p>There was an error loading this description.</p>';
    var uri = `${origin}${pathname}stories/${tourId}/step${stepIndex}.html`;
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

  stepLink(tourIndex, stepIndex) {
    var models, config, ui, stepLink, state, projection, layersA, layersB, timeA, timeB, view, zoom, comparisonOn;
    stepIndex = (stepIndex - 1).toString().padStart(0, '0');
    stepLink = this.props.tourSteps[`${stepIndex}`].stepLink;
    models = this.props.models;
    config = this.props.config;
    ui = this.props.ui;

    // Get URL Link here from JSON file (for each step)
    // Push Link to Browser URL
    if (util.browser.history) {
      window.history.pushState(
        '',
        '@OFFICIAL_NAME@',
        '?' + stepLink
      );
    }
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
    var layersAArray = layersA.split(',');

    // Set current layers visible
    models.layers[layerString].forEach(function(layer) {
      models.layers.setVisibility(layer.id, false, layerString);
    });

    // Remove layers in the list
    models.layers[layerString].forEach(function(layer) {
      models.layers.remove(layer.id, false, layerString);
    });

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

  render() {
    var { description, metaLoaded } = this.state;
    var tourIndex = this.props.tourIndex;
    var modalStarted = this.props.modalInProgress;
    if (modalStarted && !metaLoaded) {
      this.setState({ metaLoaded: true });
      this.stepLink(tourIndex, 1);
    }

    return (
      <div>
        <Modal isOpen={this.props.modalInProgress} toggle={this.props.toggleModalInProgress} wrapClassName='tour tour-in-progress' className={this.props.className + ' ' + this.props.tourType} backdrop={false}>
          <ModalHeader toggle={this.props.toggleModalInProgress} charCode="">{this.props.tourTitle}<i className="modal-icon" aria-hidden="true"></i></ModalHeader>
          <ModalBody>
            <div dangerouslySetInnerHTML={{ __html: description }} />
          </ModalBody>
          <ModalFooter>
            <Steps steps={this.props.steps} totalSteps={this.props.totalSteps} decreaseStep={this.props.decreaseStep} incrementStep={this.props.incrementStep}></Steps>
          </ModalFooter>
        </Modal>
      </div>
    );
  }
}

export default ModalInProgress;

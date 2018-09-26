import React from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import util from '../../util/util';

class ModalInProgress extends React.Component {
  constructor(props) {
    super(props);

    this.appLink = this.appLink.bind(this);
  }

  // appLink(url) {
  //   var events = util.events();
  //   if (util.browser.history) {
  //     window.history.pushState(
  //       '',
  //       '@OFFICIAL_NAME@',
  //       '?' + 'p=geographic&l=VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor,MODIS_Terra_Sea_Ice(hidden),MODIS_Aqua_Sea_Ice(hidden),MODIS_Aqua_Brightness_Temp_Band31_Night(hidden),MODIS_Aqua_Brightness_Temp_Band31_Day(hidden),MODIS_Terra_Brightness_Temp_Band31_Night(hidden),MODIS_Terra_Brightness_Temp_Band31_Day(hidden),VIIRS_SNPP_DayNightBand_ENCC,Reference_Labels,Reference_Features,Coastlines(hidden)&t=2017-07-12-T00:00:00Z&z=3&v=-64.10884765624996,-69.967890625,-58.48384765624997,-65.79748046875'
  //     );
  //     // window.location.reload();
  //     events.trigger('update');
  //   }
  // }
  appLink(url) {
    var models, config, ui, state, projection, layersA, layersB, timeA, timeB, view, zoom, comparisonOn;

    models = this.props.models;
    config = this.props.config;
    ui = this.props.ui;

    // Get URL Link here from JSON file (for each step)
    // Push Link to Browser URL
    if (util.browser.history) {
      window.history.pushState(
        '',
        '@OFFICIAL_NAME@',
        '?' + '?p=geographic&l=MODIS_Terra_CorrectedReflectance_TrueColor(hidden),NDH_Drought_Hazard_Frequency_Distribution_1980-2000&t=2017-09-12-T00%3A00%3A00Z&z=3&v=-92.97100941425803,-120.65365504255328,66.357115585742,5.998701948972162'
      );
    }
    state = util.fromQueryString(location.search);
    console.log(state);
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

    // Remove layers in the list first
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
    return (
      <div>
        <Modal isOpen={this.props.modalInProgress} toggle={this.props.toggleModalInProgress} wrapClassName='tour tour-in-progress' className={this.props.className + ' wildfire'} backdrop={false}>
          <ModalHeader toggle={this.props.toggleModalInProgress} charCode="">Story Title<i className="modal-icon" aria-hidden="true"></i></ModalHeader>
          <ModalBody>

          </ModalBody>
          <ModalFooter>
            <div className="step-container">
              <a href="#" className={this.props.steps === 1 ? 'step-previous disabled' : 'step-previous'} aria-label="Previous" onClick={this.props.decreaseStep}>
                <i className="fa fa-arrow-circle-left" aria-hidden="true"></i>
              </a>
              <div className="step-counter">
                <p>Step <span className="step-current">{this.props.steps}</span>/<span className="step-total">{this.props.totalSteps}</span>
                </p>
              </div>
              <a href="#" className={this.props.steps === this.props.totalSteps ? 'step-next disabled' : 'step-next'} aria-label="Next" onClick={this.appLink}>
                <i className="fa fa-arrow-circle-right" aria-hidden="true"></i>
              </a>
            </div>
          </ModalFooter>
        </Modal>
      </div>
    );
  }
}

export default ModalInProgress;
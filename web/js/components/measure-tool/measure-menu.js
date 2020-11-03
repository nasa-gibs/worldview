import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import React, { Component } from 'react';
import { Form } from 'reactstrap';

import { onToggle } from '../../modules/modal/actions';
import IconList from '../util/list';
import { changeUnits } from '../../modules/measure/actions';

const DOWNLOAD_GEOJSON = {
  text: 'Download as GeoJSON',
  iconClass: 'ui-icon icon-large',
  iconName: 'download',
  id: 'download-geojson-button',
  key: 'measure-download-geojson',
  className: 'measure-download',
};
const DOWNLOAD_SHAPEFILE = {
  text: 'Download as Shapefiles',
  iconClass: 'ui-icon icon-large',
  iconName: 'download',
  id: 'download-shapefiles-button',
  key: 'measure-download-shapefile',
};
const OPTIONS_ARRAY = [
  {
    text: 'Measure distance',
    iconClass: 'ui-icon icon-large',
    iconName: 'ruler',
    id: 'measure-distance-button',
    key: 'measure-distance',
  },
  {
    text: 'Measure area',
    iconClass: 'ui-icon icon-large',
    iconName: 'ruler-combined',
    id: 'measure-area-button',
    key: 'measure-area',
  },
  {
    text: 'Remove Measurements',
    iconClass: 'ui-icon icon-large',
    iconName: 'trash',
    id: 'clear-measurements-button',
    key: 'measure-clear',
  },
  DOWNLOAD_GEOJSON,
  // DOWNLOAD_SHAPEFILE,
];

class MeasureMenu extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tooltipOpen: false,
    };
    this.tooltipToggle = this.tooltipToggle.bind(this);
    this.triggerEvent = this.triggerEvent.bind(this);
    this.unitToggle = this.unitToggle.bind(this);
  }

  triggerEvent(eventName) {
    const { map, onCloseModal } = this.props;
    map.ui.events.trigger(eventName);
    onCloseModal();
  }

  unitToggle(evt) {
    const { onToggleUnits } = this.props;
    const { checked } = evt.target;
    const units = checked ? 'mi' : 'km';
    onToggleUnits(units);
  }

  tooltipToggle() {
    this.setState((prevState) => ({
      tooltipOpen: !prevState.tooltipOpen,
    }));
  }

  render() {
    const {
      isTouchDevice, unitOfMeasure, measurementsInProj, isMobile,
    } = this.props;
    const listSize = isTouchDevice ? 'medium' : 'small';
    DOWNLOAD_SHAPEFILE.hidden = !measurementsInProj || isMobile;
    DOWNLOAD_GEOJSON.hidden = !measurementsInProj || isMobile;
    return (
      <>
        <Form>
          <div className="measure-unit-toggle custom-control custom-switch">
            <input
              id="unit-toggle"
              className="custom-control-input"
              type="checkbox"
              onChange={this.unitToggle}
              defaultChecked={unitOfMeasure === 'mi'}
            />
            <label className="custom-control-label" htmlFor="unit-toggle">
              {unitOfMeasure}
            </label>
          </div>
        </Form>
        <IconList
          list={OPTIONS_ARRAY}
          onClick={this.triggerEvent}
          size={listSize}
        />
      </>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const {
    modal, map, measure, proj, browser,
  } = state;
  const { unitOfMeasure, allMeasurements } = measure;
  const { crs } = proj.selected;
  const measurementsInProj = !!Object.keys(allMeasurements[crs]).length;
  return {
    isMobile: browser.lessThan.medium,
    isTouchDevice: modal.customProps.touchDevice,
    map,
    unitOfMeasure,
    measurementsInProj,
  };
};
const mapDispatchToProps = (dispatch, ownProps) => ({
  onToggleUnits: (unitOfMeasure) => {
    dispatch(changeUnits(unitOfMeasure));
  },
  onCloseModal: (eventName) => {
    dispatch(onToggle());
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(MeasureMenu);

MeasureMenu.propTypes = {
  isMobile: PropTypes.bool,
  isTouchDevice: PropTypes.bool,
  map: PropTypes.object,
  measurementsInProj: PropTypes.bool,
  onCloseModal: PropTypes.func,
  onToggleUnits: PropTypes.func,
  unitOfMeasure: PropTypes.string,
};

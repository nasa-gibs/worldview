import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { onToggle } from '../../modules/modal/actions';
import IconList from '../util/list';
import { changeUnits, useGreatCircle } from '../../modules/measure/actions';
import { FormGroup, Label, Input } from 'reactstrap';
import AlertUtil from '../util/alert';
// import googleTagManager from 'googleTagManager';

const OPTIONS_ARRAY = [
  {
    text: 'Measure distance',
    iconClass: 'ui-icon icon-large fa fa-ruler fa-fw',
    id: 'measure-distance-button',
    key: 'measure-distance'
  },
  {
    text: 'Measure area',
    iconClass: 'ui-icon icon-large fa fa-ruler-combined fa-fw',
    id: 'measure-area-button',
    key: 'measure-area'
  },
  {
    text: 'Remove Measurements',
    iconClass: 'ui-icon icon-large fa fa-trash fa-fw',
    id: 'clear-measurements-button',
    key: 'measure-clear'
  }
];

class MeasureMenu extends Component {
  constructor(props) {
    super(props);
    this.state = {
      units: props.units,
      useGreatCircleMeasurements: props.useGreatCircleMeasurements
    };
  }

  triggerEvent(eventName) {
    const { map, onCloseModal } = this.props;
    map.ui.events.trigger(eventName);
    onCloseModal();
  }

  unitToggle(evt) {
    const { checked } = evt.target;
    const units = checked ? 'mi' : 'km';
    this.props.onToggleUnits(units);
  }

  useGreatCircle(evt) {
    const { checked } = evt.target;
    this.props.onToggleUseGreatCircle(checked);
  }

  render() {
    const { clickType } = this.props;
    const isMobile = clickType === 'touchstart';
    return (
      <>
        {isMobile && <AlertUtil
          isOpen={true}
          timeout={15000}
          iconClassName=' '
          title='Measure Tool'
          message='Tap to add a point.  Double tap to complete.'
        />}

        <FormGroup check>
          <Label check>
            <Input
              id="great-circle-toggle"
              type="checkbox"
              onChange={this.useGreatCircle.bind(this)}
              defaultChecked={this.state.useGreatCircleMeasurements}
            />
            {' '} Great circle? <i className="fas fa-info-circle"></i>
          </Label>
        </FormGroup>

        <div className="measure-unit-toggle custom-control custom-switch">
          <label htmlFor="unit-toggle">km</label>
          <input
            id="unit-toggle"
            className="custom-control-input"
            type="checkbox"
            onChange={this.unitToggle.bind(this)}
            defaultChecked={this.state.units === 'mi'}/>
          <label className="custom-control-label" htmlFor="unit-toggle">mi</label>
        </div>
        <IconList
          list={OPTIONS_ARRAY}
          onClick={this.triggerEvent.bind(this)}
          size="small"
        />
      </>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    clickType: state.modal.customProps.clickType,
    isMobile: state.browser.lessThan.medium,
    map: state.map,
    units: state.measure.units,
    useGreatCircleMeasurements: state.measure.useGreatCircleMeasurements
  };
};
const mapDispatchToProps = (dispatch, ownProps) => ({
  onToggleUnits: (units) => {
    dispatch(changeUnits(units));
  },
  onToggleUseGreatCircle: (value) => {
    dispatch(useGreatCircle(value));
  },
  onCloseModal: () => {
    dispatch(onToggle());
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MeasureMenu);

MeasureMenu.propTypes = {
  clickType: PropTypes.string,
  map: PropTypes.object,
  onCloseModal: PropTypes.func,
  onToggleUnits: PropTypes.func,
  onToggleUseGreatCircle: PropTypes.func,
  units: PropTypes.string,
  useGreatCircleMeasurements: PropTypes.bool
};

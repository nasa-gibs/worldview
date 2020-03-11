import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import React, { Component } from 'react';
import { onToggle } from '../../modules/modal/actions';
import IconList from '../util/list';
import { changeUnits } from '../../modules/measure/actions';
import { Form } from 'reactstrap';

const OPTIONS_ARRAY = [
  {
    text: 'Measure distance',
    iconClass: 'ui-icon icon-large',
    iconName: 'faRuler',
    id: 'measure-distance-button',
    key: 'measure-distance'
  },
  {
    text: 'Measure area',
    iconClass: 'ui-icon icon-large',
    iconName: 'faRulerCombined',
    id: 'measure-area-button',
    key: 'measure-area'
  },
  {
    text: 'Remove Measurements',
    iconClass: 'ui-icon icon-large',
    iconName: 'faTrash',
    id: 'clear-measurements-button',
    key: 'measure-clear'
  }
];

class MeasureMenu extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showAlert: false,
      tooltipOpen: false
    };
    this.tooltipToggle = this.tooltipToggle.bind(this);
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

  tooltipToggle() {
    this.setState({
      tooltipOpen: !this.state.tooltipOpen
    });
  }

  render() {
    const { isTouchDevice } = this.props;
    const listSize = isTouchDevice ? 'medium' : 'small';
    return (
      <>
        <Form>
          <div className="measure-unit-toggle custom-control custom-switch">
            <input
              id="unit-toggle"
              className="custom-control-input"
              type="checkbox"
              onChange={this.unitToggle.bind(this)}
              defaultChecked={this.props.units === 'mi'}/>
            <label className="custom-control-label" htmlFor="unit-toggle">
              {this.props.units}
            </label>
          </div>
        </Form>
        <IconList
          list={OPTIONS_ARRAY}
          onClick={this.triggerEvent.bind(this)}
          size={listSize}
        />
      </>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    isTouchDevice: state.modal.customProps.touchDevice,
    map: state.map,
    units: state.measure.units
  };
};
const mapDispatchToProps = (dispatch, ownProps) => ({
  onToggleUnits: (units) => {
    dispatch(changeUnits(units));
  },
  onCloseModal: (eventName) => {
    dispatch(onToggle());
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MeasureMenu);

MeasureMenu.propTypes = {
  isTouchDevice: PropTypes.bool,
  map: PropTypes.object,
  onCloseModal: PropTypes.func,
  onToggleUnits: PropTypes.func,
  units: PropTypes.string
};

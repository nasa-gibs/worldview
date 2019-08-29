import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { onToggle } from '../../modules/modal/actions';
import {
  measureDistance,
  measureArea,
  clearMeasurements,
  changeUnitOfMeasure
} from '../../modules/measure/actions';
import IconList from '../util/list';
// import googleTagManager from 'googleTagManager';

const OPTIONS_ARRAY = [
  {
    text: 'Measure distance',
    iconClass: 'ui-icon icon-large fa - fa-fw',
    id: 'measure-distance-button',
    key: measureDistance
  },
  {
    text: 'Measure area',
    iconClass: 'ui-icon icon-large fa - fa-fw',
    id: 'measure-area-button',
    key: measureArea
  },
  {
    text: 'Clear Measurements',
    iconClass: 'ui-icon icon-large fa - fa-fw',
    id: 'clear-measurements-button',
    key: clearMeasurements
  }
];

class MeasureMenu extends Component {
  dispatchAction(action) {
    const { dispatchAction, onCloseModal } = this.props;
    dispatchAction(action);
    onCloseModal();
    // googleTagManager.pushEvent({
    //   event: 'measure_tool'
    // });
  }

  unitToggle(evt) {
    const { dispatchAction } = this.props;
    const { checked } = evt.target;
    const value = checked ? 'mi' : 'km';
    dispatchAction(changeUnitOfMeasure, value);
  }

  render() {
    return (
      <>
        <div className="measure-unit-toggle custom-control custom-switch">
          <label htmlFor="unit-toggle">km</label>
          <input
            id="unit-toggle"
            className="custom-control-input"
            type="checkbox"
            onChange={this.unitToggle.bind(this)}/>
          <label className="custom-control-label" htmlFor="unit-toggle">mi</label>
        </div>
        <IconList
          list={OPTIONS_ARRAY}
          onClick={this.dispatchAction.bind(this)}
          size="small"
        />
      </>
    );
  }
}

const mapDispatchToProps = (dispatch, ownProps) => ({
  dispatchAction: (action, value) => {
    dispatch(action(value));
  },
  onCloseModal: () => {
    dispatch(onToggle());
  }
});

export default connect(
  null,
  mapDispatchToProps
)(MeasureMenu);

MeasureMenu.propTypes = {
  dispatchAction: PropTypes.func,
  onCloseModal: PropTypes.func
};

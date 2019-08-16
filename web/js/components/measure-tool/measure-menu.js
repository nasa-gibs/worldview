import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { onToggle } from '../../modules/modal/actions';
import { measureDistance, measureArea, clearMeasurements } from '../../modules/measure/actions';
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

  render() {
    return (
      <IconList
        list={OPTIONS_ARRAY}
        onClick={this.dispatchAction.bind(this)}
        size="small"
      />
    );
  }
}

const mapDispatchToProps = (dispatch, ownProps) => ({
  dispatchAction: (action) => {
    dispatch(action());
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

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { onToggle } from '../../modules/modal/actions';
import IconList from '../util/list';
// import googleTagManager from 'googleTagManager';

const OPTIONS_ARRAY = [
  {
    text: 'Measure distance',
    iconClass: 'ui-icon icon-large fa - fa-fw',
    id: 'measure-distance-button',
    key: 'measure-distance'
  },
  {
    text: 'Measure area',
    iconClass: 'ui-icon icon-large fa - fa-fw',
    id: 'measure-area-button',
    key: 'measure-area'
  },
  {
    text: 'Clear Measurements',
    iconClass: 'ui-icon icon-large fa - fa-fw',
    id: 'clear-measurements-button',
    key: 'measure-clear'
  }
];

class MeasureMenu extends Component {
  triggerEvent(eventName) {
    const { map, onCloseModal } = this.props;
    map.ui.events.trigger(eventName);
    onCloseModal();
  }

  unitToggle(evt) {
    const { map } = this.props;
    const { checked } = evt.target;
    const value = checked ? 'mi' : 'km';
    map.ui.events.trigger('measure-toggle-units', value);
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
          onClick={this.triggerEvent.bind(this)}
          size="small"
        />
      </>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({ map: state.map });
const mapDispatchToProps = (dispatch, ownProps) => ({
  onCloseModal: () => {
    dispatch(onToggle());
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MeasureMenu);

MeasureMenu.propTypes = {
  dispatchAction: PropTypes.func,
  map: PropTypes.object,
  onCloseModal: PropTypes.func
};

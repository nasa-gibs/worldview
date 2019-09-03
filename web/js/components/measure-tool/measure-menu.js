import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { onToggle } from '../../modules/modal/actions';
import IconList from '../util/list';
import { changeUnits } from '../../modules/measure/actions';
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
      units: props.units
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
    this.props.toggleUnits(units);
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

const mapStateToProps = (state, ownProps) => ({
  map: state.map,
  units: state.measure.units
});
const mapDispatchToProps = (dispatch, ownProps) => ({
  toggleUnits: (units) => {
    dispatch(changeUnits(units));
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
  map: PropTypes.object,
  onCloseModal: PropTypes.func,
  toggleUnits: PropTypes.func,
  units: PropTypes.string
};

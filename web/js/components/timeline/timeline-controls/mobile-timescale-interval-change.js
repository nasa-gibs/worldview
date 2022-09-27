import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  Dropdown, DropdownToggle, DropdownMenu, DropdownItem,
} from 'reactstrap';
import {
  TIME_SCALE_TO_NUMBER,
  TIME_SCALE_FROM_NUMBER,
} from '../../../modules/date/constants';
import {
  toggleCustomModal as toggleCustomModalAction,
  selectInterval as selectIntervalAction,
} from '../../../modules/date/actions';

const MobileTimeScaleIntervalChange = (props) => {
  const {
    customDelta,
    customInterval,
    timeScaleChangeUnit,
    customSelected,
    selectInterval,
    hasSubdailyLayers,
  } = props;

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggle = () => setDropdownOpen((prevState) => !prevState);

  const handleClickInterval = (timescale) => {
    // send props function to change timescale interval throughout app
    setTimeScaleIntervalChangeUnit(timescale);
  };

  const setTimeScaleIntervalChangeUnit = (timeScale) => {
    const customSelected = timeScale === 'custom';
    let delta;
    let newTimeScale = timeScale;

    if (customSelected && customInterval && customDelta) {
      newTimeScale = customInterval;
      delta = customDelta;
    } else {
      newTimeScale = Number(TIME_SCALE_TO_NUMBER[newTimeScale]);
      delta = 1;
    }
    selectInterval(delta, newTimeScale, customSelected);
  };

  const setCustomIntervalText = () => {
    const { customDelta, customInterval } = this.props;
    this.setState({
      customIntervalText: `${customDelta} ${TIME_SCALE_FROM_NUMBER[customInterval]}`,
    });
  };

  const resetCustomIntervalText = () => {
    this.setState({
      customIntervalText: 'Custom',
    });
  };

  return (
    <div className="mobile-timescale-dropdown">
      <Dropdown isOpen={dropdownOpen} toggle={toggle}>
        <DropdownToggle caret>
          Increments
        </DropdownToggle>
        <DropdownMenu>
          <DropdownItem>
            <span onClick={() => handleClickInterval('year')}>
              Year
            </span>
          </DropdownItem>
          <DropdownItem>
            <span onClick={() => handleClickInterval('month')}>
              Month
            </span>
          </DropdownItem>
          <DropdownItem>
            <span onClick={() => handleClickInterval('day')}>
              Day
            </span>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </div>
  );
};

const mapDispatchToProps = (dispatch) => ({
  selectInterval: (delta, timeScale, customSelected) => {
    dispatch(selectIntervalAction(delta, timeScale, customSelected));
  },
});

const mapStateToProps = (state) => {
  const { date } = state;
  const {
    interval, customInterval, customDelta, customSelected,
  } = date;
  return {
    interval,
    customInterval,
    customDelta,
    customSelected,
  };
};

MobileTimeScaleIntervalChange.propTypes = {
  customDelta: PropTypes.number,
  customInterval: PropTypes.number,
  customSelected: PropTypes.bool,
  hasSubdailyLayers: PropTypes.bool,
  interval: PropTypes.number,
  isDisabled: PropTypes.bool,
  selectInterval: PropTypes.func,
  timeScaleChangeUnit: PropTypes.string,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(MobileTimeScaleIntervalChange);

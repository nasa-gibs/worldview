import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Dropdown, DropdownToggle, DropdownMenu, DropdownItem,
} from 'reactstrap';
import {
  TIME_SCALE_FROM_NUMBER,
} from '../../../modules/date/constants';

/*
 * TimeScaleSelect for Custom Interval Selector
 * group. It is a child component.
 *
 * @class TimeScaleSelect
 */
function IntervalSelect(props) {
  const {
    zoomLevel,
    hasSubdailyLayers,
    isMobile,
    changeZoomLevel,
    interval,
  } = props;

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggle = () => setDropdownOpen((prevState) => !prevState);

  const handleChangeZoomLevel = (e) => {
    const zoomLevel = e.target.value;
    changeZoomLevel(zoomLevel);
  };

  const handleChangeZoomLevelMobile = (increment) => {
    changeZoomLevel(increment);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
  };

  return (
    <>
      {isMobile ? (
        <div className="mobile-timescale-dropdown">
          <Dropdown isOpen={dropdownOpen} toggle={toggle}>
            <DropdownToggle caret>
              {TIME_SCALE_FROM_NUMBER[interval].toUpperCase()}
            </DropdownToggle>
            <DropdownMenu>
              <DropdownItem onClick={() => handleChangeZoomLevelMobile('year')}>
                <span>
                  Year
                </span>
              </DropdownItem>
              <DropdownItem onClick={() => handleChangeZoomLevelMobile('month')}>
                <span>
                  Month
                </span>
              </DropdownItem>
              <DropdownItem onClick={() => handleChangeZoomLevelMobile('day')}>
                <span>
                  Day
                </span>
              </DropdownItem>
              {hasSubdailyLayers ? (
                <>
                  <DropdownItem onClick={() => handleChangeZoomLevelMobile('hour')}>
                    <span>
                      Hour
                    </span>
                  </DropdownItem>
                  <DropdownItem onClick={() => handleChangeZoomLevelMobile('minute')}>
                    <span>
                      Minute
                    </span>
                  </DropdownItem>
                </>
              ) : null}
            </DropdownMenu>
          </Dropdown>
        </div>
      ) : (
        <form
          className="custom-interval-timescale-select-form-container no-drag"
          onSubmit={handleSubmit}
        >
          <select
            className="custom-interval-timescale-select no-drag"
            value={zoomLevel}
            onChange={handleChangeZoomLevel}
          >
            <option className="custom-interval-timescale-select-option no-drag" value="year">year</option>
            <option className="custom-interval-timescale-select-option no-drag" value="month">month</option>
            <option className="custom-interval-timescale-select-option no-drag" value="day">day</option>
            {hasSubdailyLayers
              ? (
                <>
                  <option className="custom-interval-timescale-select-option no-drag" value="hour">hour</option>
                  <option className="custom-interval-timescale-select-option no-drag" value="minute">minute</option>
                </>
              )
              : null}
          </select>
        </form>
      )}
    </>
  );
}

IntervalSelect.propTypes = {
  changeZoomLevel: PropTypes.func,
  hasSubdailyLayers: PropTypes.bool,
  zoomLevel: PropTypes.string,
  isMobile: PropTypes.bool,
  interval: PropTypes.number,
};

export default IntervalSelect;

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from 'reactstrap';

// https://upmostly.com/tutorials/build-a-react-switch-toggle-component
const Switch = (props) => {
  const {
    id,
    color,
    active,
    toggle,
    label,
    tooltip
  } = props;
  const [isActive, toggleActive] = useState(active);
  const [tooltipOpen, toggleTooltip] = useState(false);
  const activeColor = color || '007BFF';
  const style = isActive ? { backgroundColor: '#' + activeColor } : {};

  return (
    <div className='react-switch'>
      <div className='react-switch-case switch-col'>
        <input
          className="react-switch-checkbox"
          id={id}
          type="checkbox"
          checked={isActive}
          onChange={() => {
            // wait for css animation to complete before firing action
            setTimeout(toggle, 200);
            toggleActive(!isActive);
          }}
        />
        <label
          className="react-switch-label"
          htmlFor={id}
          style={style}
        >
          <span className={'react-switch-button'} />
        </label>
      </div>
      <div className='react-switch-label-case switch-col'>
        {label}
        {tooltip &&
          <>
            <i id="availability-filter" className="fa fa-info-circle" />
            <Tooltip
              placement="right"
              isOpen={tooltipOpen}
              target="availability-filter"
              toggle={() => { toggleTooltip(!tooltipOpen); }}>
              {tooltip}
            </Tooltip>
          </>
        }
      </div>
    </div>
  );
};
Switch.propTypes = {
  active: PropTypes.bool,
  color: PropTypes.string,
  id: PropTypes.string,
  label: PropTypes.string,
  toggle: PropTypes.func,
  tooltip: PropTypes.object
};
export default Switch;

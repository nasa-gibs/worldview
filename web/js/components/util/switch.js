import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// https://upmostly.com/tutorials/build-a-react-switch-toggle-component
const Switch = (props) => {
  const {
    border,
    id,
    color,
    containerClassAddition,
    active,
    toggle,
    label,
    tooltip,
  } = props;
  const [isActive, toggleActive] = useState(active);
  const [tooltipOpen, toggleTooltip] = useState(false);
  const activeColor = color || '007BFF';
  const style = isActive ? { backgroundColor: `#${activeColor}` } : {};
  const containerClass = `react-switch ${containerClassAddition || ''} ${border ? 'switch-thin-border' : ''}`;

  useEffect(() => {
    toggleActive(active);
  }, [active]);

  function toggleSwitch() {
    // wait for css animation to complete before firing action
    setTimeout(toggle, 200);
    toggleActive(!isActive);
  }

  return (
    <div className={containerClass}>
      <div className="react-switch-case switch-col">
        <input
          className="react-switch-checkbox"
          id={id}
          type="checkbox"
          checked={isActive}
          onChange={toggleSwitch}
        />
        <label
          className="react-switch-label"
          htmlFor={id}
          style={style}
        >
          <span className="react-switch-button" />
        </label>
      </div>
      <div className="react-switch-label-case switch-col">
        <span
          className="switch-label-text"
          onClick={toggleSwitch}
        >
          {label}
        </span>
        {tooltip
          && (
            <>
              <FontAwesomeIcon icon="info-circle" id={`${id}-switch-tooltip`} />
              <Tooltip
                placement="right"
                isOpen={tooltipOpen}
                target={`${id}-switch-tooltip`}
                toggle={() => { toggleTooltip(!tooltipOpen); }}
              >
                {tooltip}
              </Tooltip>
            </>
          )}
      </div>
    </div>
  );
};
Switch.defaultProps = {
  containerClassAddition: '',
  border: false,
};
Switch.propTypes = {
  active: PropTypes.bool,
  border: PropTypes.bool,
  color: PropTypes.string,
  containerClassAddition: PropTypes.string,
  id: PropTypes.string.isRequired,
  label: PropTypes.string,
  toggle: PropTypes.func,
  tooltip: PropTypes.object,
};

export default Switch;

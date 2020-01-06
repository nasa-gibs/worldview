import React, { useState } from 'react';
// https://upmostly.com/tutorials/build-a-react-switch-toggle-component
const Switch = (props) => {
  const { color, id, active, toggle, label } = props;
  const [isActive, toggleActive] = useState(active);
  const style = color && isActive ? { backgroundColor: '#' + color } : {};
  return (
    <div className='react-switch'>
      <div className='react-switch-case switch-col'>
        <input
          className="react-switch-checkbox"
          id={id}
          type="checkbox"
          checked={isActive}
          onChange={() => {
            setTimeout(function() {
              toggle(); // wait for css animation to complete before firing action
            }, 200);
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
      <div className='react-switch-label-case switch-col'>{label}</div>
    </div>
  );
};

export default Switch;

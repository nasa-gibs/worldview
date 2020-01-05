import React from 'react';
// https://upmostly.com/tutorials/build-a-react-switch-toggle-component
const Switch = (props) => {
  const { color, active, toggle, label } = props;
  const style = color && active ? { backgroundColor: '#' + color } : {};
  return (
    <div className='react-switch'>
      <div className='react-switch-case switch-col'>
        <input
          className="react-switch-checkbox"
          id={`react-switch-new`}
          type="checkbox"
          checked={active}
          onChange={toggle}
        />
        <label
          className="react-switch-label"
          htmlFor={`react-switch-new`}
          style={style}
        >
          <span className={`react-switch-button`} />
        </label>

      </div>
      <div className='react-switch-label-case switch-col'>{label}</div>
    </div>
  );
};

export default Switch;
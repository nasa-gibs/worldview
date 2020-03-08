import React from 'react';
import PropTypes from 'prop-types';

/*
 * @class Button
 * @extends React.Component
 */
export default function Button(props) {
  const {
    id, onClick, style, valid, className, text,
  } = props;
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseDown={(e) => e.stopPropagation()}
      style={style}
      id={id}
      disabled={!valid}
      className={
          valid
            ? `wv-button ${className}`
            : `wv-disabled wv-button ${className}`
        }
    >
      <span className="button-text">{text}</span>
    </button>
  );
}

Button.defaultProps = {
  className: 'gray',
  id: '',
  style: null,
  valid: true,
};
Button.propTypes = {
  className: PropTypes.string,
  id: PropTypes.string,
  onClick: PropTypes.func,
  style: PropTypes.object,
  text: PropTypes.string,
  valid: PropTypes.bool,
};

import React from 'react';
import PropTypes from 'prop-types';

/*
 * @function Arrow Up/Down
 */
function Arrow({ onClick, type, direction }) {
  const containerClassName = `date-arrows date-arrow-${direction}`;
  const arrowClassName = `${direction}arrow`;

  return (
    <div
      onClick={onClick}
      className={containerClassName}
      data-interval={type}
    >
      <svg width="25" height="8">
        <path d="M 12.5,0 25,8 0,8 z" className={arrowClassName} />
      </svg>
    </div>
  );
}

Arrow.propTypes = {
  direction: PropTypes.string,
  onClick: PropTypes.func,
  type: PropTypes.string,
};

export default Arrow;

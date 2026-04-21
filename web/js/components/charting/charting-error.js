import React from 'react';
import PropTypes from 'prop-types';

function ChartingError(props) {
  const { msg } = props;
  return (
    <div className="charting-error-container">
      <div className="charting-error-text">
        {msg}
      </div>
    </div>
  );
}

ChartingError.propTypes = {
  msg: PropTypes.string,
};

export default ChartingError;

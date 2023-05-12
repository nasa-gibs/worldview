import React from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

function Steps(props) {
  const {
    currentStep, decreaseStep, incrementStep, totalSteps,
  } = props;
  return (
    <div className="step-container">
      <a
        className="step-previous"
        aria-label="Previous"
        onClick={decreaseStep}
      >
        <FontAwesomeIcon icon="arrow-circle-left" />
      </a>
      <div className="step-counter">
        <p>
          Step
          {' '}
          <span className="step-current">{currentStep}</span>
          /
          <span className="step-total">{totalSteps}</span>
        </p>
      </div>
      <a
        className="step-next"
        aria-label="Next"
        onClick={incrementStep}
      >
        {currentStep === totalSteps
          ? <FontAwesomeIcon icon="check-circle" />
          : <FontAwesomeIcon icon="arrow-circle-right" />}
      </a>
    </div>
  );
}

Steps.propTypes = {
  currentStep: PropTypes.number.isRequired,
  decreaseStep: PropTypes.func.isRequired,
  incrementStep: PropTypes.func.isRequired,
  totalSteps: PropTypes.number.isRequired,
};

export default Steps;

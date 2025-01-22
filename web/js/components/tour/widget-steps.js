import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

function Steps(props) {
  const {
    currentStep, decreaseStep, incrementStep, totalSteps, isKioskModeActive,
  } = props;

  const handleKeyDown = (event) => {
    switch (event.key) {
      case 'q':
        decreaseStep();
        break;
      case 'w':
        incrementStep();
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    if (!isKioskModeActive) return;

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const buttonStyle = {
    border: 'none',
    background: 'none',
    padding: '0',
  };

  return (
    <div className="step-container">
      <button
        type="button"
        style={buttonStyle}
        className={isKioskModeActive ? 'd-none' : 'step-previous'}
        aria-label="Previous"
        onClick={decreaseStep}
      >
        <FontAwesomeIcon icon="arrow-circle-left" />
      </button>
      <div className="step-counter">
        <p>
          Step
          {' '}
          <span className="step-current">{currentStep}</span>
          /
          <span className="step-total">{totalSteps}</span>
        </p>
      </div>
      <button
        type="button"
        style={buttonStyle}
        className={isKioskModeActive ? 'd-none' : 'step-next'}
        aria-label="Next"
        onClick={incrementStep}
      >
        {currentStep === totalSteps
          ? <FontAwesomeIcon icon="check-circle" />
          : <FontAwesomeIcon icon="arrow-circle-right" />}
      </button>
    </div>
  );
}

Steps.propTypes = {
  currentStep: PropTypes.number.isRequired,
  decreaseStep: PropTypes.func.isRequired,
  incrementStep: PropTypes.func.isRequired,
  totalSteps: PropTypes.number.isRequired,
  isKioskModeActive: PropTypes.bool.isRequired,
};

export default Steps;

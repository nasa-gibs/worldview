import React from 'react';
import PropTypes from 'prop-types';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faArrowCircleLeft, faArrowCircleRight } from '@fortawesome/free-solid-svg-icons';

class Steps extends React.Component {
  render() {
    const { currentStep, decreaseStep, incrementStep, totalSteps } = this.props;
    return (
      <div className="step-container">
        <a
          className={'step-previous'}
          aria-label="Previous"
          onClick={decreaseStep}
        >
          <FontAwesomeIcon icon={faArrowCircleLeft} />
        </a>
        <div className="step-counter">
          <p>
            Step <span className="step-current">{currentStep}</span>/
            <span className="step-total">{totalSteps}</span>
          </p>
        </div>
        <a
          className="step-next"
          aria-label="Next"
          onClick={incrementStep}
        >
          {currentStep === totalSteps
            ? <FontAwesomeIcon icon={faCheckCircle} />
            : <FontAwesomeIcon icon={faArrowCircleRight} />
          }
        </a>
      </div>
    );
  }
}

Steps.propTypes = {
  currentStep: PropTypes.number.isRequired,
  decreaseStep: PropTypes.func.isRequired,
  incrementStep: PropTypes.func.isRequired,
  totalSteps: PropTypes.number.isRequired
};

export default Steps;

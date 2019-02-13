import React from 'react';
import PropTypes from 'prop-types';

class Steps extends React.Component {
  render() {
    return (
      <div className="step-container">
        <a href="#" className={'step-previous'} aria-label="Previous" onClick={this.props.decreaseStep}>
          <i className="fa fa-arrow-circle-left" aria-hidden="true"></i>
        </a>
        <div className="step-counter">
          <p>Step <span className="step-current">{this.props.currentStep}</span>/<span className="step-total">{this.props.totalSteps}</span>
          </p>
        </div>
        <a href="#" className="step-next" aria-label="Next" onClick={this.props.incrementStep}>
          <i className={this.props.currentStep === this.props.totalSteps ? 'fa fa-check-circle' : 'fa fa-arrow-circle-right'} aria-hidden="true"></i>
        </a>
      </div>
    );
  }
}

Steps.propTypes = {
  currentStep: PropTypes.number.isRequired,
  totalSteps: PropTypes.number.isRequired,
  decreaseStep: PropTypes.func.isRequired,
  incrementStep: PropTypes.func.isRequired
};

export default Steps;

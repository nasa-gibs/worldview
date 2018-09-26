import React from 'react';

class Steps extends React.Component {

  render() {
    return (
      <div className="step-container">
        <a href="#" className={this.props.steps === 1 ? 'step-previous disabled' : 'step-previous'} aria-label="Previous" onClick={this.props.decreaseStep}>
          <i className="fa fa-arrow-circle-left" aria-hidden="true"></i>
        </a>
        <div className="step-counter">
          <p>Step <span className="step-current">{this.props.steps}</span>/<span className="step-total">{this.props.totalSteps + 1}</span>
          </p>
        </div>
        <a href="#" className={this.props.steps === this.props.totalSteps + 1 ? 'step-next disabled' : 'step-next'} aria-label="Next" onClick={this.props.incrementStep}>
          <i className="fa fa-arrow-circle-right" aria-hidden="true"></i>
        </a>
      </div>
    );
  }
}

export default Steps;

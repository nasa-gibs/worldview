import React from 'react';
import TourStart from './start';
import TourInProgress from './in-progress';
import TourComplete from './complete';

class Tour extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      modalStart: true,
      modalInProgress: false,
      modalComplete: false,
      steps: 1,
      totalSteps: 10
    };

    this.toggleModalStart = this.toggleModalStart.bind(this);
    this.toggleModalInProgress = this.toggleModalInProgress.bind(this);
    this.toggleModalComplete = this.toggleModalComplete.bind(this);
    this.startTour = this.startTour.bind(this);
    this.restartTour = this.restartTour.bind(this);
    this.incrementStep = this.incrementStep.bind(this);
    this.decreaseStep = this.decreaseStep.bind(this);
  }

  toggleModalStart(e) {
    e.preventDefault();
    this.setState({
      modalStart: !this.state.modalStart
    });
  }

  toggleModalInProgress(e) {
    e.preventDefault();
    this.setState({
      modalInProgress: !this.state.modalInProgress
    });
  }

  toggleModalComplete(e) {
    e.preventDefault();
    this.setState({
      modalComplete: !this.state.modalComplete
    });
  }

  startTour(e) {
    e.preventDefault();
    this.setState({
      modalStart: false,
      modalInProgress: true,
      modalComplete: false
    });
  }

  restartTour(e) {
    e.preventDefault();
    this.setState({
      modalStart: true,
      modalInProgress: false,
      modalComplete: false
    });
  }

  incrementStep(e) {
    if (this.state.steps + 1 <= this.state.totalSteps) this.setState({ steps: this.state.steps + 1 });
    if (this.state.steps + 1 === this.state.totalSteps) {
      this.toggleModalInProgress(e);
      this.toggleModalComplete(e);
    }
  }

  decreaseStep(e) {
    if (this.state.steps - 1 >= 1) this.setState({ steps: this.state.steps - 1 });
  }

  render() {
    return (
      <div>
        <TourStart modalStart={this.state.modalStart} toggleModalStart={this.toggleModalStart} toggleModalInProgress={this.toggleModalInProgress} toggleModalComplete={this.toggleModalComplete} startTour={this.startTour}></TourStart>
        <TourInProgress modalInProgress={this.state.modalInProgress} toggleModalStart={this.toggleModalStart} toggleModalInProgress={this.toggleModalInProgress} toggleModalComplete={this.toggleModalComplete} startTour={this.startTour} steps={this.state.steps} totalSteps={this.state.totalSteps} incrementStep={this.incrementStep} decreaseStep={this.decreaseStep}></TourInProgress>
        <TourComplete modalComplete={this.state.modalComplete} toggleModalStart={this.toggleModalStart} toggleModalInProgress={this.toggleModalInProgress} toggleModalComplete={this.toggleModalComplete} restartTour={this.restartTour}></TourComplete>
      </div>
    );
  }
}

export default Tour;
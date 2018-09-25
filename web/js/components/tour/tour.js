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
      modalComplete: false
    };

    this.toggleModalStart = this.toggleModalStart.bind(this);
    this.toggleModalInProgress = this.toggleModalInProgress.bind(this);
    this.toggleModalComplete = this.toggleModalComplete.bind(this);

    this.startTour = this.startTour.bind(this);
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
      modalInProgress: true
    });
  }

  render() {
    return (
      <div>
        <TourStart modalStart={this.state.modalStart} toggleModalStart={this.toggleModalStart} toggleModalInProgress={this.toggleModalInProgress} toggleModalComplete={this.toggleModalComplete} startTour={this.startTour}></TourStart>
        <TourInProgress modalInProgress={this.state.modalInProgress} toggleModalStart={this.toggleModalStart} toggleModalInProgress={this.toggleModalInProgress} toggleModalComplete={this.toggleModalComplete} startTour={this.startTour}></TourInProgress>
        <TourComplete modalComplete={this.state.modalComplete} toggleModalStart={this.toggleModalStart} toggleModalInProgress={this.toggleModalInProgress} toggleModalComplete={this.toggleModalComplete} startTour={this.startTour}></TourComplete>
      </div>
    );
  }
}

export default Tour;
import React from 'react';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import TourStart from './start';
import TourInProgress from './in-progress';
import TourComplete from './complete';

class ModalTour extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      modalStart: true,
      modalInProgress: false,
      modalComplete: false
    };


    this.toggleStart = this.toggleStart.bind(this)
    this.toggleInProgress = this.toggleInProgress.bind(this)
    this.toggleComplete = this.toggleComplete.bind(this)
  }

  toggleStart(e) {
    e.preventDefault();
    this.setState({
      modalStart: !this.state.modalStart
    });
  }

  toggleInProgress(e) {
    e.preventDefault();
    this.setState({
      modalInProgress: !this.state.modalInProgress
    });
  }

  toggleComplete(e) {
    e.preventDefault();
    this.setState({
      modalComplete: !this.state.modalComplete
    });
  }

  render() {
    return (
      <div>
        <TourStart modalStart={this.state.modalStart} toggleStart={this.toggleStart} toggleInProgress={this.toggleInProgress} toggleComplete={this.toggleComplete}></TourStart>
        <TourInProgress modalInProgress={this.state.modalInProgress} toggleStart={this.toggleStart} toggleInProgress={this.toggleInProgress} toggleComplete={this.toggleComplete}></TourInProgress>
        <TourComplete modalComplete={this.state.modalComplete} toggleStart={this.toggleStart} toggleInProgress={this.toggleInProgress} toggleComplete={this.toggleComplete}></TourComplete>
      </div>
    );
  }
}

export default ModalTour;
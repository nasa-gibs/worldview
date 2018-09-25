import React from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

class ModalInProgress extends React.Component {
  render() {

    return (
      <div>
        <Modal isOpen={this.props.modalInProgress} toggle={this.props.toggleModalInProgress} wrapClassName='tour tour-in-progress' className={this.props.className + ' wildfire'} backdrop={false}>
          <ModalHeader toggle={this.props.toggleModalInProgress} charCode="">Story Title<i className="modal-icon" aria-hidden="true"></i></ModalHeader>
          <ModalBody>
            <p>An iceberg about the size of the
            state of Delaware split off from
            Antarctica's Larsen C ice shelf
            between July 10 & July 12, 2017.</p>

            <p>In this view, we can see a distinct
            crack in the ice shelf. Note the date
            in the timeline is on 2018 JUL 12.
            Let’s change the date in the timeline
            to 2018 JUL 10. Move either the
            guitar pick to the left 2 steps or</p>

            <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt
            ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi
            ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
            dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia
            deserunt mollit anim id est laborum.</p>
          </ModalBody>
          <ModalFooter>
            <div className="step-container">
              <a href="#" className={this.props.steps === 1 ? 'step-previous disabled' : 'step-previous'} aria-label="Previous" onClick={this.props.decreaseStep}>
                <i className="fa fa-arrow-circle-left" aria-hidden="true"></i>
              </a>
              <div className="step-counter">
                <p>Step <span className="step-current">{this.props.steps}</span>/<span className="step-total">{this.props.totalSteps}</span>
                </p>
              </div>
              <a href="#" className={this.props.steps === this.props.totalSteps ? 'step-next disabled' : 'step-next'} aria-label="Next" onClick={this.props.incrementStep}>
                <i className="fa fa-arrow-circle-right" aria-hidden="true"></i>
              </a>
            </div>
          </ModalFooter>
        </Modal>
      </div>
    );
  }
}

export default ModalInProgress;
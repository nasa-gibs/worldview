import React from 'react';
import PropTypes from 'prop-types';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

class ModalComplete extends React.Component {
  render() {
    return (
      <div>
        <Modal isOpen={this.props.modalComplete} toggle={this.props.toggleModalComplete} wrapClassName='tour tour-complete' className={this.props.className} backdrop={true}>
          <ModalHeader toggle={this.props.toggleModalComplete} charCode="">Story Complete</ModalHeader>
          <ModalBody>
            <p>You have now completed a story in Worldview. To view more stories, click the "More Stories" button below or, <a href="#">explore more events</a> within the app. Click the "Exit Tutorial" button or close this window to start using Worldview on your own.</p>
          </ModalBody>
          <ModalFooter>
            <button type="button" className="btn btn-primary" onClick={this.props.startTour}>More Stories</button>
            <button type="button" className="btn btn-secondary" onClick={this.props.toggleModalComplete}>Exit Tutorial</button>
          </ModalFooter>
        </Modal>
      </div>
    );
  }
}

ModalComplete.propTypes = {
  modalComplete: PropTypes.bool.isRequired,
  toggleModalComplete: PropTypes.func.isRequired,
  startTour: PropTypes.func.isRequired,
  className: PropTypes.string
};

export default ModalComplete;

import React from 'react';
import PropTypes from 'prop-types';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import Steps from './widget-steps';

class ModalInProgress extends React.Component {
  constructor(props) {
    super(props);

    this.escFunction = this.escFunction.bind(this);
  }

  componentDidMount() {
    document.addEventListener('keydown', this.escFunction, false);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.escFunction, false);
  }

  // Use custom escFunction since tabIndex prevents escape key use on loading WV
  escFunction(e) {
    if (e.keyCode === 27 && this.props.modalInProgress) {
      this.props.endTour();
    }
  }

  componentDidUpdate() {
    if (this.refs.stepContent) this.refs.stepContent.parentNode.scrollTop = 0;
  }

  render() {
    var { description } = this.props;

    return (
      <div>
        <Modal
          isOpen={this.props.modalInProgress}
          toggle={this.props.endTour}
          onClosed={this.props.showTourAlert}
          wrapClassName="tour tour-in-progress"
          className={
            this.props.className + ' ' + this.props.currentStory['type']
          }
          backdrop={false}
          keyboard={false}
        >
          <ModalHeader toggle={this.props.endTour} charCode="">
            {this.props.currentStory['title']}
            <i className="modal-icon" aria-hidden="true" />
          </ModalHeader>
          <ModalBody>
            {/* eslint-disable */}
            <div
              ref="stepContent"
              dangerouslySetInnerHTML={{ __html: description }}
            />
            {/* eslint-enable */}
          </ModalBody>
          <ModalFooter>
            <Steps
              currentStep={this.props.currentStep}
              totalSteps={this.props.totalSteps}
              decreaseStep={this.props.decreaseStep}
              incrementStep={this.props.incrementStep}
            />
          </ModalFooter>
        </Modal>
      </div>
    );
  }
}

ModalInProgress.propTypes = {
  currentStep: PropTypes.number.isRequired,
  currentStory: PropTypes.object.isRequired,
  decreaseStep: PropTypes.func.isRequired,
  endTour: PropTypes.func.isRequired,
  incrementStep: PropTypes.func.isRequired,
  modalInProgress: PropTypes.bool.isRequired,
  showTourAlert: PropTypes.func.isRequired,
  totalSteps: PropTypes.number.isRequired,
  className: PropTypes.string,
  description: PropTypes.string
};

export default ModalInProgress;

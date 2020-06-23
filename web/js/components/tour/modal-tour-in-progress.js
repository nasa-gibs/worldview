import React from 'react';
import PropTypes from 'prop-types';
import {
  Modal, ModalHeader, ModalBody, ModalFooter,
} from 'reactstrap';
import Steps from './widget-steps';

class ModalInProgress extends React.Component {
  componentDidUpdate() {
    // eslint-disable-next-line react/no-string-refs
    if (this.refs.stepContent) this.refs.stepContent.parentNode.scrollTop = 0;
  }

  render() {
    const {
      className,
      currentStory,
      description,
      modalInProgress,
      endTour,
      showTourAlert,
      currentStep,
      totalSteps,
      decreaseStep,
      incrementStep,
    } = this.props;

    return (
      <div>
        <Modal
          isOpen={modalInProgress}
          toggle={endTour}
          onClosed={showTourAlert}
          wrapClassName="tour tour-in-progress"
          className={
            `${className} ${currentStory.type}`
          }
          backdrop={false}
          keyboard={false}
        >
          <ModalHeader toggle={endTour} charCode="">
            {currentStory.title}
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
              currentStep={currentStep}
              totalSteps={totalSteps}
              decreaseStep={decreaseStep}
              incrementStep={incrementStep}
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
  description: PropTypes.string,
};

export default ModalInProgress;

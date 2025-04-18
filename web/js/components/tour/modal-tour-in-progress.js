import React from 'react';
import PropTypes from 'prop-types';
import {
  Modal, ModalHeader, ModalBody, ModalFooter,
} from 'reactstrap';
import { Close } from '@edsc/earthdata-react-icons/horizon-design-system/hds/ui';
import Steps from './widget-steps';

class ModalInProgress extends React.Component {
  render() {
    const {
      className,
      currentStory,
      description,
      modalInProgress,
      endTour,
      currentStep,
      totalSteps,
      decreaseStep,
      incrementStep,
      isKioskModeActive,
    } = this.props;
    const closeBtn = (
      <button className={isKioskModeActive ? 'd-none' : 'end-tour-close-btn'} onClick={endTour} type="button">
        <Close class="add-plus" size="14px" />
      </button>
    );
    return (
      <div>
        <Modal
          isOpen={modalInProgress}
          toggle={endTour}
          wrapClassName="tour tour-in-progress"
          className={
            `${className} ${currentStory.type}`
          }
          backdrop={false}
          keyboard={false}
        >
          <ModalHeader toggle={endTour} close={closeBtn} style={{ display: 'flex', alignItems: 'baseline' }}>
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
              isKioskModeActive={isKioskModeActive}
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
  isKioskModeActive: PropTypes.bool.isRequired,
  incrementStep: PropTypes.func.isRequired,
  modalInProgress: PropTypes.bool.isRequired,
  totalSteps: PropTypes.number.isRequired,
  className: PropTypes.string,
  description: PropTypes.string,
};

export default ModalInProgress;

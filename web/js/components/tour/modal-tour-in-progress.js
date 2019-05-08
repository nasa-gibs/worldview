import React from 'react';
import PropTypes from 'prop-types';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import Steps from './widget-steps';
import util from '../../util/util';

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
  // models: PropTypes.object.isRequired,
  // config: PropTypes.object.isRequired,
  // ui: PropTypes.object.isRequired,
  // modalInProgress: PropTypes.bool.isRequired,
  // toggleModalInProgress: PropTypes.func.isRequired,
  // currentStep: PropTypes.number.isRequired,
  // totalSteps: PropTypes.number.isRequired,
  // currentStoryIndex: PropTypes.number.isRequired,
  // currentStory: PropTypes.object.isRequired,
  // currentStoryId: PropTypes.string.isRequired,
  // decreaseStep: PropTypes.func.isRequired,
  // incrementStep: PropTypes.func.isRequired,
  // showTourAlert: PropTypes.func.isRequired,
  // restartTour: PropTypes.bool.isRequired,
  // toggleRestartTour: PropTypes.func.isRequired,
  // toggleMetaLoaded: PropTypes.func.isRequired,
  // metaLoaded: PropTypes.bool.isRequired,
  // className: PropTypes.string
};

export default ModalInProgress;

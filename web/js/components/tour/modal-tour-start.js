import React from 'react';
import PropTypes from 'prop-types';
import { Modal, ModalHeader, ModalBody, ModalFooter, InputGroup, InputGroupAddon, InputGroupText, Input } from 'reactstrap';
import TourIntro from './content-intro';
import TourBoxes from './tour-boxes';

class ModalStart extends React.Component {
  render() {
    return (
      <Modal isOpen={this.props.modalStart} toggle={this.props.toggleModalStart} onClosed={this.props.showTourAlert} wrapClassName='tour tour-start' className={this.props.className} backdrop={true}>
        <ModalHeader toggle={this.props.toggleModalStart} charCode="">Welcome to Worldview!</ModalHeader>
        <ModalBody>
          <TourIntro toggleModalStart={this.props.toggleModalStart}></TourIntro>
          <TourBoxes stories={this.props.stories} storyOrder={this.props.storyOrder} selectTour={this.props.selectTour}></TourBoxes>
        </ModalBody>
        <ModalFooter>
          <InputGroup>
            <InputGroupText className="w-100">
              <Input addon type="checkbox" className="float-right m-0" aria-label="Hide this box until a new story has been added." />
              <span className="ml-2">Check the box to hide this modal until a new story has been added.</span>
            </InputGroupText>
          </InputGroup>
        </ModalFooter>
      </Modal>
    );
  }
}

ModalStart.propTypes = {
  stories: PropTypes.object.isRequired,
  storyOrder: PropTypes.array.isRequired,
  modalStart: PropTypes.bool.isRequired,
  toggleModalStart: PropTypes.func.isRequired,
  selectTour: PropTypes.func.isRequired,
  showTourAlert: PropTypes.func.isRequired,
  className: PropTypes.string
};

export default ModalStart;

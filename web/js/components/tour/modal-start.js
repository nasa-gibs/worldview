import React from 'react';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import TourIntro from './content-intro';
import TourBoxes from './tour-boxes';

class ModalStart extends React.Component {
  render() {
    return (
      <div>
        <Modal isOpen={this.props.modalStart} toggle={this.props.toggleModalStart} wrapClassName='tour tour-start' className={this.props.className} backdrop={true}>
          <ModalHeader toggle={this.props.toggleModalStart} charCode="">Welcome to Worldview!</ModalHeader>
          <ModalBody>
            <TourIntro toggleModalStart={this.props.toggleModalStart}></TourIntro>
            <TourBoxes stories={this.props.stories} storyOrder={this.props.storyOrder} startTour={this.props.startTour}></TourBoxes>
          </ModalBody>
        </Modal>
      </div>
    );
  }
}

export default ModalStart;
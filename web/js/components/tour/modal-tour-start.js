import React from 'react';
import PropTypes from 'prop-types';
import { Modal, ModalHeader, ModalBody, ModalFooter, InputGroup, InputGroupText, Input } from 'reactstrap';
import TourIntro from './content-intro';
import TourBoxes from './tour-boxes';
import util from '../../util/util';

class ModalStart extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      checked: this.props.storageCheck
    };

    this.setWrapperRef = this.setWrapperRef.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
    this.handleCheck = this.handleCheck.bind(this);
    this.escFunction = this.escFunction.bind(this);
  }

  componentDidMount() {
    document.addEventListener('mousedown', this.handleClickOutside);
    document.addEventListener('keydown', this.escFunction, false);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside);
    document.removeEventListener('keydown', this.escFunction, false);
  }

  // Set a reference to the inner div for checking clicks outside of the scrollbar
  setWrapperRef(node) {
    this.wrapperRef = node;
  }

  // Use custom escFunction since tabIndex prevents escape key use on loading WV
  escFunction(e) {
    if (e.keyCode === 27 && this.props.modalStart) {
      this.props.toggleModalStart(e);
    }
  }

  // Use custom clickOutside function since we contained the clickable area with
  // CSS to have a cleaner looking scrollbar
  handleClickOutside(e) {
    if (this.wrapperRef && !this.wrapperRef.contains(e.target)) {
      this.props.toggleModalStart(e);
    }
  }

  // Handle the show/hide checkbox state
  handleCheck() {
    this.setState({
      checked: !this.state.checked
    });
    if (!this.state.checked) {
      this.props.hideTour();
    } else {
      this.props.showTour();
    }
  }

  render() {
    return (
      <Modal isOpen={this.props.modalStart} toggle={this.props.toggleModalStart} onClosed={this.props.showTourAlert} wrapClassName='tour tour-start' className={this.props.className} backdrop={true} fade={false} keyboard={false} innerRef={this.setWrapperRef}>
        <ModalHeader toggle={this.props.toggleModalStart} charCode="">Welcome to Worldview!</ModalHeader>
        <ModalBody>
          <TourIntro toggleModalStart={this.props.toggleModalStart}></TourIntro>
          <TourBoxes stories={this.props.stories} storyOrder={this.props.storyOrder} selectTour={this.props.selectTour}></TourBoxes>
        </ModalBody>
        {util.browser.localStorage &&
        <ModalFooter>
          <InputGroup>
            <InputGroupText className="w-100">
              <Input addon type="checkbox" className="float-right m-0" defaultChecked={this.state.checked} onChange={this.handleCheck} aria-label="Hide this box until a new story has been added." />
              <span className="ml-2">Do not show until a new story has been added.</span>
            </InputGroupText>
          </InputGroup>
        </ModalFooter>
        }
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
  hideTour: PropTypes.func.isRequired,
  showTour: PropTypes.func.isRequired,
  storageCheck: PropTypes.bool.isRequired,
  className: PropTypes.string
};

export default ModalStart;

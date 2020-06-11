import React from 'react';
import PropTypes from 'prop-types';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  InputGroup,
  InputGroupText,
  Input,
} from 'reactstrap';
import TourIntro from './content-intro';
import TourBoxes from './tour-boxes';
import safeLocalStorage from '../../util/local-storage';
import Scrollbars from '../util/scrollbar';

class ModalStart extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      checked: props.checked,
    };

    this.setWrapperRef = this.setWrapperRef.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
    this.handleCheck = this.handleCheck.bind(this);
  }

  componentDidMount() {
    document.addEventListener('mousedown', this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside);
  }

  // Set a reference to the inner div for checking clicks outside of the scrollbar
  setWrapperRef(node) {
    this.wrapperRef = node;
  }

  // Use custom clickOutside function since we contained the clickable area with
  // CSS to have a cleaner looking scrollbar
  handleClickOutside(e) {
    const { toggleModalStart } = this.props;
    if (this.wrapperRef && !this.wrapperRef.contains(e.target)) {
      toggleModalStart(e);
    }
  }

  // Handle the show/hide checkbox state
  handleCheck() {
    const { hideTour, showTour } = this.props;
    const { checked } = this.state;
    this.setState((prevState) => ({
      checked: !prevState.checked,
    }));
    if (!checked) {
      hideTour();
    } else {
      showTour();
    }
  }

  render() {
    const {
      modalStart, endTour, showTourAlert, toggleModalStart, className, height, stories, storyOrder, selectTour,
    } = this.props;
    const { checked } = this.state;
    return (
      <Modal
        isOpen={modalStart}
        toggle={endTour}
        onClosed={showTourAlert}
        wrapClassName="tour tour-start"
        className={className}
        backdrop
        fade={false}
        keyboard={false}
        innerRef={this.setWrapperRef}
      >
        <ModalHeader toggle={endTour} charCode="">
          Welcome to Worldview!
        </ModalHeader>
        <Scrollbars style={{ maxHeight: `${height - 200}px` }}>

          <ModalBody>

            <TourIntro toggleModalStart={toggleModalStart} />
            <TourBoxes
              stories={stories}
              storyOrder={storyOrder}
              selectTour={selectTour}
            />

          </ModalBody>
        </Scrollbars>
        {safeLocalStorage.enabled && (
          <ModalFooter>
            <InputGroup>
              <InputGroupText className="w-100">
                <Input
                  addon
                  type="checkbox"
                  className="float-right m-0"
                  defaultChecked={checked}
                  onChange={this.handleCheck}
                  aria-label="Hide this box until a new story has been added."
                />
                <span className="ml-2">
                  Do not show until a new story has been added.
                </span>
              </InputGroupText>
            </InputGroup>
          </ModalFooter>
        )}
      </Modal>
    );
  }
}

ModalStart.propTypes = {
  checked: PropTypes.bool.isRequired,
  endTour: PropTypes.func.isRequired,
  hideTour: PropTypes.func.isRequired,
  modalStart: PropTypes.bool.isRequired,
  selectTour: PropTypes.func.isRequired,
  showTour: PropTypes.func.isRequired,
  showTourAlert: PropTypes.func.isRequired,
  stories: PropTypes.object.isRequired,
  storyOrder: PropTypes.array.isRequired,
  toggleModalStart: PropTypes.func.isRequired,
  className: PropTypes.string,
  height: PropTypes.number,
};

export default ModalStart;

import React from 'react';
import PropTypes from 'prop-types';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  InputGroup,
  InputGroupText,
} from 'reactstrap';
import Checkbox from '../util/checkbox';
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
    this.handleCheck = this.handleCheck.bind(this);
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
      modalStart, endTour, toggleModalStart, className, height, stories, storyOrder, selectTour,
    } = this.props;
    const { checked } = this.state;
    const closeBtn = (
      <button className="tour-close-btn" onClick={endTour} type="button">
        &times;
      </button>
    );
    return (
      <Modal
        isOpen={modalStart}
        toggle={endTour}
        wrapClassName="tour tour-start"
        className={className}
        backdrop
        fade={false}
        keyboard={false}
      >
        <ModalHeader toggle={endTour} close={closeBtn}>
          Welcome to @NAME@!
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
                <Checkbox
                  id="hide-until-new-checkbox"
                  name="hide-until-new"
                  onCheck={this.handleCheck}
                  color="gray"
                  classNames="float-right m-0"
                  aria-label="Hide this dialog until a new story has been added."
                  checked={checked}
                  label="Do not show until a new story has been added."
                />
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
  stories: PropTypes.object.isRequired,
  storyOrder: PropTypes.array.isRequired,
  toggleModalStart: PropTypes.func.isRequired,
  className: PropTypes.string,
  height: PropTypes.number,
};

export default ModalStart;

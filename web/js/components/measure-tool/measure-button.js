import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Button, UncontrolledTooltip } from 'reactstrap';
import googleTagManager from 'googleTagManager';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MeasureMenu from './measure-menu';
import { openCustomContent } from '../../modules/modal/actions';
import AlertUtil from '../util/alert';


const MEASURE_MENU_PROPS = {
  headerText: null,
  type: 'toolbar',
  modalClassName: 'measure-tool-modal',
  backdrop: false,
  bodyComponent: MeasureMenu,
  touchDevice: false,
  wrapClassName: 'toolbar_modal_outer',
};

const mobileHelpMsg = 'Tap to add a point. Double-tap to complete.';
const helpMsg = 'Click: Add a point. Right-click: Cancel. Double-click to complete. ';

class MeasureButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showAlert: true,
      isTouchDevice: false,
    };
    this.onButtonClick = this.onButtonClick.bind(this);
    this.dismissAlert = this.dismissAlert.bind(this);
  }

  onButtonClick(evt) {
    const { openModal } = this.props;
    const isTouchDevice = evt.type === 'touchend';
    evt.stopPropagation();
    evt.preventDefault();
    MEASURE_MENU_PROPS.touchDevice = isTouchDevice;
    openModal('MEASURE_MENU', MEASURE_MENU_PROPS);
    this.setState({
      isTouchDevice,
      showAlert: true,
    });
    googleTagManager.pushEvent({
      event: 'measure_tool_activated',
    });
  }

  dismissAlert() {
    this.setState({ showAlert: false });
  }

  render() {
    const { isActive, isDistractionFreeModeActive, isMobile } = this.props;
    const { showAlert, isTouchDevice } = this.state;
    const faSize = isMobile ? '2x' : '1x';
    const shouldShowAlert = isActive && showAlert;
    const message = isTouchDevice ? mobileHelpMsg : helpMsg;
    const buttonId = 'wv-measure-button';
    const labelText = 'Measure distances & areas';

    return (
      <>
        {shouldShowAlert && (
        <AlertUtil
          id="measurement-alert"
          isOpen
          icon="ruler"
          title="Measure Tool"
          message={message}
          onDismiss={this.dismissAlert}
        />
        )}

        <Button
          style={{ display: isDistractionFreeModeActive ? 'none' : 'block' }}
          id={buttonId}
          className="wv-measure-button wv-toolbar-button"
          aria-label={labelText}
          onTouchEnd={this.onButtonClick}
          onMouseDown={this.onButtonClick}
          disabled={isActive}
        >
          <UncontrolledTooltip
            placement="top"
            target={buttonId}
          >
            {labelText}
          </UncontrolledTooltip>
          <FontAwesomeIcon icon="ruler" size={faSize} />
        </Button>
      </>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
  isActive: state.measure.isActive,
  isDistractionFreeModeActive: state.ui.isDistractionFreeModeActive,
  isMobile: state.browser.lessThan.medium,
});
const mapDispatchToProps = (dispatch) => ({
  openModal: (key, customParams) => {
    dispatch(openCustomContent(key, customParams));
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(MeasureButton);

MeasureButton.propTypes = {
  isActive: PropTypes.bool,
  isDistractionFreeModeActive: PropTypes.bool,
  isMobile: PropTypes.bool,
  openModal: PropTypes.func,
};

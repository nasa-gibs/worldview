import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Button } from 'reactstrap';
import MeasureMenu from './measure-menu';
import { openCustomContent } from '../../modules/modal/actions';
import AlertUtil from '../util/alert';
import googleTagManager from 'googleTagManager';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRuler } from '@fortawesome/free-solid-svg-icons';

const MEASURE_MENU_PROPS = {
  headerText: null,
  type: 'toolbar',
  modalClassName: 'measure-tool-modal',
  backdrop: false,
  bodyComponent: MeasureMenu,
  touchDevice: false,
  wrapClassName: 'toolbar_modal_outer'
};

const mobileHelpMsg = 'Tap to add a point. Double-tap to complete.';
const helpMsg = 'Click: Add a point. Right-click: Cancel. Double-click to complete. ';

class MeasureButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showAlert: true,
      isTouchDevice: false
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
      showAlert: true
    });
    googleTagManager.pushEvent({
      event: 'measure_tool_activated'
    });
  }

  dismissAlert() {
    this.setState({ showAlert: false });
  }

  render() {
    const showAlert = this.props.isActive && this.state.showAlert;
    const message = this.state.isTouchDevice ? mobileHelpMsg : helpMsg;

    return (
      <>
        {showAlert && <AlertUtil
          id={'measurement-alert'}
          isOpen={true}
          iconClassName='faRuler'
          title='Measure Tool'
          message={message}
          onDismiss={this.dismissAlert}
        />}

        <Button
          id="wv-measure-button"
          className="wv-measure-button wv-toolbar-button"
          title="Measure distances &amp; areas"
          onTouchEnd={this.onButtonClick}
          onMouseDown={this.onButtonClick}
        >
          <FontAwesomeIcon icon={faRuler} size='2x' />
        </Button>
      </>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    isActive: state.measure.isActive
  };
};
const mapDispatchToProps = dispatch => ({
  openModal: (key, customParams) => {
    dispatch(openCustomContent(key, customParams));
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MeasureButton);

MeasureButton.propTypes = {
  isActive: PropTypes.bool,
  openModal: PropTypes.func
};

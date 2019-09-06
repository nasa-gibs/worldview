import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Button } from 'reactstrap';
import MeasureMenu from './measure-menu';
import { openCustomContent } from '../../modules/modal/actions';
import AlertUtil from '../util/alert';

const MEASURE_MENU_PROPS = {
  headerText: null,
  type: 'toolbar',
  modalClassName: 'measure-tool-modal toolbar-modal',
  backdrop: false,
  bodyComponent: MeasureMenu,
  clickType: null,
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

  onButtonClick (evt) {
    const { openModal } = this.props;
    MEASURE_MENU_PROPS.clickType = evt.type;
    evt.stopPropagation();
    evt.preventDefault();
    openModal('MEASURE_MENU', MEASURE_MENU_PROPS);
    this.setState({
      isTouchDevice: evt.type === 'touchend',
      showAlert: true
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
          isOpen={true}
          iconClassName='fa fa-ruler fa-fw'
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
          <i className="fas fa-ruler fa-2x"></i>{' '}
        </Button>
      </>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    isActive: state.measure.isActive,
    browser: state.browser
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
  browser: PropTypes.object,
  isActive: PropTypes.bool,
  openModal: PropTypes.func
};

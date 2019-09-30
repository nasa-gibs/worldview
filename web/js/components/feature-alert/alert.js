import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { openCustomContent } from '../../modules/modal/actions';
import GeostationaryModalBody from './geostationary-modal';
import AlertUtil from '../util/alert';
import util from '../../util/util';

class FeaturedAlert extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showAlert: true
    };
    this.dismissAlert = this.dismissAlert.bind(this);

    if (util.browser.localStorage) {
      // const hideAlertTime = localStorage.getItem('featured-alert');
    }
  }

  dismissAlert() {
    if (util.browser.localStorage) {
      localStorage.setItem('featured-alert', new Date());
    }
    this.setState({ showAlert: false });
  }

  render() {
    const { showAlert } = this.state;
    return (
      <>
        <AlertUtil
          isOpen={showAlert}
          iconClassName='fa fa-layer-group fa-fw'
          onClick={this.props.showModal.bind(this)}
          // TODO consider hiding the close button if no onDismiss prop supplied
          onDismiss={this.dismissAlert}
          message="Check out our new geostationary layers!"
        />
      </>
    );
  }
}

const mapDispatchToProps = (dispatch) => ({
  showModal: () => {
    dispatch(
      openCustomContent('geostationary_info', {
        headerText: 'New - Geostationary Layers',
        backdrop: false,
        size: 'lg',
        wrapClassName: 'clickable-behind-modal',
        bodyComponent: GeostationaryModalBody,
        desktopOnly: true,
        isDraggable: true
      })
    );
  }
});

FeaturedAlert.propTypes = {
  buildDate: PropTypes.number,
  showModal: PropTypes.func
};

export default connect(
  null,
  mapDispatchToProps
)(FeaturedAlert);

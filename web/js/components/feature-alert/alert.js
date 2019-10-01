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

    let alertHasBeenShown;
    if (util.browser.localStorage) {
      alertHasBeenShown = localStorage.getItem('featured-alert:geostationary');
    }

    this.state = {
      showAlert: !alertHasBeenShown
    };
    this.readMore = this.readMore.bind(this);
  }

  readMore() {
    if (util.browser.localStorage) {
      localStorage.setItem('featured-alert:geostationary', true);
    }
    this.setState({ showAlert: false });
    this.props.showModal();
  }

  render() {
    const { showAlert } = this.state;
    return (
      <>
        <AlertUtil
          isOpen={showAlert}
          iconClassName='fa fa-layer-group fa-fw'
          onClick={this.readMore}
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
        size: 'md',
        wrapClassName: 'clickable-behind-modal',
        bodyComponent: GeostationaryModalBody
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

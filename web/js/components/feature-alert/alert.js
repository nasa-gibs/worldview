import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { openCustomContent } from '../../modules/modal/actions';
import util from '../../util/util';

class FeaturedAlert extends React.Component {
  constructor(props) {
    super(props);
    const alertHasBeenShown = true;
    this.state = {
      showAlert: !alertHasBeenShown
    };
  }

  dismissAlert() {
    if (util.browser.localStorage) {
      localStorage.setItem('<alert-name>', true);
    }
    this.setState({ showAlert: false });
  }

  render() {
    // const { showAlert } = this.state;
    return ('');
    // return (
    //   <AlertUtil
    //     id={'geostationary-alert'}
    //     isOpen={showAlert}
    //     iconClassName='faLayerGroup'
    //     onClick={this.props.showModal.bind(this)}
    //     onDismiss={this.dismissAlert.bind(this)}
    //     message="Check out our new geostationary layers!"
    //     noPortal={true}
    //   />
    // );
  }
}

const mapDispatchToProps = (dispatch) => ({
  showModal: () => {
    dispatch(
      openCustomContent('', {
        headerText: '',
        backdrop: false,
        size: 'lg',
        wrapClassName: '',
        clickableBehindModal: true,
        bodyComponent: undefined,
        scrollable: true
      })
    );
  }
});

FeaturedAlert.propTypes = {
  showModal: PropTypes.func
};

export default connect(
  null,
  mapDispatchToProps
)(FeaturedAlert);

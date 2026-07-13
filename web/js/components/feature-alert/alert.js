import { connect } from 'react-redux';
import { openCustomContent } from '../../modules/modal/actions';

function FeaturedAlert() {
  return '';
  // return (
  //   <AlertUtil
  //     id={'geostationary-alert'}
  //     isOpen={showAlert}
  //     iconClassName='faLayerGroup'
  //     onClick={showModal}
  //     onDismiss={dismissAlert}
  //     message="Check out our new geostationary layers!"
  //     noPortal={true}
  //   />
  // );
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
        scrollable: true,
      }),
    );
  },
});

export default connect(
  null,
  mapDispatchToProps,
)(FeaturedAlert);

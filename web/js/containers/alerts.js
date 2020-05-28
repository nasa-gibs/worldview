/* eslint-disable no-restricted-syntax */
import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import AlertUtil from '../components/util/alert';
import { openCustomContent } from '../modules/modal/actions';
import util from '../util/util';
import { hasVectorLayers } from '../modules/layers/util';
import { DISABLE_VECTOR_ALERT, MODAL_PROPERTIES } from '../modules/alerts/constants';


const HAS_LOCAL_STORAGE = util.browser.localStorage;
class DismissableAlerts extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      hasDismissedEvents: HAS_LOCAL_STORAGE && !!localStorage.getItem('dismissedEventVisibilityAlert'),
      hasDismissedCompare: HAS_LOCAL_STORAGE && !!localStorage.getItem('dismissedCompareAlert'),
    };
  }

  /**
   * Update state and local storage when
   * alert is dismissed
   *
   * @param {String} storageKey
   * @param {String} stateKey
   */
  dismissAlert(storageKey, stateKey) {
    localStorage.setItem(storageKey, true);
    this.setState({ [stateKey]: true });
  }

  render() {
    const {
      isEventsActive, isCompareActive, isVectorAlertPresent, dismissVectorAlert, openAlertModal, isSmall,
    } = this.props;
    const { hasDismissedEvents, hasDismissedCompare } = this.state;
    const { eventModalProps, compareModalProps, vectorModalProps } = MODAL_PROPERTIES;
    if (isSmall || !HAS_LOCAL_STORAGE) return null;
    return (
      <>
        {!hasDismissedEvents && isEventsActive ? (
          <AlertUtil
            id="event-alert"
            isOpen
            noPortal
            onClick={() => openAlertModal(eventModalProps)}
            onDismiss={() => this.dismissAlert('dismissedEventVisibilityAlert', 'hasDismissedEvents')}
            message="Events may not be visible at all times."
          />
        ) : null}
        {!hasDismissedCompare && isCompareActive ? (
          <AlertUtil
            isOpen
            noPortal
            onClick={() => openAlertModal(compareModalProps)}
            onDismiss={() => this.dismissAlert('dismissedCompareAlert', 'hasDismissedCompare')}
            message="You are now in comparison mode."
          />
        ) : null}
        {isVectorAlertPresent ? (
          <AlertUtil
            isOpen
            noPortal
            onClick={() => openAlertModal(vectorModalProps)}
            onDismiss={dismissVectorAlert}
            message="Vector features may not be clickable at all zoom levels."
          />
        ) : null}
      </>
    );
  }
}
const mapDispatchToProps = (dispatch) => ({
  openAlertModal: ({ id, props }) => {
    dispatch(openCustomContent(id, props));
  },
  dismissVectorAlert: () => dispatch({ type: DISABLE_VECTOR_ALERT }),
});
const mapStateToProps = (state) => {
  const {
    browser, events, sidebar, compare, layers, alerts,
  } = state;
  const { activeString } = compare;
  const { isVectorAlertActive } = alerts;

  return {
    isSmall: browser.lessThan.small,
    isEventsActive: !!(events.selected.id && sidebar.activeTab === 'events'),
    isCompareActive: compare.active,
    isVectorAlertPresent: hasVectorLayers(layers[activeString]) && isVectorAlertActive,
  };
};
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(DismissableAlerts);

DismissableAlerts.propTypes = {
  isEventsActive: PropTypes.bool,
  isCompareActive: PropTypes.bool,
  openAlertModal: PropTypes.func,
  isSmall: PropTypes.bool,
  isVectorAlertPresent: PropTypes.bool,
  dismissVectorAlert: PropTypes.func,
};

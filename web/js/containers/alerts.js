/* eslint-disable no-restricted-syntax */
import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import AlertUtil from '../components/util/alert';
import { openCustomContent } from '../modules/modal/actions';
import { hasVectorLayers } from '../modules/layers/util';
import { DISABLE_VECTOR_ALERT, MODAL_PROPERTIES } from '../modules/alerts/constants';
import safeLocalStorage from '../util/local-storage';
import { getActiveLayers } from '../modules/layers/selectors';

const HAS_LOCAL_STORAGE = safeLocalStorage.enabled;
const { DISMISSED_COMPARE_ALERT, DISMISSED_EVENT_VIS_ALERT } = safeLocalStorage.keys;
class DismissableAlerts extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      hasDismissedEvents: !!safeLocalStorage.getItem(DISMISSED_EVENT_VIS_ALERT),
      hasDismissedCompare: !!safeLocalStorage.getItem(DISMISSED_COMPARE_ALERT),
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
    safeLocalStorage.setItem(storageKey, true);
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
        {!hasDismissedEvents && isEventsActive && (
          <AlertUtil
            id="event-alert"
            isOpen
            noPortal
            onClick={() => openAlertModal(eventModalProps)}
            onDismiss={() => this.dismissAlert(DISMISSED_EVENT_VIS_ALERT, 'hasDismissedEvents')}
            message="Events may not be visible at all times."
          />
        )}
        {!hasDismissedCompare && isCompareActive && (
          <AlertUtil
            isOpen
            noPortal
            onClick={() => openAlertModal(compareModalProps)}
            onDismiss={() => this.dismissAlert(DISMISSED_COMPARE_ALERT, 'hasDismissedCompare')}
            message="You are now in comparison mode."
          />
        )}
        {isVectorAlertPresent && (
          <AlertUtil
            isOpen
            noPortal
            onClick={() => openAlertModal(vectorModalProps)}
            onDismiss={dismissVectorAlert}
            message="Vector features may not be clickable at all zoom levels."
          />
        )}
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
    browser, events, sidebar, compare, alerts,
  } = state;
  const { isVectorAlertActive } = alerts;
  const activeLayers = getActiveLayers(state);

  return {
    isSmall: browser.lessThan.small,
    isEventsActive: !!(events.selected.id && sidebar.activeTab === 'events'),
    isCompareActive: compare.active,
    isVectorAlertPresent: hasVectorLayers(activeLayers) && isVectorAlertActive,
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

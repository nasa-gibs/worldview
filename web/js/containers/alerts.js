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
const {
  DISMISSED_COMPARE_ALERT,
  DISMISSED_DISTRACTION_FREE_ALERT,
  DISMISSED_EVENT_VIS_ALERT,
} = safeLocalStorage.keys;
class DismissableAlerts extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      hasDismissedEvents: !!safeLocalStorage.getItem(DISMISSED_EVENT_VIS_ALERT),
      hasDismissedCompare: !!safeLocalStorage.getItem(DISMISSED_COMPARE_ALERT),
      hasDismissedDistractionFree: !!safeLocalStorage.getItem(DISMISSED_DISTRACTION_FREE_ALERT),
      distractionFreeModeInitLoad: false,
    };
  }

  componentDidMount() {
    const { isDistractionFreeModeActive } = this.props;
    if (isDistractionFreeModeActive) {
      this.toggleDistractionFreeModeInitLoad(true);
    }
  }

  componentDidUpdate(prevProps) {
    const { isDistractionFreeModeActive } = this.props;
    const { distractionFreeModeInitLoad } = this.state;
    const isDistractionFreeModeActiveChanged = prevProps.isDistractionFreeModeActive && !isDistractionFreeModeActive;
    if (distractionFreeModeInitLoad && isDistractionFreeModeActiveChanged) {
      this.toggleDistractionFreeModeInitLoad(false);
    }
  }

  toggleDistractionFreeModeInitLoad(isActive) {
    this.setState({ distractionFreeModeInitLoad: isActive });
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
      dismissVectorAlert,
      isCompareActive,
      isDistractionFreeModeActive,
      isEventsActive,
      isSmall,
      isVectorAlertPresent,
      openAlertModal,
    } = this.props;
    const {
      hasDismissedEvents,
      hasDismissedCompare,
      hasDismissedDistractionFree,
      distractionFreeModeInitLoad,
    } = this.state;
    const { eventModalProps, compareModalProps, vectorModalProps } = MODAL_PROPERTIES;
    if (distractionFreeModeInitLoad) return null;
    if (isSmall || !HAS_LOCAL_STORAGE) return null;

    return isDistractionFreeModeActive
      ? !hasDismissedDistractionFree && (
      <AlertUtil
        id="distraction-free-mode-active-alert"
        isOpen
        noPortal
        onDismiss={() => this.dismissAlert(DISMISSED_DISTRACTION_FREE_ALERT, 'hasDismissedDistractionFree')}
        message="You are now in distraction free mode. Click the eye button to exit."
      />
      ) : (
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
    browser, events, sidebar, compare, alerts, ui,
  } = state;
  const { isVectorAlertActive } = alerts;
  const activeLayers = getActiveLayers(state);

  return {
    isCompareActive: compare.active,
    isDistractionFreeModeActive: ui.isDistractionFreeModeActive,
    isEventsActive: !!(events.selected.id && sidebar.activeTab === 'events'),
    isSmall: browser.lessThan.small,
    isVectorAlertPresent: hasVectorLayers(activeLayers) && isVectorAlertActive,
  };
};
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(DismissableAlerts);

DismissableAlerts.propTypes = {
  dismissVectorAlert: PropTypes.func,
  isCompareActive: PropTypes.bool,
  isDistractionFreeModeActive: PropTypes.bool,
  isEventsActive: PropTypes.bool,
  isSmall: PropTypes.bool,
  isVectorAlertPresent: PropTypes.bool,
  openAlertModal: PropTypes.func,
};

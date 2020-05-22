/* eslint-disable no-restricted-syntax */
import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import AlertUtil from '../components/util/alert';
import EventsAlertModalBody from '../components/events/alert-body';
import CompareAlertModalBody from '../components/compare/alert';
import { openCustomContent } from '../modules/modal/actions';
import util from '../util/util';

const MODAL_PROPERTIES = {
  eventModalProps: {
    id: 'event_visibility_info',
    props: {
      headerText: 'Events may not be visible at all times.',
      backdrop: false,
      size: 'lg',
      clickableBehindModal: true,
      bodyComponent: EventsAlertModalBody,
      desktopOnly: true,
    },
  },
  compareModalProps: {
    id: 'compare_mode_info',
    props: {
      headerText: 'You are now in comparison mode',
      backdrop: false,
      size: 'lg',
      clickableBehindModal: true,
      bodyComponent: CompareAlertModalBody,
      desktopOnly: true,
    },
  },
};
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
      isEventsActive, isCompareActive, openAlertModal, isSmall,
    } = this.props;
    const { hasDismissedEvents, hasDismissedCompare } = this.state;
    const { eventModalProps, compareModalProps } = MODAL_PROPERTIES;
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
      </>
    );
  }
}
const mapDispatchToProps = (dispatch) => ({
  openAlertModal: ({ id, props }) => {
    dispatch(openCustomContent(id, props));
  },
});
const mapStateToProps = (state) => {
  const {
    browser, events, sidebar, compare,
  } = state;

  return {
    isSmall: browser.lessThan.small,
    isEventsActive: !!(events.selected.id && sidebar.activeTab === 'events'),
    isCompareActive: compare.active,
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
};

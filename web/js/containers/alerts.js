/* eslint-disable no-restricted-syntax */
import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import AlertUtil from '../components/util/alert';
import EventsAlertModalBody from '../components/events/alert-body';
import CompareAlertModalBody from '../components/compare/alert';
import VectorAlertModalBody from '../components/layer/vector/alert';
import { openCustomContent } from '../modules/modal/actions';
import util from '../util/util';
import { hasVectorLayers } from '../modules/layers/util';

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
  vectorModalProps: {
    id: 'vector_layer_info',
    props: {
      headerText: 'Vector features may not be clickable at all times.',
      backdrop: false,
      size: 'lg',
      clickableBehindModal: true,
      bodyComponent: VectorAlertModalBody,
      desktopOnly: true,
    },
  },
};
class Alerts extends React.Component {
  constructor(props) {
    super(props);
    const hasLocalStorage = util.browser.localStorage;
    this.state = {
      hasDismissedEvents: hasLocalStorage && !!localStorage.getItem('dismissedEventVisibilityAlert'),
      hasDismissedVectors: hasLocalStorage && !!localStorage.getItem('dismissedVectorAlert'),
      hasDismissedCompare: hasLocalStorage && !!localStorage.getItem('dismissedCompareAlert'),
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
    this.setState({ [stateKey]: false });
  }

  render() {
    const {
      isEventsActive, isCompareActive, isVectorLayerPresent, openAlertModal, isSmall,
    } = this.props;
    const { hasDismissedEvents, hasDismissedVectors, hasDismissedCompare } = this.state;
    const { eventModalProps, compareModalProps, vectorModalProps } = MODAL_PROPERTIES;
    if (isSmall) return null;
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
        {!hasDismissedVectors && isVectorLayerPresent ? (
          <AlertUtil
            isOpen
            noPortal
            onClick={() => openAlertModal(vectorModalProps)}
            onDismiss={() => this.dismissAlert('dismissedVectorAlert', 'hasDismissedVectors')}
            message="Vector features may not be clickable at all times."
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
    browser, events, sidebar, compare, layers,
  } = state;
  return {
    isSmall: browser.lessThan.small,
    isEventsActive: !!(events.selected.id && sidebar.activeTab === 'events'),
    isCompareActive: compare.active,
    isVectorLayerPresent: hasVectorLayers(layers, compare),
  };
};
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Alerts);

Alerts.propTypes = {
  isEventsActive: PropTypes.bool,
  isCompareActive: PropTypes.bool,
  isVectorLayerPresent: PropTypes.bool,
  openAlertModal: PropTypes.func,
  isSmall: PropTypes.bool,
};

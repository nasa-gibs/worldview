import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import googleTagManager from 'googleTagManager';
import {
  openCustomContent,
} from '../modules/modal/actions';
import toggleDistractionFreeModeAction from '../modules/ui/actions';
import AboutPage from '../components/about/about-page';
import IconList from '../components/util/list';
import onClickFeedback from '../modules/feedback/util';
import { addToLocalStorage } from '../modules/notifications/util';

import initFeedback from '../modules/feedback/actions';
import {
  startTour as startTourAction,
  endTour as endTourAction,
} from '../modules/tour/actions';
import { notificationsSeen } from '../modules/notifications/actions';
import Notifications from './notifications';

function InfoList (props) {
  const {
    sendFeedback,
    feedbackIsInitiated,
    aboutClick,
    config,
    startTour,
    isDistractionFreeModeActive,
    isTourActive,
    isMobile,
    toggleDistractionFreeMode,
    notifications,
    notificationClick,
  } = props;

  function getNotificationListItem() {
    const { number, type, object } = notifications;
    return {
      text: 'Notifications',
      iconClass: 'ui-icon',
      // eslint-disable-next-line no-nested-ternary
      iconName: type === 'message'
        ? 'gift'
        : type === 'outage'
          ? 'exclamation-circle'
          : ['fas', 'bolt'],
      id: 'notifications_info_item',
      badge: number,
      className: type ? `${type}-notification` : '',
      onClick: () => {
        notificationClick(object, number);
      },
    };
  }

  function getExploreWorldviewObj() {
    return {
      text: 'Explore Worldview',
      iconClass: 'ui-icon',
      iconName: 'truck',
      id: 'start_tour_info_item',
      onClick: () => {
        startTour(isTourActive);
        googleTagManager.pushEvent({
          event: 'tour_start_button',
        });
      },
    };
  }

  function getDistractionFreeObj() {
    return {
      text: isDistractionFreeModeActive ? 'Exit Distraction Free' : 'Distraction Free',
      iconClass: 'ui-icon',
      iconName: ['far', 'eye'],
      id: 'distraction_free_info_item',
      onClick: () => {
        toggleDistractionFreeMode();
      },
    };
  }

  function getListArray() {
    if (isDistractionFreeModeActive) {
      return [getDistractionFreeObj()];
    }

    const feedbackAction = isMobile
      ? { href: 'mailto:@MAIL@?subject=Feedback for @LONG_NAME@ tool' }
      : {
        onClick: () => {
          sendFeedback(feedbackIsInitiated);
        },
      };
    const arr = [
      {
        text: 'Send feedback',
        iconClass: 'ui-icon',
        iconName: 'envelope',
        id: 'send_feedback_info_item',
        ...feedbackAction,
      },
      {
        text: 'Source Code',
        iconClass: 'ui-icon',
        iconName: 'code',
        id: 'source_code_info_item',
        href: 'https://github.com/nasa-gibs/worldview',
      },
      {
        text: 'What\'s new',
        iconClass: 'ui-icon',
        iconName: 'flag',
        id: 'whats_new_info_item',
        href: 'https://wiki.earthdata.nasa.gov/pages/viewrecentblogposts.action?key=GIBS',
      },
      {
        text: 'About',
        iconClass: 'ui-icon',
        iconName: 'file',
        id: 'about_info_item',
        onClick: () => {
          aboutClick();
        },
      },
    ];

    // limit explore for larger device displays
    if (window.innerWidth >= 740
        && window.innerHeight >= 615) {
      if (
        config.features.tour
          && config.stories
          && config.storyOrder) {
        arr.splice(1, 0, getExploreWorldviewObj());
      }
    }
    if (notifications.isActive) {
      arr.splice(4, 0, getNotificationListItem());
    }
    arr.push(getDistractionFreeObj());
    return arr;
  }

  return (<IconList list={getListArray()} size="small" />);
}

function mapStateToProps(state) {
  const {
    ui, feedback, tour, notifications, config, models, browser,
  } = state;
  const { isDistractionFreeModeActive } = ui;

  return {
    feedbackIsInitiated: feedback.isInitiated,
    isDistractionFreeModeActive,
    isTourActive: tour.active,
    notifications,
    config,
    models,
    isMobile: browser.lessThan.medium,
  };
}
const mapDispatchToProps = (dispatch) => ({
  toggleDistractionFreeMode: () => {
    dispatch(toggleDistractionFreeModeAction());
  },
  sendFeedback: (isInitiated) => {
    onClickFeedback(isInitiated);
    if (!isInitiated) {
      dispatch(initFeedback());
    }
  },
  notificationClick: (obj, num) => {
    dispatch(
      openCustomContent('NOTIFICATION_LIST_MODAL', {
        headerText: 'Notifications',
        bodyComponent: Notifications,
        onClose: () => {
          if (num > 0) {
            dispatch(notificationsSeen());
            addToLocalStorage(obj);
          }
        },
      }),
    );
  },
  startTour: (isTourActive) => {
    if (isTourActive) {
      dispatch(endTourAction());
      setTimeout(() => {
        dispatch(startTourAction());
      }, 100);
    } else {
      dispatch(startTourAction());
    }
  },
  aboutClick: () => {
    // Create new functionality here that renders the about page
    // inside a modal window.
    dispatch(
      openCustomContent('ABOUT_MODAL', {
        headerText: 'About',
        bodyComponent: AboutPage,
        wrapClassName: 'about-page-modal',
      }),
    );
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(InfoList);

InfoList.propTypes = {
  aboutClick: PropTypes.func,
  config: PropTypes.object,
  feedbackIsInitiated: PropTypes.bool,
  isDistractionFreeModeActive: PropTypes.bool,
  isMobile: PropTypes.bool,
  isTourActive: PropTypes.bool,
  notificationClick: PropTypes.func,
  notifications: PropTypes.object,
  sendFeedback: PropTypes.func,
  startTour: PropTypes.func,
  toggleDistractionFreeMode: PropTypes.func,
};

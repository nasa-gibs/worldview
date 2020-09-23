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

  function getNotificationListItem(obj) {
    const { number, type, object } = notifications;
    return {
      text: 'Notifications',
      iconClass: 'ui-icon',
      // eslint-disable-next-line no-nested-ternary
      iconName: type === 'message'
        ? 'faGift'
        : type === 'outage'
          ? 'faExclamationCircle'
          : 'faBolt',
      id: 'notifications_info_item',
      badge: number,
      className: type ? `${type}-notification` : '',
      onClick: () => {
        notificationClick(object, number);
      },
    };
  }

  function getListArray() {
    const distractionFreeObj = {
      text: isDistractionFreeModeActive ? 'Exit Distraction Free' : 'Distraction Free',
      iconClass: 'ui-icon',
      iconName: 'faEye',
      id: 'distraction_free_info_item',
      onClick: () => {
        toggleDistractionFreeMode();
      },
    };
    if (!isDistractionFreeModeActive) {
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
          iconName: 'faEnvelope',
          id: 'send_feedback_info_item',
          ...feedbackAction,
        },
        {
          text: 'Source Code',
          iconClass: 'ui-icon',
          iconName: 'faCode',
          id: 'source_code_info_item',
          href: 'https://github.com/nasa-gibs/worldview',
        },
        {
          text: 'What\'s new',
          iconClass: 'ui-icon',
          iconName: 'faFlag',
          id: 'whats_new_info_item',
          href: 'https://wiki.earthdata.nasa.gov/pages/viewrecentblogposts.action?key=GIBS',
        },
        {
          text: 'About',
          iconClass: 'ui-icon',
          iconName: 'faFile',
          id: 'about_info_item',
          onClick: () => {
            aboutClick();
          },
        },
      ];

      // limit explore and distraction free for larger device displays
      if (window.innerWidth >= 740
        && window.innerHeight >= 615) {
        if (
          config.features.tour
          && config.stories
          && config.storyOrder) {
          const exploreWorlviewObj = {
            text: 'Explore Worldview',
            iconClass: 'ui-icon',
            iconName: 'faTruck',
            id: 'start_tour_info_item',
            onClick: () => {
              startTour(isTourActive);
              googleTagManager.pushEvent({
                event: 'tour_start_button',
              });
            },
          };
          arr.splice(1, 0, exploreWorlviewObj);
        }
        arr.push(distractionFreeObj);
      }
      if (notifications.isActive) {
        arr.splice(4, 0, getNotificationListItem());
      }
      return arr;
    }
    return [distractionFreeObj];
  }


  return (<IconList list={getListArray()} size="small" />);
}

function mapStateToProps(state) {
  const {
    ui, feedback, tour, notifications, config, models, browser,
  } = state;

  return {
    feedbackIsInitiated: feedback.isInitiated,
    isDistractionFreeModeActive: ui.isDistractionFreeModeActive,
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
        wrapClassName: 'about-page',
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

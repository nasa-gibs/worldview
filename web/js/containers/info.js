import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
// eslint-disable-next-line import/no-unresolved
import googleTagManager from 'googleTagManager';
import {
  requestTemplate,
  renderTemplate,
  openCustomContent,
} from '../modules/modal/actions';
import { toggleDistractionFreeMode } from '../modules/ui/actions';
import { ABOUT_PAGE_REQUEST } from '../modules/modal/constants';
import IconList from '../components/util/list';
import { onClickFeedback } from '../modules/feedback/util';
import { addToLocalStorage } from '../modules/notifications/util';

import { initFeedback } from '../modules/feedback/actions';
import { startTour, endTour } from '../modules/tour/actions';
import { notificationsSeen } from '../modules/notifications/actions';
import util from '../util/util';
import Notifications from './notifications';

class InfoList extends Component {
  getNotificationListItem(obj) {
    const { notifications, notificationClick } = this.props;
    const { number, type, object } = notifications;

    return {
      text: 'Notifications',
      iconClass: 'ui-icon',
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

  getListArray() {
    const {
      sendFeedback,
      feedbackIsInitiated,
      aboutClick,
      notifications,
      config,
      startTour,
      isDistractionFreeModeActive,
      isTourActive,
      isMobile,
      toggleDistractionFreeMode,
    } = this.props;
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
        const obj = this.getNotificationListItem();
        arr.splice(4, 0, obj);
      }
      return arr;
    }
    return [distractionFreeObj];
  }

  render() {
    const infoArray = this.getListArray();
    return <IconList list={infoArray} size="small" />;
  }
}

function mapStateToProps(state) {
  const { isInitiated } = state.feedback;

  return {
    feedbackIsInitiated: isInitiated,
    isDistractionFreeModeActive: state.ui.isDistractionFreeModeActive,
    isTourActive: state.tour.active,
    notifications: state.notifications,
    config: state.config,
    models: state.models,
    isMobile: state.browser.lessThan.medium,
  };
}
const mapDispatchToProps = (dispatch) => ({
  toggleDistractionFreeMode: () => {
    dispatch(toggleDistractionFreeMode());
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
      dispatch(endTour());
      setTimeout(() => {
        dispatch(startTour());
      }, 100);
    } else {
      dispatch(startTour());
    }
  },
  aboutClick: () => {
    if (util.browser.small) {
      window.open('pages/about.html?v=@BUILD_NONCE@', '_blank');
    } else {
      dispatch(
        requestTemplate(
          ABOUT_PAGE_REQUEST,
          'pages/about.html?v=@BUILD_NONCE@',
          'text/html',
        ),
      );
      dispatch(renderTemplate('About', 'modalAboutPage'));
    }
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

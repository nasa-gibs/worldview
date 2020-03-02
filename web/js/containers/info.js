import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import googleTagManager from 'googleTagManager';
import {
  requestTemplate,
  renderTemplate,
  openCustomContent
} from '../modules/modal/actions';
import { ABOUT_PAGE_REQUEST } from '../modules/modal/constants';
import IconList from '../components/util/list';
import { onClickFeedback } from '../modules/feedback/util';
import { addToLocalStorage } from '../modules/notifications/util';

import { initFeedback } from '../modules/feedback/actions';
import { startTour, endTour } from '../modules/tour/actions';
import { notificationsSeen } from '../modules/notifications/actions';
import util from '../util/util';
import Notifications from '../containers/notifications';

class InfoList extends Component {
  getNotificationListItem(obj) {
    const { number, type, object } = this.props.notifications;

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
      className: type ? type + '-notification' : '',
      onClick: () => {
        this.props.notificationClick(object, number);
      }
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
      isTourActive,
      isMobile
    } = this.props;
    const feedbackAction = isMobile
      ? { href: 'mailto:@MAIL@?subject=Feedback for @LONG_NAME@ tool' }
      : {
        onClick: () => {
          sendFeedback(feedbackIsInitiated);
        }
      };
    const arr = [
      {
        text: 'Send feedback',
        iconClass: 'ui-icon',
        iconName: 'faEnvelope',
        id: 'send_feedback_info_item',
        ...feedbackAction
      },
      {
        text: 'Source Code',
        iconClass: 'ui-icon',
        iconName: 'faCode',
        id: 'source_code_info_item',
        href: 'https://github.com/nasa-gibs/worldview'
      },
      {
        text: 'What\'s new',
        iconClass: 'ui-icon',
        iconName: 'faFlag',
        id: 'whats_new_info_item',
        href: 'https://wiki.earthdata.nasa.gov/pages/viewrecentblogposts.action?key=GIBS'
      },
      {
        text: 'About',
        iconClass: 'ui-icon',
        iconName: 'faFile',
        id: 'about_info_item',
        onClick: () => {
          aboutClick();
        }
      }
    ];
    if (
      config.features.tour &&
      config.stories &&
      config.storyOrder &&
      window.innerWidth >= 740 &&
      window.innerHeight >= 615
    ) {
      const exploreWorlviewObj = {
        text: 'Explore Worldview',
        iconClass: 'ui-icon',
        iconName: 'faTruck',
        id: 'start_tour_info_item',
        onClick: () => {
          startTour(isTourActive);
          googleTagManager.pushEvent({
            event: 'tour_start_button'
          });
        }
      };
      arr.splice(1, 0, exploreWorlviewObj);
    }
    if (notifications.isActive) {
      const obj = this.getNotificationListItem();
      arr.splice(4, 0, obj);
    }
    return arr;
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
    isTourActive: state.tour.active,
    notifications: state.notifications,
    config: state.config,
    models: state.models,
    isMobile: state.browser.lessThan.medium
  };
}
const mapDispatchToProps = dispatch => ({
  sendFeedback: isInitiated => {
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
        }
      })
    );
  },
  startTour: isTourActive => {
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
          'text/html'
        )
      );
      dispatch(renderTemplate('About', 'modalAboutPage'));
    }
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(InfoList);

InfoList.propTypes = {
  aboutClick: PropTypes.func,
  config: PropTypes.object,
  feedbackIsInitiated: PropTypes.bool,
  isMobile: PropTypes.bool,
  isTourActive: PropTypes.bool,
  models: PropTypes.object,
  notificationClick: PropTypes.func,
  notifications: PropTypes.object,
  sendFeedback: PropTypes.func,
  startTour: PropTypes.func
};

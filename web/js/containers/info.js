import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
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
import { notificationsSeen } from '../modules/notifications/actions';
import util from '../util/util';
import Notifications from '../containers/notifications';

class InfoList extends Component {
  getNotificationListItem(obj) {
    const { number, type, object } = this.props.notifications;
    const baseIconclass = 'ui-icon fa fa-fw fa-';

    return {
      text: 'Notifications',
      iconClass:
        type === 'message'
          ? baseIconclass + 'gift'
          : type === 'outage'
            ? baseIconclass + 'exclamation-circle'
            : baseIconclass + 'bolt',
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
      models
    } = this.props;
    let arr = [
      {
        text: 'Send feedback',
        iconClass: 'ui-icon fa fa-envelope fa-fw',
        id: 'send_feedback_info_item',
        onClick: () => {
          sendFeedback(feedbackIsInitiated);
        }
      },
      {
        text: 'Source Code',
        iconClass: 'ui-icon fa fa-code fa-fw',
        id: 'source_code_info_item',
        href: 'https://github.com/nasa-gibs/worldview'
      },
      {
        text: 'Whats new',
        iconClass: 'ui-icon fa fa-flag fa-fw',
        id: 'whats_new_info_item',
        href: 'https://github.com/nasa-gibs/worldview/releases'
      },
      {
        text: 'About',
        iconClass: 'ui-icon fa fa-file fa-fw',
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
        iconClass: 'ui-icon fa fa-truck fa-fw',
        id: 'start_tour_info_item',
        onClick: () => {
          models.tour.events.trigger('start-tour');
        }
      };
      arr.splice(1, 0, exploreWorlviewObj);
    }
    if (notifications.isActive) {
      let obj = this.getNotificationListItem();
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
    notifications: state.notifications,
    config: state.config,
    models: state.models
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
  openModal: PropTypes.func,
  notificationsRequest: PropTypes.object,
  sendFeedback: PropTypes.func,
  feedbackIsInitiated: PropTypes.bool,
  aboutClick: PropTypes.func,
  notificationClick: PropTypes.func,
  notifications: PropTypes.object,
  config: PropTypes.object,
  models: PropTypes.object
};

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { requestLoadedPage, renderTemplate } from '../modules/modal/actions';
import IconList from '../components/util/list';
import { onClickFeedback } from '../modules/feedback/util';
import { initFeedback } from '../modules/feedback/actions';
import util from '../util/util';

class InfoList extends Component {
  render() {
    const { sendFeedback, feedbackIsInitiated, aboutClick } = this.props;
    const infoArray = [
      {
        text: 'Send feedback',
        iconClass: 'ui-icon fa fa-envelope fa-fw',
        id: 'send_feedback_info_item',
        onClick: () => {
          sendFeedback(feedbackIsInitiated);
        }
      },
      {
        text: 'Start Tour',
        iconClass: 'ui-icon fa fa-truck fa-fw',
        id: 'start_tour_info_item'
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
    return <IconList list={infoArray} size="small" />;
  }
}
function mapStateToProps(state) {
  const { isInitiated } = state.feedback;

  return {
    feedbackIsInitiated: isInitiated
  };
}
const mapDispatchToProps = dispatch => ({
  sendFeedback: isInitiated => {
    onClickFeedback(isInitiated);
    if (!isInitiated) {
      dispatch(initFeedback());
    }
  },
  startTour: () => {},
  aboutClick: () => {
    if (util.browser.small) {
      window.open('pages/about.html?v=@BUILD_NONCE@', '_blank');
    } else {
      dispatch(
        requestLoadedPage(
          'MODAL_ABOUT_PAGE_REQUEST',
          'pages/about.html?v=@BUILD_NONCE@',
          'html'
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
  openModal: PropTypes.func
};

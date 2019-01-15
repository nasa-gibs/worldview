import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { openCustomContent } from '../modules/modal/actions';
import IconList from '../components/util/list';

const infoArray = [
  {
    text: 'Send feedback',
    iconClass: 'ui-icon fa fa-envelope fa-fw',
    id: 'send_feedback_info_item'
  },
  {
    text: 'Start Tour',
    iconClass: 'ui-icon fa fa-truck fa-fw',
    id: 'start_tour_info_item'
  },
  {
    text: 'Source Code',
    iconClass: 'ui-icon fa fa-code fa-fw',
    id: 'source_code_info_item'
  },
  {
    text: 'Whats new',
    iconClass: 'ui-icon fa fa-flag fa-fw',
    id: 'source_code_info_item'
  },
  {
    text: 'Notifications',
    iconClass: 'ui-icon fa fa-file fa-fw',
    id: 'source_code_info_item'
  }
];

class InfoList extends Component {
  render() {
    return <IconList list={infoArray} size="small" />;
  }
}
function mapStateToProps(state) {
  const { isOpen, bodyText, headerText, isCustom, key } = state;
  const id = key;

  return {
    isOpen,
    bodyText,
    headerText,
    isCustom,
    id
  };
}
const mapDispatchToProps = dispatch => ({
  openModal: text => {
    dispatch(openCustomContent(text));
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(InfoList);

InfoList.propTypes = {
  openModal: PropTypes.func
};

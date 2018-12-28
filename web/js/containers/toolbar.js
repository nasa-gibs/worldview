import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { openCustomContent } from '../modules/modal/actions';

class LinksContainer extends Component {
  render() {
    const { openModal } = this.props;
    return (
      <ul id="wv-toolbar">
        <li id="wv-link-button" className="wv-toolbar-button" />
        <li id="wv-proj-button" className="wv-toolbar-button" />
        <li
          id="wv-image-button"
          className="wv-toolbar-button"
          onClick={openModal}
        />
        <li id="wv-info-button" className="wv-toolbar-button wv-status-hide" />
      </ul>
    );
  }
}

const mapDispatchToProps = dispatch => ({
  openModal: () => {
    dispatch(openCustomContent('TOOLBAR-SNAPSHOT_MODAL'));
  }
});

export default connect(
  null,
  mapDispatchToProps
)(LinksContainer);

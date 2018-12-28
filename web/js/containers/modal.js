import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import update from 'immutability-helper';
import Modal from '../components/modal/modal';
import { customProps } from '../modules/modal/customs';
import { onToggle } from '../modules/modal/actions';

class ModalContainer extends Component {
  render() {
    const { isCustom, id } = this.props;
    const props =
      isCustom && id
        ? update(this.props, { $merge: customProps[id] })
        : this.props;
    return <Modal {...props} />;
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
  onToggle: () => {
    dispatch(onToggle());
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ModalContainer);

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import update from 'immutability-helper';
import { Modal, ModalBody, ModalHeader } from 'reactstrap';

import { customProps } from '../modules/modal/customs';
import { onToggle } from '../modules/modal/actions';
import Crop from '../components/util/image-crop';
import DetectOuterClick from '../components/util/detect-outer-click';

class ModalContainer extends Component {
  getStyle(props) {
    return {
      left: props.offsetLeft,
      right: props.offsetRight,
      width: props.width
    };
  }
  render() {
    const { isCustom, id, isOpen } = this.props;
    // Populate props from custom obj
    const newProps =
      isCustom && id
        ? update(this.props, { $merge: customProps[id] })
        : this.props;
    const {
      onToggle,
      bodyText,
      bodyHeader,
      headerComponent,
      headerText,
      modalClassName,
      backdrop,
      autoFocus,
      type
    } = newProps;
    const BodyComponent =
      customProps[id] && customProps[id].bodyComponent
        ? customProps[id].bodyComponent
        : '';
    const style = this.getStyle(newProps);
    return (
      <React.Fragment>
        <Modal
          isOpen={isOpen}
          toggle={onToggle}
          backdrop={backdrop}
          id={id}
          className={modalClassName || 'default-modal'}
          autoFocus={autoFocus || false}
          style={style}
        >
          <DetectOuterClick onClick={onToggle} disabled={!isOpen}>
            {headerComponent || headerText ? (
              <ModalHeader toggle={onToggle}>
                {headerComponent ? <headerComponent /> : headerText || ''}
              </ModalHeader>
            ) : (
              ''
            )}
            <ModalBody>
              {bodyHeader ? <h3>{bodyHeader}</h3> : ''}
              {BodyComponent ? <BodyComponent /> : bodyText || ''}
            </ModalBody>
          </DetectOuterClick>
        </Modal>
        {isOpen && type === 'selection' ? <Crop /> : ''}
      </React.Fragment>
    );
  }
}

function mapStateToProps(state) {
  const { models } = state.models;
  const { bodyText, headerText, isCustom, id, isOpen } = state.modal;

  return {
    isOpen: isOpen,
    bodyText,
    headerText,
    isCustom,
    id,
    models
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

ModalContainer.propTypes = {
  isCustom: PropTypes.bool,
  id: PropTypes.string
};
ModalContainer.defualtProps = {
  type: 'default',
  backdrop: true
};

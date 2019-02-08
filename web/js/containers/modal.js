import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import update from 'immutability-helper';
import { Modal, ModalBody, ModalHeader } from 'reactstrap';
import { customProps } from '../modules/modal/customs';
import { onToggle } from '../modules/modal/actions';
import DetectOuterClick from '../components/util/detect-outer-click';

class ModalContainer extends Component {
  getStyle(props) {
    return {
      left: props.offsetLeft,
      right: props.offsetRight,
      width: props.width
    };
  }
  getTemplateBody() {
    const { bodyTemplate } = this.props;
    return bodyTemplate.isLoading ? (
      <span> Loading </span>
    ) : (
      <div
        id="page"
        dangerouslySetInnerHTML={{ __html: bodyTemplate.response }}
      />
    );
  }
  render() {
    const { isCustom, id, isOpen, isTemplateModal } = this.props;
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
      type,
      wrapClassName,
      clickableBehindModal
    } = newProps;
    const BodyComponent =
      customProps[id] && customProps[id].bodyComponent
        ? customProps[id].bodyComponent
        : '';
    const style = this.getStyle(newProps);
    return (
      <Modal
        isOpen={isOpen}
        toggle={onToggle}
        backdrop={backdrop && type !== 'selection'}
        id={id}
        className={modalClassName || 'default-modal'}
        autoFocus={autoFocus || false}
        style={style}
        wrapClassName={wrapClassName}
      >
        <DetectOuterClick
          onClick={onToggle}
          disabled={!isOpen || type === 'selection' || clickableBehindModal}
        >
          {headerComponent || headerText ? (
            <ModalHeader toggle={onToggle}>
              {headerComponent ? <headerComponent /> : headerText || ''}
            </ModalHeader>
          ) : (
            ''
          )}
          <ModalBody>
            {bodyHeader ? <h3>{bodyHeader}</h3> : ''}
            {BodyComponent ? (
              <BodyComponent />
            ) : isTemplateModal ? (
              this.getTemplateBody()
            ) : (
              bodyText || ''
            )}
          </ModalBody>
        </DetectOuterClick>
      </Modal>
    );
  }
}

function mapStateToProps(state) {
  const { models } = state.legacy;
  const { bodyText, headerText, isCustom, id, isOpen, template } = state.modal;
  let bodyTemplate;
  let isTemplateModal = false;
  if (template) {
    bodyTemplate = state[template];
    isTemplateModal = true;
  }

  return {
    isOpen: isOpen,
    bodyText,
    headerText,
    isCustom,
    id,
    models,
    bodyTemplate,
    isTemplateModal
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
  id: PropTypes.string,
  bodyTemplate: PropTypes.node,
  isOpen: PropTypes.bool,
  isTemplateModal: PropTypes.bool
};

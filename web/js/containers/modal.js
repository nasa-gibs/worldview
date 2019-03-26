import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import update from 'immutability-helper';
import { toLower as lodashToLower } from 'lodash';
import { Modal, ModalBody, ModalHeader } from 'reactstrap';
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
        id="template-content"
        dangerouslySetInnerHTML={{ __html: bodyTemplate.response }}
      />
    );
  }
  render() {
    const { isCustom, id, isOpen, isTemplateModal, customProps } = this.props;
    // Populate props from custom obj
    const newProps =
      isCustom && id ? update(this.props, { $merge: customProps }) : this.props;
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
      clickableBehindModal,
      bodyComponent,
      onClose
    } = newProps;
    const style = this.getStyle(newProps);
    const lowerCaseId = lodashToLower(id);
    const BodyComponent = bodyComponent || '';
    const toggleWithClose = () => {
      onToggle();
      if (onClose && isOpen) {
        onClose();
      }
    };
    return (
      <Modal
        isOpen={isOpen}
        toggle={toggleWithClose}
        backdrop={backdrop && type !== 'selection'}
        id={lowerCaseId}
        className={
          isTemplateModal ? 'template-modal' : modalClassName || 'default-modal'
        }
        autoFocus={autoFocus || false}
        style={style}
        wrapClassName={wrapClassName + ' ' + lowerCaseId}
      >
        <DetectOuterClick
          onClick={toggleWithClose}
          disabled={!isOpen || type === 'selection' || clickableBehindModal}
        >
          {headerComponent || headerText ? (
            <ModalHeader toggle={toggleWithClose}>
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
  const {
    bodyText,
    headerText,
    isCustom,
    id,
    isOpen,
    template,
    customProps
  } = state.modal;
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
    isTemplateModal,
    customProps
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
  bodyTemplate: PropTypes.object,
  isOpen: PropTypes.bool,
  isTemplateModal: PropTypes.bool,
  customProps: PropTypes.object
};

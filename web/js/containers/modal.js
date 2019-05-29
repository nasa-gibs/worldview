import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import update from 'immutability-helper';
import { toLower as lodashToLower } from 'lodash';
import { Modal, ModalBody, ModalHeader } from 'reactstrap';
import { onToggle } from '../modules/modal/actions';
import ErrorBoundary from './error-boundary';
import DetectOuterClick from '../components/util/detect-outer-click';

class ModalContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      offsetTop: props.customProps.offsetTop,
      offsetLeft: props.customProps.offsetLeft,
      width: props.customProps.width
    };
  }
  // static getDerivedStateFromProps(newProps, state) {
  //   const customProps = newProps.customProps;
  //   if (
  //     customProps.width !== state.width ||
  //     customProps.offsetLeft !== state.offsetLeft ||
  //     customProps.offsetRight !== state.offsetRight
  //   ) {
  //     return {
  //       width: customProps.width,
  //       offsetLeft: customProps.offsetLeft,
  //       offsetRight: customProps.offsetRight
  //     };
  //   } else return null;
  // }
  getStyle(props) {
    return {
      left: props.offsetLeft,
      right: props.offsetRight,
      top: props.offsetTop,
      maxWidth: props.width
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
      onClose,
      CompletelyCustomModal,
      bodyComponentProps,
      timeout
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
      <ErrorBoundary>
        <Modal
          isOpen={isOpen}
          toggle={toggleWithClose}
          backdrop={backdrop && type !== 'selection'}
          id={lowerCaseId}
          className={
            isTemplateModal
              ? 'template-modal'
              : modalClassName || 'default-modal'
          }
          autoFocus={autoFocus || false}
          style={style}
          wrapClassName={wrapClassName + ' ' + lowerCaseId}
          modalTransition={{ timeout: timeout || 100 }}
        >
          {CompletelyCustomModal ? (
            <CompletelyCustomModal {...customProps} />
          ) : (
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
                  <BodyComponent {...bodyComponentProps} />
                ) : isTemplateModal ? (
                  this.getTemplateBody()
                ) : (
                  bodyText || ''
                )}
              </ModalBody>
            </DetectOuterClick>
          )}
        </Modal>
      </ErrorBoundary>
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
    screenWidth: state.browser.screenWidth,
    screenHeight: state.browser.screenHeight,
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
ModalContainer.defaultProps = {
  customProps: { width: 500, offsetTop: 0, offsetLeft: 0 }
};
ModalContainer.propTypes = {
  isCustom: PropTypes.bool,
  id: PropTypes.string,
  bodyTemplate: PropTypes.object,
  isOpen: PropTypes.bool,
  isTemplateModal: PropTypes.bool,
  customProps: PropTypes.object
};

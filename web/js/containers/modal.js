import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import update from 'immutability-helper';
import { toLower as lodashToLower } from 'lodash';
import { Modal, ModalBody, ModalHeader } from 'reactstrap';
import { onToggle } from '../modules/modal/actions';
import ErrorBoundary from './error-boundary';
import DetectOuterClick from '../components/util/detect-outer-click';
import Draggable from 'react-draggable';

class ModalContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      offsetTop: props.customProps.offsetTop,
      offsetLeft: props.customProps.offsetLeft,
      width: props.customProps.width,
      isDraggable: props.isDraggable
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
    const {
      isCustom,
      id,
      isOpen,
      isTemplateModal,
      customProps,
      isMobile,
      screenHeight
    } = this.props;
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
      timeout,
      isDraggable,
      desktopOnly,
      size
    } = newProps;

    const style = this.getStyle(newProps);
    const lowerCaseId = lodashToLower(id);
    const BodyComponent = bodyComponent || '';
    const allowOuterClick = !isOpen || type === 'selection' || clickableBehindModal;
    const modalWrapClass = clickableBehindModal ? `clickable-behind-modal ${wrapClassName}` : wrapClassName;
    const DraggableWrap = ({ condition, wrapper, children }) => condition ? wrapper(children) : children;
    const toggleWithClose = () => {
      onToggle();
      if (onClose && isOpen) {
        onClose();
      }
    };

    if (isMobile && isOpen && desktopOnly) {
      toggleWithClose();
    }
    return (
      <ErrorBoundary>
        <DraggableWrap
          condition={isDraggable}
          wrapper={children => <Draggable>{children}</Draggable>}
        >
          <Modal
            isOpen={isOpen}
            toggle={toggleWithClose}
            backdrop={backdrop}
            id={lowerCaseId}
            size={size}
            className={isTemplateModal ? 'template-modal' : modalClassName || 'default-modal'}
            autoFocus={autoFocus || false}
            style={style}
            wrapClassName={modalWrapClass + ' ' + lowerCaseId}
            modalTransition={{ timeout: isDraggable ? 0 : timeout || 100 }}
            fade={!isDraggable}
          >
            {CompletelyCustomModal
              ? (<CompletelyCustomModal {...customProps} toggleWithClose={toggleWithClose} />)
              : (
                <DetectOuterClick
                  onClick={toggleWithClose}
                  disabled={allowOuterClick}
                >
                  {(headerComponent || headerText) && (
                    <ModalHeader toggle={toggleWithClose}>
                      {headerComponent ? <headerComponent /> : headerText || ''}
                    </ModalHeader>
                  )}
                  <ModalBody>
                    {bodyHeader && <h3>{bodyHeader}</h3>}
                    {BodyComponent
                      ? (
                        <BodyComponent {...bodyComponentProps}
                          screenHeight={screenHeight}
                          closeModal={toggleWithClose} />
                      )
                      : isTemplateModal ? this.getTemplateBody() : bodyText || ''}
                  </ModalBody>
                </DetectOuterClick>
              )}
          </Modal>
        </DraggableWrap>
      </ErrorBoundary>
    );
  }
}

function mapStateToProps(state) {
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
  const isMobile = state.browser.lessThan.medium;

  return {
    isOpen: isOpen,
    bodyText,
    headerText,
    isCustom,
    id,
    isMobile,
    screenHeight: isMobile ? undefined : state.browser.screenHeight,
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
  bodyTemplate: PropTypes.object,
  customProps: PropTypes.object,
  id: PropTypes.string,
  isCustom: PropTypes.bool,
  isDraggable: PropTypes.bool,
  isMobile: PropTypes.bool,
  isOpen: PropTypes.bool,
  isTemplateModal: PropTypes.bool
};

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import update from 'immutability-helper';
import { toLower as lodashToLower } from 'lodash';
import { Modal, ModalBody, ModalHeader } from 'reactstrap';
import Draggable from 'react-draggable';
import { Resizable } from 'react-resizable';
import { onToggle } from '../modules/modal/actions';
import ErrorBoundary from './error-boundary';
import DetectOuterClick from '../components/util/detect-outer-click';

const InteractionWrap = ({ condition, wrapper, children }) => (condition ? wrapper(children) : children);
const toggleWithClose = (onToggle, onClose, isOpen) => {
  if (onClose && isOpen) {
    return () => {
      onToggle();
      onClose();
    };
  }
  return onToggle;
};
class ModalContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      width: props.customProps.width,
      height: props.customProps.height,
      offsetLeft: props.customProps.offsetLeft,
      offsetTop: props.customProps.offsetTop,
      offsetRight: props.customProps.offsetRight,
    };
    this.onResize = this.onResize.bind(this);
  }

  componentDidUpdate() {
    const {
      isCustom,
      id,
      isOpen,
      customProps,
      isMobile,
    } = this.props;
    // Populate props from custom obj
    const newProps = isCustom && id ? update(this.props, { $merge: customProps }) : this.props;
    const {
      onToggle,
      onClose,
      desktopOnly,
    } = newProps;

    const toggleFunction = toggleWithClose(onToggle, onClose, isOpen);
    if (isMobile && isOpen && desktopOnly) {
      toggleFunction();
    }
  }

  getStyle() {
    const {
      offsetLeft, offsetRight, offsetTop, width, height,
    } = this.state;

    return {
      left: offsetLeft,
      right: offsetRight,
      top: offsetTop,
      width,
      height,
      maxHeight: height,
    };
  }

  onResize(e, { size }) {
    e.stopPropagation();
    this.setState({
      width: size.width, height: size.height,
    });
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
      screenHeight,
    } = this.props;
    const { width, height } = this.state;
    // Populate props from custom obj
    const newProps = isCustom && id ? update(this.props, { $merge: customProps }) : this.props;
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
      size,
      isDraggable,
      isResizable,
      dragHandle,
    } = newProps;

    const style = this.getStyle();
    const lowerCaseId = lodashToLower(id);
    const BodyComponent = bodyComponent || '';
    const allowOuterClick = !isOpen || type === 'selection' || clickableBehindModal;
    const modalWrapClass = clickableBehindModal ? `clickable-behind-modal ${wrapClassName}` : wrapClassName;
    const toggleFunction = toggleWithClose(onToggle, onClose, isOpen);
    return (
      <ErrorBoundary>
        <InteractionWrap
          condition={isDraggable || isResizable}
          wrapper={(children) => (
            <Draggable
              handle={dragHandle}
              disabled={!isDraggable}
            >
              {isResizable
                ? (
                  <Resizable
                    className="resize-box"
                    resizeHandles={['se']}
                    width={width || newProps.width}
                    height={height || newProps.height}
                    minConstraints={[250, 250]}
                    maxConstraints={[495, screenHeight]}
                    handleSize={[8, 8]}
                    onResize={this.onResize}
                    draggableOpts={{ disabled: !isResizable }}
                  >
                    {children}
                  </Resizable>
                )
                : children}
            </Draggable>
          )}
        >
          <Modal
            isOpen={isOpen}
            toggle={toggleFunction}
            backdrop={backdrop}
            onExit={onClose}
            id={lowerCaseId}
            size={size}
            className={isTemplateModal ? 'template-modal' : modalClassName || 'default-modal'}
            autoFocus={autoFocus || false}
            style={style}
            wrapClassName={`${modalWrapClass} ${lowerCaseId}`}
            modalTransition={{ timeout: isDraggable ? 0 : timeout || 100 }}
            fade={!isDraggable}
          >
            {CompletelyCustomModal
              ? (
                <CompletelyCustomModal
                  key={`custom_${lowerCaseId}`}
                  modalHeight={height || newProps.height}
                  modalWidth={width || newProps.width}
                  {...customProps}
                  toggleWithClose={toggleFunction}
                />
              )
              : (
                <DetectOuterClick
                  onClick={toggleFunction}
                  disabled={allowOuterClick}
                >
                  {(headerComponent || headerText) && (
                    <ModalHeader toggle={toggleFunction}>
                      {headerComponent ? <headerComponent /> : headerText || ''}
                    </ModalHeader>
                  )}
                  <ModalBody>
                    {bodyHeader && <h3>{bodyHeader}</h3>}
                    {BodyComponent
                      ? (
                        <BodyComponent
                          {...bodyComponentProps}
                          screenHeight={screenHeight}
                          closeModal={toggleFunction}
                        />
                      )
                      : isTemplateModal ? this.getTemplateBody() : bodyText || ''}
                  </ModalBody>
                </DetectOuterClick>
              )}
          </Modal>
        </InteractionWrap>
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
    customProps,
  } = state.modal;
  let bodyTemplate;
  let isTemplateModal = false;
  if (template) {
    bodyTemplate = state[template];
    isTemplateModal = true;
  }
  const isMobile = state.browser.lessThan.medium;

  return {
    isOpen,
    bodyText,
    headerText,
    isCustom,
    id,
    isMobile,
    screenHeight: isMobile ? undefined : state.browser.screenHeight,
    screenWidth: isMobile ? undefined : state.browser.screenWidth,
    bodyTemplate,
    isTemplateModal,
    customProps,
  };
}
const mapDispatchToProps = (dispatch) => ({
  onToggle: () => {
    dispatch(onToggle());
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ModalContainer);
ModalContainer.defaultProps = {
  customProps: {},
};
ModalContainer.propTypes = {
  bodyTemplate: PropTypes.object,
  customProps: PropTypes.object,
  id: PropTypes.string,
  isCustom: PropTypes.bool,
  isDraggable: PropTypes.bool,
  isMobile: PropTypes.bool,
  isOpen: PropTypes.bool,
  isTemplateModal: PropTypes.bool,
  screenHeight: PropTypes.number,
};

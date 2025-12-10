import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import update from 'immutability-helper';
import { toLower as lodashToLower } from 'lodash';
import {
  Modal, ModalBody, ModalHeader, ModalFooter,
} from 'reactstrap';
import Draggable from 'react-draggable';
import { Resizable } from 'react-resizable';
import { onToggle } from '../modules/modal/actions';
import ErrorBoundary from './error-boundary';
import DetectOuterClick from '../components/util/detect-outer-click';

const InteractionWrap = ({
  condition,
  wrapper, children,
}) => (condition ? wrapper(children) : children);
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

  componentDidUpdate(prevProps) {
    const {
      isCustom,
      id,
      isOpen,
      customProps,
      isMobile,
      screenHeight,
      screenWidth,
    } = this.props;
    const newProps = isCustom && id ? update(this.props, { $merge: customProps }) : this.props;
    const {
      onToggle,
      onClose,
      desktopOnly,
    } = newProps;

    const screenHeightChanged = screenHeight !== prevProps.screenHeight;
    const screenWidthChanged = screenWidth !== prevProps.screenWidth;
    const toggleFunction = toggleWithClose(onToggle, onClose, isOpen);
    if (isMobile && isOpen) {
      if (desktopOnly) {
        toggleFunction();
      }
      if (customProps.mobileFullScreen && (screenHeightChanged || screenWidthChanged)) {
        const isPortrait = screenHeight > screenWidth;

        // Values below match the request made in ol-vector-interactions
        const sizeObj = {
          width: isPortrait ? screenWidth : 445,
          height: isPortrait ? screenHeight - 106 : 300,
        };

        this.onResize(null, { size: sizeObj });
      }
    }
  }

  getStyle() {
    const {
      isMobile, customProps,
    } = this.props;
    const {
      offsetLeft, offsetRight, offsetTop, width, height,
    } = this.state;
    const { mobileFullScreen } = customProps;
    const mobileTopOffset = 106;
    const top = isMobile && mobileFullScreen ? mobileTopOffset : offsetTop;
    const margin = isMobile ? 0 : '0.5rem auto';
    return {
      left: offsetLeft,
      right: offsetRight,
      top,
      width,
      height,
      maxHeight: height,
      margin,
    };
  }

  onResize(e, { size }) {
    if (e) {
      e.stopPropagation();
    }
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

  handleCreateChildren = (children) => {
    const {
      customProps,
      id,
      isCustom,
      screenHeight,
      screenWidth,
    } = this.props;
    const { width, height } = this.state;
    const style = this.getStyle();
    const newProps = isCustom && id ? update(this.props, { $merge: customProps }) : this.props;
    const {
      dragHandle,
      isDraggable,
      isResizable,
      stayOnscreen,
    } = newProps;
    const bounds = stayOnscreen ? {
      left: -(screenWidth / 2 - width / 2),
      right: screenWidth / 2 - width / 2,
      top: -style.top,
      bottom: screenHeight - height - style.top - 5,
    } : '';
      <Draggable
        handle={dragHandle}
        disabled={!isDraggable}
        bounds={bounds}
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
      </Draggable>;
  };

  getCustomModal() {
    const {
      customProps,
      id,
      isCustom,
      isEmbedModeActive,
      isMobile,
      isOpen,
    } = this.props;
    const { width, height } = this.state;
    const newProps = isCustom && id ? update(this.props, { $merge: customProps }) : this.props;
    const {
      CompletelyCustomModal,
      desktopOnly,
      mobileOnly,
      onClose,
      size,
    } = newProps;

    const isRestrictedDisplay = (isMobile && desktopOnly)
      || (!isMobile && mobileOnly)
      || (isEmbedModeActive && size === 'lg' && !id.includes('LAYER_INFO_MODAL'));
    if (isRestrictedDisplay) {
      return null;
    }
    const lowerCaseId = lodashToLower(id);
    const toggleFunction = toggleWithClose(onToggle, onClose, isOpen);

    const finalProps = {
      key: `custom_${lowerCaseId}`,
      modalHeight: height || newProps.height,
      modalWidth: width || newProps.width,
      toggleWithClose: toggleFunction,
      ...customProps,
    };

    return React.createElement(CompletelyCustomModal, finalProps);
  }

  getBodyComponent() {
    const {
      customProps,
      id,
      isCustom,
      isEmbedModeActive,
      isMobile,
      isOpen,
      screenHeight,
    } = this.props;
    const newProps = isCustom && id ? update(this.props, { $merge: customProps }) : this.props;
    const {
      bodyComponent,
      bodyComponentProps,
      desktopOnly,
      mobileOnly,
      onClose,
      size,
    } = newProps;

    const isRestrictedDisplay = (isMobile && desktopOnly)
      || (!isMobile && mobileOnly)
      || (isEmbedModeActive && size === 'lg' && !id.includes('LAYER_INFO_MODAL'));
    if (isRestrictedDisplay) {
      return null;
    }
    const BodyComponent = bodyComponent || '';
    const toggleFunction = toggleWithClose(onToggle, onClose, isOpen);

    const finalProps = {
      ...bodyComponentProps,
      parentId: { id },
      screenHeight: { screenHeight },
      closeModal: { toggleFunction },
    };
    return React.createElement(BodyComponent, finalProps);
  }



  render() {
    const {
      customProps,
      id,
      isCustom,
      isEmbedModeActive,
      isMobile,
      isOpen,
      isTemplateModal,
    } = this.props;
    const newProps = isCustom && id ? update(this.props, { $merge: customProps }) : this.props;
    const {
      autoFocus,
      backdrop,
      bodyComponent,
      bodyHeader,
      bodyText,
      footer,
      clickableBehindModal,
      CompletelyCustomModal,
      desktopOnly,
      headerComponent,
      headerText,
      isDraggable,
      isResizable,
      mobileOnly,
      modalClassName,
      onClose,
      onToggle,
      size,
      timeout,
      type,
      wrapClassName,
    } = newProps;

    const isRestrictedDisplay = (isMobile && desktopOnly)
      || (!isMobile && mobileOnly)
      || (isEmbedModeActive && size === 'lg' && !id.includes('LAYER_INFO_MODAL'));
    if (isRestrictedDisplay) {
      return null;
    }
    const style = this.getStyle();
    const lowerCaseId = lodashToLower(id);
    const BodyComponent = bodyComponent || '';
    const allowOuterClick = !isOpen || type === 'selection' || clickableBehindModal;
    const modalWrapClass = clickableBehindModal ? `clickable-behind-modal ${wrapClassName}` : wrapClassName;
    const toggleFunction = toggleWithClose(onToggle, onClose, isOpen);
    const closeBtn = (
      <button className="modal-close-btn" onClick={toggleFunction} type="button">
        &times;
      </button>
    );

    return (
      <ErrorBoundary>
        <InteractionWrap
          condition={isDraggable || isResizable}
          wrapper={this.handleCreateChildren}
        >
          <Modal
            isOpen={isOpen}
            toggle={toggleFunction}
            backdrop={backdrop}
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
              ? this.getCustomModal()
              : (
                <DetectOuterClick
                  onClick={toggleFunction}
                  disabled={allowOuterClick}
                >
                  {(headerComponent || headerText) && (
                  <ModalHeader toggle={toggleFunction} close={closeBtn}>
                    {headerComponent ? <headerComponent /> : headerText || ''}
                  </ModalHeader>
                  )}
                  <ModalBody>
                    {bodyHeader && <h3>{bodyHeader}</h3>}
                    {BodyComponent ? this.getBodyComponent()
                      : isTemplateModal ? this.getTemplateBody() : (<p>{bodyText}</p>) || ''}
                  </ModalBody>
                  {footer && (<ModalFooter />)}
                </DetectOuterClick>
              )}
          </Modal>
        </InteractionWrap>
      </ErrorBoundary>
    );
  }
}

function mapStateToProps(state) {
  const { embed, modal, screenSize } = state;
  const {
    bodyText,
    headerText,
    isCustom,
    id,
    isOpen,
    template,
    customProps,
  } = modal;
  let bodyTemplate;
  let isTemplateModal = false;
  if (template) {
    bodyTemplate = state[template];
    isTemplateModal = true;
  }
  const {
    screenHeight, screenWidth, orientation, isMobileDevice,
  } = screenSize;
  const isMobile = isMobileDevice;
  const { isEmbedModeActive } = embed;
  return {
    bodyTemplate,
    bodyText,
    customProps,
    headerText,
    id,
    isCustom,
    isEmbedModeActive,
    isMobile,
    isOpen,
    isTemplateModal,
    orientation,
    screenHeight,
    screenWidth,
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
  isEmbedModeActive: PropTypes.bool,
  isMobile: PropTypes.bool,
  isOpen: PropTypes.bool,
  isTemplateModal: PropTypes.bool,
  screenHeight: PropTypes.number,
  screenWidth: PropTypes.number,
};

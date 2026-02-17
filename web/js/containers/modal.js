import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import update from 'immutability-helper';
import { toLower as lodashToLower } from 'lodash';
import {
  Modal, ModalBody, ModalHeader, ModalFooter,
} from 'reactstrap';
import Draggable from 'react-draggable';
import { Resizable } from 'react-resizable';
import { onToggle as onToggleAction } from '../modules/modal/actions';
import ErrorBoundary from './error-boundary';
import DetectOuterClick from '../components/util/detect-outer-click';
import usePrevious from '../util/customHooks';

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

function ModalContainer(props) {
  const {
    isCustom,
    id,
    isOpen,
    customProps,
    isMobile,
    screenHeight,
    screenWidth,
    isEmbedModeActive,
    isTemplateModal,
  } = props;

  const {
    width: propsWidth,
    height: propsHeight,
    offsetLeft: propsOffsetLeft,
    offsetTop: propsOffsetTop,
    offsetRight: propsOffsetRight,
    mobileFullScreen,
    autoSetWidth,
    autoSetHeight,
  } = customProps;

  const [width, setWidth] = useState(propsWidth);
  const [height, setHeight] = useState(propsHeight);
  const [offsetLeft, setOffsetLeft] = useState(propsOffsetLeft);
  const [offsetTop, setOffsetTop] = useState(propsOffsetTop);
  const [offsetRight, setOffsetRight] = useState(propsOffsetRight);
  const [measuredElement, setMeasuredElement] = useState();
  const prevScreenHeight = usePrevious(screenHeight);
  const prevScreenWidth = usePrevious(screenWidth);
  const prevWidth = usePrevious(width);
  const prevHeight = usePrevious(height);
  const prevMeasuredElement = usePrevious(measuredElement);
  const prevMeasuredWidth = usePrevious(measuredElement?.getBoundingClientRect().width);
  const prevMeasuredHeight = usePrevious(measuredElement?.getBoundingClientRect().height);

  const handleElement = useCallback((node) => {
    if (node !== null) {
      setMeasuredElement(node);
    }
  }, []);

  const onParamChange = (e, { size }) => {
    if (e) {
      e.stopPropagation();
    }
    const elWidth = autoSetWidth && measuredElement
      ? measuredElement.getBoundingClientRect().width : size.width;
    const elHeight = autoSetHeight && measuredElement
      ? measuredElement.getBoundingClientRect().height : size.height;
    setWidth(elWidth);
    setHeight(elHeight);
    setOffsetLeft(size.offsetLeft);
    setOffsetTop(size.offsetTop);
    setOffsetRight(size.offsetRight);
  };

  const onResize = (e, { size }) => {
    if (e) {
      e.stopPropagation();
    }
    setWidth(size.width);
    setHeight(size.height);
  };

  useEffect(() => {
    const newProps = isCustom && id ? update(props, { $merge: customProps }) : props;
    const {
      onToggle,
      onClose,
      desktopOnly,
    } = newProps;

    const screenHeightChanged = screenHeight !== prevScreenHeight;
    const screenWidthChanged = screenWidth !== prevScreenWidth;
    const modalWidthChanged = propsWidth !== prevWidth;
    const modalHeightChanged = propsHeight !== prevHeight;
    const measuredElementChanged = (autoSetWidth || autoSetHeight)
      && measuredElement !== prevMeasuredElement;
    const measuredWidthChanged = autoSetWidth
      && measuredElement?.getBoundingClientRect().width !== prevMeasuredWidth;
    const measuredHeightChanged = autoSetHeight
      && measuredElement?.getBoundingClientRect().height !== prevMeasuredHeight;
    const measureChange = measuredElementChanged || measuredWidthChanged || measuredHeightChanged;
    const toggleFunction = toggleWithClose(onToggle, onClose, isOpen);
    if ((modalWidthChanged || modalHeightChanged || measureChange) && isOpen) {
      onParamChange(null, { size: customProps });
    }
    if (isMobile && isOpen) {
      if (desktopOnly) {
        toggleFunction();
      }
      if (mobileFullScreen && (screenHeightChanged || screenWidthChanged)) {
        const isPortrait = screenHeight > screenWidth;

        // Values below match the request made in ol-vector-interactions
        const sizeObj = {
          width: isPortrait ? screenWidth : 445,
          height: isPortrait ? screenHeight - 106 : 300,
        };

        onResize(null, { size: sizeObj });
      }
    }
  });

  function getStyle() {
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

  function getTemplateBody() {
    const { bodyTemplate } = props;
    return bodyTemplate.isLoading ? (
      <span> Loading </span>
    ) : (
      <div
        id="template-content"
        dangerouslySetInnerHTML={{ __html: bodyTemplate.response }}
      />
    );
  }

  const handleCreateChildren = (children) => {
    const style = getStyle();
    const newProps = isCustom && id ? update(props, { $merge: customProps }) : props;
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
    return (
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
              onResize={onResize}
              draggableOpts={{ disabled: !isResizable }}
            >
              {children}
            </Resizable>
          )
          : children}
      </Draggable>
    );
  };

  const newProps = isCustom && id ? update(props, { $merge: customProps }) : props;
  const {
    autoFocus,
    backdrop,
    bodyComponent,
    bodyComponentProps,
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
  const style = getStyle();
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
        wrapper={handleCreateChildren}
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
          <div ref={handleElement}>
            {CompletelyCustomModal
              ? (
                <CompletelyCustomModal
                  key={`custom_${lowerCaseId}`}
                  modalHeight={height || newProps.height}
                  modalWidth={width || newProps.width}
                  // eslint-disable-next-line react/jsx-props-no-spreading
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
                  <ModalHeader toggle={toggleFunction} close={closeBtn}>
                    {headerComponent ? <headerComponent /> : headerText || ''}
                  </ModalHeader>
                  )}
                  <ModalBody>
                    {bodyHeader && <h3>{bodyHeader}</h3>}
                    {BodyComponent ? (
                      <BodyComponent
                        // eslint-disable-next-line react/jsx-props-no-spreading
                        {...bodyComponentProps}
                        parentId={id}
                        screenHeight={screenHeight}
                        closeModal={toggleFunction}
                      />
                    )
                      : isTemplateModal ? getTemplateBody() : (<p>{bodyText}</p>) || ''}
                  </ModalBody>
                  {footer && (<ModalFooter />)}
                </DetectOuterClick>
              )}
          </div>
        </Modal>
      </InteractionWrap>
    </ErrorBoundary>
  );
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
    dispatch(onToggleAction());
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
  bodyTemplate: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  customProps: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  id: PropTypes.string,
  isCustom: PropTypes.bool,
  isEmbedModeActive: PropTypes.bool,
  isMobile: PropTypes.bool,
  isOpen: PropTypes.bool,
  isTemplateModal: PropTypes.bool,
  screenHeight: PropTypes.number,
  screenWidth: PropTypes.number,
};

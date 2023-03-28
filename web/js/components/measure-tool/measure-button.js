import React, { useState, memo, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, UncontrolledTooltip } from 'reactstrap';
import googleTagManager from 'googleTagManager';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MeasureMenu from './measure-menu';
import { openCustomContent } from '../../modules/modal/actions';
import AlertUtil from '../util/alert';

const MEASURE_MENU_PROPS = {
  headerText: null,
  type: 'toolbar',
  modalClassName: 'measure-tool-modal measure-mobile',
  backdrop: false,
  bodyComponent: MeasureMenu,
  touchDevice: false,
  wrapClassName: 'toolbar_modal_outer',
};

const mobileHelpMsg = 'Tap to add a point. Double-tap to complete.';
const helpMsg = 'Click: Add a point. Right-click: Cancel. Double-click to complete. ';

const MeasureButton = memo(() => {
  const dispatch = useDispatch();
  const [showAlert, setShowAlert] = useState(true);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const dismissAlert = () => setShowAlert(false);

  const onButtonClick = (evt) => {
    const touchDevice = evt.type === 'touchend';
    evt.stopPropagation();
    evt.preventDefault();
    MEASURE_MENU_PROPS.touchDevice = touchDevice;
    dispatch(openCustomContent('MEASURE_MENU', MEASURE_MENU_PROPS));
    setIsTouchDevice(touchDevice);
    setShowAlert(true);
    googleTagManager.pushEvent({
      event: 'measure_tool_activated',
    });
  };

  const isActive = useSelector((state) => state.measure.isActive);
  const isDistractionFreeModeActive = useSelector((state) => state.ui.isDistractionFreeModeActive);
  const isMobile = useSelector((state) => state.screenSize.isMobileDevice);

  const memoizedSelectors = useMemo(() => ({
    isActive,
    isDistractionFreeModeActive,
    isMobile,
  }), [isActive, isDistractionFreeModeActive, isMobile]);

  const buttonId = 'wv-measure-button';
  const labelText = 'Measure distances & areas';
  const faSize = memoizedSelectors.isMobile ? '2x' : '1x';
  const shouldShowAlert = memoizedSelectors.isActive && showAlert;
  const message = isTouchDevice ? mobileHelpMsg : helpMsg;
  const mobileMeasureButtonStyle = memoizedSelectors.isMobile ? {
    bottom: '20px',
    fontSize: '14.3px',
    height: '44px',
    margin: '0 0 0 4px',
    padding: '5.72px 9.1px',
  } : null;

  return (
    <>
      {shouldShowAlert && (
      <AlertUtil
        id="measurement-alert"
        isOpen
        icon="ruler"
        title="Measure Tool"
        message={message}
        onDismiss={dismissAlert}
      />
      )}

      {!memoizedSelectors.isDistractionFreeModeActive && (
      <Button
        id={buttonId}
        className="wv-measure-button wv-toolbar-button"
        aria-label={labelText}
        onTouchEnd={onButtonClick}
        onMouseDown={onButtonClick}
        disabled={memoizedSelectors.isActive}
        style={mobileMeasureButtonStyle}
      >
        <UncontrolledTooltip
          id="center-align-tooltip"
          placement="top"
          target={buttonId}
        >
          {labelText}
        </UncontrolledTooltip>
        <FontAwesomeIcon icon="ruler" size={faSize} />
      </Button>
      )}
    </>
  );
});

export default MeasureButton;

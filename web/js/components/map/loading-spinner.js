import React from 'react';
import { Spinner } from 'reactstrap';
import { useSelector } from 'react-redux';

function LoadingIndicator() {
  const {
    msg,
    shouldSpinnerShow,
    isMobile,
  } = useSelector((state) => ({
    msg: state.loading.msg,
    shouldSpinnerShow: state.loading.isLoading && !state.ui.isKioskModeActive,
    isMobile: state.screenSize.isMobileDevice,
  }));

  const spinnerStyle = isMobile ? {
    position: 'absolute',
    top: 10,
    left: 80,
    zIndex: 999,
  }
    : {
      position: 'absolute',
      top: 10,
      left: 300,
      zIndex: 999,
    };

  return shouldSpinnerShow && (
    <div style={spinnerStyle}>
      <Spinner color="light" size="sm" />
      {msg}
    </div>
  );
}

export default LoadingIndicator;

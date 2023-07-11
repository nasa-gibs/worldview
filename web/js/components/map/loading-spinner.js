import React from 'react';
import { Spinner } from 'reactstrap';
import { useSelector } from 'react-redux';

function LoadingIndicator() {
  const msg = useSelector((state) => state.loading.msg);
  const isMobile = useSelector((state) => state.screenSize.isMobileDevice);
  const isLoading = useSelector((state) => state.loading.isLoading);
  const isKioskModeActive = useSelector((state) => state.ui.isKioskModeActive);
  const shouldSpinnerShow = isLoading && !isKioskModeActive;

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

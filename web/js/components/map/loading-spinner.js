import { Spinner } from 'reactstrap';
import { useSelector } from 'react-redux';

function LoadingIndicator() {
  const isMobile = useSelector((state) => state.screenSize.isMobileDevice);
  const isLoading = useSelector((state) => state.loading.isLoading);
  const isKioskModeActive = useSelector((state) => state.ui.isKioskModeActive);
  const shouldSpinnerShow = isLoading && !isKioskModeActive;

  const spinnerStyle = isMobile
    ? {
      position: 'absolute',
      top: 10,
      left: 80,
      zIndex: 999,
      backgroundColor: 'rgb(40 40 40 / 85%)',
      padding: 10,
      borderRadius: 5,
      display: 'flex',
      alignItems: 'center',
    }
    : {
      position: 'absolute',
      top: 10,
      left: 310,
      zIndex: 999,
      backgroundColor: 'rgb(40 40 40 / 85%)',
      padding: 10,
      borderRadius: 5,
      display: 'flex',
      alignItems: 'center',
    };

  const innerSpinnerStyle = {
    height: '1.75rem',
    width: '1.75rem',
  };

  return shouldSpinnerShow && (
    <div style={spinnerStyle}>
      <Spinner color="light" size="sm" style={innerSpinnerStyle} />
    </div>
  );
}

export default LoadingIndicator;

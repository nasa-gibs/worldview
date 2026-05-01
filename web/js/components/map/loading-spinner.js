import { Spinner } from 'reactstrap';
import { useSelector } from 'react-redux';

function LoadingIndicator() {
  const loadingList = useSelector((state) => state.loading.loadingList);
  const loadedList = useSelector((state) => state.loading.loadedList);
  const isMobile = useSelector((state) => state.screenSize.isMobileDevice);
  const isLoading = useSelector((state) => state.loading.isLoading);
  const isKioskModeActive = useSelector((state) => state.ui.isKioskModeActive);
  const startTime = useSelector((state) => state.loading.startTime);
  const shouldSpinnerShow = isLoading && !isKioskModeActive;

  // const numLoading = Object.keys(loadingList).length || (isLoading ? 1 : 0);
  // const numLoaded = Object.keys(loadedList).filter((key) =>
  //  loadedList[key] >= loadingList[key]).length;

  const numLoading = Object.keys(loadingList)
    .reduce((acc, key) =>
      acc + Math.max((loadedList[key] ? loadedList[key] : 0), loadingList[key]), 0);
  const numLoaded = Object.keys(loadedList)
    .filter((key) => loadingList[key])
    .reduce((acc, key) => acc + loadedList[key], 0);

  const timeElapsed = Date.now() - startTime;
  const showDetails = timeElapsed > 3000 && startTime > 0;

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

  const msgStyle = {
    color: 'white',
    marginLeft: 10,
  };

  return shouldSpinnerShow && (
    <div style={spinnerStyle}>
      <Spinner color="light" size="sm" style={innerSpinnerStyle} />
      {showDetails && <span style={msgStyle}>{numLoaded} of {numLoading} requests loading</span>}
    </div>
  );
}

export default LoadingIndicator;

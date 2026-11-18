import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import {
  Progress, Modal, ModalBody, ModalHeader, Spinner,
} from 'reactstrap';
import { connect } from 'react-redux';
import * as olProj from 'ol/proj';
import { debounce as lodashDebounce, round as lodashRound } from 'lodash';

import GifStream from '../modules/animation/gifstream';
import GifPanel from '../components/animation-widget/gif-panel';
import util from '../util/util';
import Crop from '../components/util/image-crop';
import {
  RESOLUTIONS_GEO,
  RESOLUTIONS_POLAR,
} from '../modules/image-download/constants';
import {
  imageUtilCalculateResolution,
  imageUtilGetCoordsFromPixelValues,
  captureAnimationFrames,
  captureMapBackdrop,
} from '../modules/image-download/util';
import { TIME_SCALE_FROM_NUMBER } from '../modules/date/constants';
import GifResults from '../components/animation-widget/gif-post-creation';
import getAnimationFrames from '../modules/animation/selectors';
import { getStampProps, svgToCanvas, getNumberOfSteps } from '../modules/animation/util';
import { changeCropBounds } from '../modules/animation/actions';
import { selectDate as selectDateAction } from '../modules/date/actions';
import { promiseImageryForTime } from '../modules/map/util';
import { subdailyLayersActive } from '../modules/layers/selectors';
import { getSelectedDate } from '../modules/date/selectors';
import { formatDisplayDate } from '../modules/date/util';
import { CRS } from '../modules/map/constants';

import '../../css/components/image-download/snapshot-progress.css';

const CAPTURE_TIMEOUT_MS = 180_000;
const gifStream = new GifStream();

function GIF(props) {
  const {
    screenWidth,
    screenHeight,
    boundaries,
    onClose,
    increment,
    speed,
    map,
    proj,
    endDateStr,
    startDateStr,
    numberOfFrames,
    getFramesFunc,
    startDate,
    endDate,
    selectDate,
    promiseImagery,
    currentDate,
    onBoundaryChange: onBoundaryChangeProps,
  } = props;

  const bounds = boundaries || {
    x: screenWidth / 2 - 100,
    y: screenHeight / 2 - 100,
    x2: screenWidth / 2 + 100,
    y2: screenHeight / 2 + 100,
  };

  const {
    offsetLeftModal,
    offsetTopModal,
  } = getModalOffsets(bounds);

  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showDates, setShowDates] = useState(true);
  const [progress, setProgress] = useState(0);
  const [downloadedObject, setDownloadedObject] = useState({});
  const [offsetLeft, setOffsetLeft] = useState(offsetLeftModal);
  const [offsetTop, setOffsetTop] = useState(offsetTopModal);
  const [boundariesState, setBoundariesState] = useState(bounds);
  const [backdropUrlState, setBackdropUrlState] = useState(null);

  const mountedRef = useRef(false);
  const abortControllerRef = useRef(null);
  const backdropUrlRef = useRef(null);
  const isDownloadingRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      if (isDownloadingRef.current) {
        abortControllerRef.current?.abort();
        gifStream.cancel();
      }
      if (backdropUrlRef.current) {
        URL.revokeObjectURL(backdropUrlRef.current);
        backdropUrlRef.current = null;
      }
    };
  }, []);

  function getStyle() {
    return {
      left: offsetLeft,
      top: offsetTop,
      maxWidth: 342,
    };
  }

  function renderCloseBtn() {
    return (
      <button className="modal-close-btn" onClick={onClose} type="button">
        &times;
      </button>
    );
  }

  function renderSelectableBox() {
    const {
      x, y, x2, y2,
    } = boundariesState;
    const isGeoProjection = proj.id === 'geographic';
    const resolutions = isGeoProjection ? RESOLUTIONS_GEO : RESOLUTIONS_POLAR;
    const lonlats = imageUtilGetCoordsFromPixelValues(
      boundariesState,
      map.ui.selected,
    );
    const { crs } = proj;
    const geolonlat1 = olProj.transform(lonlats[0], crs, CRS.GEOGRAPHIC);
    const geolonlat2 = olProj.transform(lonlats[1], crs, CRS.GEOGRAPHIC);
    const mapView = map.ui.selected.getView();
    const resolution = imageUtilCalculateResolution(
      Math.round(mapView.getZoom()),
      proj,
      mapView.getCenter(),
    );

    const closeBtn = renderCloseBtn();

    return (
      <Modal
        backdrop={false}
        isOpen
        wrapClassName="clickable-behind-modal toolbar_modal_outer"
        className="gif-modal dynamic-modal"
        style={getStyle()}
        toggle={onClose}
      >
        <ModalHeader close={closeBtn}>Create An Animated GIF</ModalHeader>
        <ModalBody>
          <GifPanel
            speed={speed}
            resolutions={resolutions}
            resolution={resolution}
            showDates={showDates}
            increment={increment}
            map={map.ui.selected}
            lonlats={lonlats}
            startDate={startDateStr}
            endDate={endDateStr}
            onClick={createGIF}
            onCheck={toggleShowDates}
            numberOfFrames={numberOfFrames}
          />

          <Crop
            x={x}
            y={y}
            width={x2 - x}
            height={y2 - y}
            maxHeight={screenHeight}
            maxWidth={screenWidth}
            onChange={lodashDebounce(onBoundaryChange, 5)}
            onClose={onClose}
            coordinates={{
              bottomLeft: util.formatCoordinate([geolonlat1[0], geolonlat1[1]]),
              topRight: util.formatCoordinate([geolonlat2[0], geolonlat2[1]]),
            }}
            showCoordinates={false}
          />
        </ModalBody>
      </Modal>
    );
  }

  function toggleShowDates() {
    setShowDates(!showDates);
  }

  function encodeGIF(images, width, height) {
    const dimensions = {
      w: boundariesState.y2 - boundariesState.y,
      h: boundariesState.x2 - boundariesState.x,
    };
    let stampWidth;
    const breakPointOne = 300;
    const stampWidthRatio = 4.515;

    const { stampHeight, dateStamp } = getStampProps(
      stampWidthRatio,
      breakPointOne,
      stampWidth,
      dimensions,
      width,
      height,
    );

    const stamp = svgToCanvas('brand/images/wv-logo-w-shadow.svg', stampHeight);

    gifStream.createGIF(
      {
        gifWidth: width,
        gifHeight: height,
        images,
        waterMarkXCoordinate: stampHeight * 0.01, // Margin based on GIF Height
        waterMarkYCoordinate: stampHeight * 0.01, // Margin based on GIF Height
        waterMarkHeight: stamp.height,
        waterMark: stampHeight > 20 ? stamp : null,
        waterMarkWidth: stamp.width,
        fontSize: `${dateStamp.fontSize}px`,
        textXCoordinate: dateStamp.x,
        textYCoordinate: dateStamp.y, // date location based on Dimensions
        textAlign: dateStamp.align, // If textXCoordinate is null this takes precedence
        textBaseline: 'top', // If textYCoordinate is null this takes precedence
        fontColor: '#fff',
        fontWeight: '300',
        fontFamily: 'Inter, sans-serif',
        progressCallback: onGifProgress,
        showFrameText: stampHeight > 20,
        extraLastFrameDelay: 1000,
        text: '',
        stroke: {
          color: '#000',
          pixels: dateStamp.fontSize * 0.05,
        },
        pause: 1,
      },
      (obj) => {
        onGifComplete(obj, width, height);
      },
    );
  }

  async function createGIF(width, height, resolution) {
    const frames = getFramesFunc({ startDate, endDate, showDates });
    if (!frames) return; // too many frames

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const timeout = setTimeout(onCancel, CAPTURE_TIMEOUT_MS);

    // Freeze the map's current appearance before it is scaled for capture, so
    // the overlay can show it instead of a blank screen
    const mapBackdropUrl = await captureMapBackdrop(map.ui.selected.getTargetElement());
    if (!mountedRef.current) {
      if (mapBackdropUrl) URL.revokeObjectURL(mapBackdropUrl);
      clearTimeout(timeout);
      return;
    }
    backdropUrlRef.current = mapBackdropUrl;
    isDownloadingRef.current = true;
    setIsCapturing(true);
    setProgress(0);
    setBackdropUrlState(mapBackdropUrl);

    try {
      const canvases = await captureAnimationFrames({
        map: map.ui.selected,
        pixelBbox: [boundariesState.x, boundariesState.y, boundariesState.x2, boundariesState.y2],
        metersPerPixel: Number(resolution),
        projection: proj,
        dates: frames.map(({ date }) => date),
        originalDate: currentDate,
        selectDate,
        promiseImagery,
        abortSignal: abortController.signal,
        onProgress: (done, total) => {
          if (mountedRef.current) {
            setProgress(Math.round((done / total) * 50));
          }
        },
      });

      if (!mountedRef.current) return;

      setIsCapturing(false);
      encodeGIF(
        frames.map((frame, i) => ({ ...frame, canvas: canvases[i] })),
        width,
        height,
      );
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('GIF capture failed', error);
      }
      if (mountedRef.current) {
        isDownloadingRef.current = false;
        setIsCapturing(false);
        setProgress(0);
        setDownloadedObject({});
      }
    } finally {
      clearTimeout(timeout);
      abortControllerRef.current = null;
      releaseBackdrop();
    }
  }

  function releaseBackdrop() {
    if (backdropUrlRef.current) {
      URL.revokeObjectURL(backdropUrlRef.current);
      backdropUrlRef.current = null;
    }
    if (mountedRef.current) setBackdropUrlState(null);
  }

  function onCancel() {
    abortControllerRef.current?.abort();
    gifStream.cancel();
    if (mountedRef.current) {
      isDownloadingRef.current = false;
      setIsCapturing(false);
      setProgress(0);
      setDownloadedObject({});
    }
  }

  function onGifComplete(obj, width, height) {
    if (obj.error) {
      isDownloadingRef.current = false;
      setProgress(0);
      setDownloadedObject({});
    } else if (obj.cancelled) {
      if (mountedRef.current) {
        isDownloadingRef.current = false;
        setProgress(0);
        setDownloadedObject({});
      }
    } else {
      setIsDownloaded(true);
      setProgress(0);
      isDownloadingRef.current = false;
      setDownloadedObject({
        blob: obj.blob,
        size: lodashRound((obj.blob.size / 1024) * 0.001, 2),
        width,
        height,
      });
    }
  }

  // Encoding occupies the upper half of the bar; capture fills the lower half
  function onGifProgress(val) {
    setProgress(50 + Math.round(val / 2));
  }

  function getModalOffsets(boundariesIn) {
    const {
      x, y, x2, y2,
    } = boundariesIn;
    const width = 342;
    const height = 280;
    const padding = 20;
    let left = x2 + padding;
    let top = y - padding;
    if (left + width > screenWidth && x - padding - width > 0) {
      left = x - padding - width;
    }
    if (left + width > screenWidth && x - padding - width < 0) {
      left = left - width - padding;
      if (y < height) {
        top = y2;
      } else {
        top = y - padding - height;
      }
    }
    if (top + height > screenHeight) {
      top = screenHeight - padding - height;
    }
    return {
      offsetLeftModal: left,
      offsetTopModal: top,
    };
  }

  function onBoundaryChange(cropBounds) {
    const {
      x, y, width, height,
    } = cropBounds;
    const newBoundaries = {
      x,
      y,
      x2: x + width,
      y2: y + height,
    };
    const { offsetLeftModal, offsetTopModal } = getModalOffsets(newBoundaries);
    onBoundaryChangeProps(newBoundaries);
    setOffsetLeft(offsetLeftModal);
    setOffsetTop(offsetTopModal);
    setBoundariesState(newBoundaries);
  }

  const spinnerStyle = {
    margin: '20px 0',
    position: 'relative',
    left: '45%',
  };

  const closeBtn = renderCloseBtn();

  if (isDownloadingRef.current) {
    const headerText = isCapturing ? 'Capturing Frames' : 'Creating GIF';
    const cancelBtn = (
      <button className="modal-close-btn" onClick={onCancel} type="button">
        &times;
      </button>
    );
    return (
      <>
        {/* Masks the map while it is scaled up for capture */}
        {isCapturing && createPortal(
          <div className="wv-snapshot-progress-overlay opaque">
            {backdropUrlState && (
              <img className="wv-snapshot-progress-backdrop" src={backdropUrlState} alt="" />
            )}
          </div>,
          document.querySelector('.wv-content') || document.body,
        )}
        {/* Only the X cancels; backdrop clicks and Esc must not abort a capture */}
        <Modal
          isOpen
          toggle={onCancel}
          backdrop="static"
          keyboard={false}
          size={progress === 0 ? 'sm' : 'md'}
        >
          <ModalHeader close={cancelBtn}>{headerText}</ModalHeader>
          <ModalBody>
            {progress > 0
              ? <Progress value={progress} />
              : (
                <div style={spinnerStyle}>
                  <Spinner color="light" />
                </div>
              )}
          </ModalBody>
        </Modal>
      </>
    );
  }
  if (isDownloaded) {
    return (
      <GifResults
        speed={speed}
        gifObject={downloadedObject}
        startDate={startDateStr}
        endDate={endDateStr}
        onClose={onClose}
        increment={increment}
        boundaries={boundariesState}
        screenWidth={screenWidth}
        screenHeight={screenHeight}
        closeBtn={closeBtn}
      />
    );
  }
  return renderSelectableBox();
}

function mapStateToProps(state) {
  const {
    screenSize, proj, animation, map, date, layers,
  } = state;
  const {
    speed, startDate, endDate, boundaries,
  } = animation;
  const { screenWidth, screenHeight } = screenSize;
  const {
    customSelected, autoSelected, interval, customInterval, customDelta,
  } = date;
  const customIncrement = customSelected
    ? `${customDelta} ${TIME_SCALE_FROM_NUMBER[customInterval]}`
    : `1 ${TIME_SCALE_FROM_NUMBER[interval]}`;
  const increment = autoSelected
    ? 'Auto Interval'
    : customIncrement;
  return {
    screenWidth,
    screenHeight,
    boundaries,
    proj: proj.selected,
    isActive: animation.gifActive,
    startDateStr: formatDisplayDate(startDate, subdailyLayersActive(state)),
    endDateStr: formatDisplayDate(endDate, subdailyLayersActive(state)),
    startDate,
    endDate,
    increment: `${increment} Between Frames`,
    speed,
    map,
    currentDate: getSelectedDate(state),
    numberOfFrames: getNumberOfSteps(
      startDate,
      endDate,
      customSelected
        ? TIME_SCALE_FROM_NUMBER[customInterval]
        : TIME_SCALE_FROM_NUMBER[interval],
      null,
      autoSelected,
      layers.active.layers,
      customSelected ? customDelta : 1,
    ),
    getFramesFunc: (options) => getAnimationFrames(options, state),
    // Granule layers are skipped unless the auto flag is passed through
    promiseImagery: (imageryDate) => promiseImageryForTime(
      state, imageryDate, undefined, autoSelected,
    ),
  };
}
const mapDispatchToProps = (dispatch) => ({
  onBoundaryChange: (bounds) => {
    dispatch(changeCropBounds(bounds));
  },
  selectDate: (date) => {
    dispatch(selectDateAction(date));
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(GIF);

GIF.propTypes = {
  boundaries: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  startDate: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  endDate: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  startDateStr: PropTypes.string,
  endDateStr: PropTypes.string,
  currentDate: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  getFramesFunc: PropTypes.func,
  increment: PropTypes.string,
  map: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  numberOfFrames: PropTypes.number,
  onBoundaryChange: PropTypes.func,
  onClose: PropTypes.func,
  proj: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  promiseImagery: PropTypes.func,
  screenHeight: PropTypes.number,
  screenWidth: PropTypes.number,
  selectDate: PropTypes.func,
  speed: PropTypes.number,
};

import { Component } from 'react';
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
import { getStampProps, svgToPng, getNumberOfSteps } from '../modules/animation/util';
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

class GIF extends Component {
  constructor(props) {
    super(props);
    const { screenHeight } = props;
    const { screenWidth } = props;
    const boundaries = props.boundaries || {
      x: screenWidth / 2 - 100,
      y: screenHeight / 2 - 100,
      x2: screenWidth / 2 + 100,
      y2: screenHeight / 2 + 100,
    };
    const {
      offsetLeft,
      offsetTop,
    } = this.getModalOffsets(boundaries);
    this.state = {
      isDownloaded: false,
      showDates: true,
      progress: 0,
      downloadedObject: {},
      offsetLeft,
      offsetTop,
      boundaries,
    };
    this.abortController = null;
    this.backdropUrl = null;
    this.onBoundaryChange = this.onBoundaryChange.bind(this);
    this.onGifProgress = this.onGifProgress.bind(this);
    this.createGIF = this.createGIF.bind(this);
    this.onCancel = this.onCancel.bind(this);
    this.toggleShowDates = this.toggleShowDates.bind(this);
  }

  componentDidMount() {
    this.mounted = true;
  }

  componentWillUnmount() {
    this.mounted = false;
    const { isDownloading } = this.state;
    if (isDownloading) {
      this.abortController?.abort();
      gifStream.cancel();
    }
    if (this.backdropUrl) {
      URL.revokeObjectURL(this.backdropUrl);
      this.backdropUrl = null;
    }
  }

  getStyle() {
    const { offsetLeft, offsetRight, offsetTop } = this.state;
    return {
      left: offsetLeft,
      right: offsetRight,
      top: offsetTop,
      maxWidth: 342,
    };
  }

  renderCloseBtn() {
    const { onClose } = this.props;
    return (
      <button className="modal-close-btn" onClick={onClose} type="button">
        &times;
      </button>
    );
  }

  renderSelectableBox() {
    const {
      increment,
      speed,
      map,
      screenWidth,
      screenHeight,
      proj,
      onClose,
      endDateStr,
      startDateStr,
      numberOfFrames,
    } = this.props;
    const { boundaries, showDates } = this.state;
    const {
      x, y, x2, y2,
    } = boundaries;
    const isGeoProjection = proj.id === 'geographic';
    const resolutions = isGeoProjection ? RESOLUTIONS_GEO : RESOLUTIONS_POLAR;
    const lonlats = imageUtilGetCoordsFromPixelValues(
      boundaries,
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

    const closeBtn = this.renderCloseBtn();

    return (
      <Modal
        backdrop={false}
        isOpen
        wrapClassName="clickable-behind-modal toolbar_modal_outer"
        className="gif-modal dynamic-modal"
        style={this.getStyle()}
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
            onClick={this.createGIF}
            onCheck={this.toggleShowDates}
            numberOfFrames={numberOfFrames}
          />

          <Crop
            x={x}
            y={y}
            width={x2 - x}
            height={y2 - y}
            maxHeight={screenHeight}
            maxWidth={screenWidth}
            onChange={lodashDebounce(this.onBoundaryChange, 5)}
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

  toggleShowDates() {
    const { showDates } = this.state;
    this.setState({ showDates: !showDates });
  }

  encodeGIF(images, width, height) {
    const { boundaries } = this.state;
    const dimensions = {
      w: boundaries.y2 - boundaries.y,
      h: boundaries.x2 - boundaries.x,
    };
    let stampWidth;
    const breakPointOne = 300;
    const stampWidthRatio = 4.889;

    const { stampHeight, dateStamp } = getStampProps(
      stampWidthRatio,
      breakPointOne,
      stampWidth,
      dimensions,
      width,
      height,
    );

    const stamp = svgToPng('brand/images/wv-logo-w-shadow.svg', stampHeight);

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
        fontFamily: 'Open Sans, sans-serif',
        progressCallback: this.onGifProgress,
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
        this.onGifComplete(obj, width, height);
      },
    );
  }

  async createGIF(width, height, resolution) {
    const {
      getFramesFunc,
      map,
      proj,
      startDate,
      endDate,
      selectDate,
      promiseImagery,
      currentDate,
    } = this.props;
    const { boundaries, showDates } = this.state;

    const frames = getFramesFunc({ startDate, endDate, showDates });
    if (!frames) return; // too many frames

    const abortController = new AbortController();
    this.abortController = abortController;
    const timeout = setTimeout(this.onCancel, CAPTURE_TIMEOUT_MS);

    // Freeze the map's current appearance before it is scaled for capture, so
    // the overlay can show it instead of a blank screen
    const backdropUrl = await captureMapBackdrop(map.ui.selected.getTargetElement());
    if (!this.mounted) {
      if (backdropUrl) URL.revokeObjectURL(backdropUrl);
      clearTimeout(timeout);
      return;
    }
    this.backdropUrl = backdropUrl;
    this.setState({
      isDownloading: true, isCapturing: true, progress: 0, backdropUrl,
    });

    try {
      const canvases = await captureAnimationFrames({
        map: map.ui.selected,
        pixelBbox: [boundaries.x, boundaries.y, boundaries.x2, boundaries.y2],
        metersPerPixel: Number(resolution),
        projection: proj,
        dates: frames.map(({ date }) => date),
        originalDate: currentDate,
        selectDate,
        promiseImagery,
        abortSignal: abortController.signal,
        onProgress: (done, total) => {
          if (this.mounted) {
            this.setState({ progress: Math.round((done / total) * 50) });
          }
        },
      });

      if (!this.mounted) return;

      this.setState({ isCapturing: false });
      this.encodeGIF(
        frames.map((frame, i) => ({ ...frame, canvas: canvases[i] })),
        width,
        height,
      );
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('GIF capture failed', error);
      }
      if (this.mounted) {
        this.setState({
          isDownloading: false,
          isCapturing: false,
          progress: 0,
          downloadedObject: {},
        });
      }
    } finally {
      clearTimeout(timeout);
      this.abortController = null;
      this.releaseBackdrop();
    }
  }

  releaseBackdrop() {
    if (this.backdropUrl) {
      URL.revokeObjectURL(this.backdropUrl);
      this.backdropUrl = null;
    }
    if (this.mounted) this.setState({ backdropUrl: null });
  }

  onCancel() {
    this.abortController?.abort();
    gifStream.cancel();
    if (this.mounted) {
      this.setState({
        isDownloading: false,
        isCapturing: false,
        progress: 0,
        downloadedObject: {},
      });
    }
  }

  onGifComplete(obj, width, height) {
    if (obj.error) {
      this.setState({
        isDownloading: false,
        progress: 0,
        downloadedObject: {},
      });
    } else if (obj.cancelled) {
      if (this.mounted) {
        this.setState({
          isDownloading: false,
          progress: 0,
          downloadedObject: {},
        });
      }
    } else {
      this.setState({
        isDownloaded: true,
        progress: 0,
        isDownloading: false,
        downloadedObject: {
          blob: obj.blob,
          size: lodashRound((obj.blob.size / 1024) * 0.001, 2),
          width,
          height,
        },
      });
    }
  }

  // Encoding occupies the upper half of the bar; capture fills the lower half
  onGifProgress(val) {
    this.setState({
      progress: 50 + Math.round(val / 2),
    });
  }

  getModalOffsets(boundaries) {
    const { screenWidth, screenHeight } = this.props;
    const {
      x, y, x2, y2,
    } = boundaries;
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
      offsetLeft: left,
      offsetTop: top,
    };
  }

  onBoundaryChange(cropBounds) {
    const { onBoundaryChange } = this.props;
    const {
      x, y, width, height,
    } = cropBounds;
    const newBoundaries = {
      x,
      y,
      x2: x + width,
      y2: y + height,
    };
    const { offsetLeft, offsetTop } = this.getModalOffsets(newBoundaries);
    onBoundaryChange(newBoundaries);
    this.setState({
      offsetLeft,
      offsetTop,
      boundaries: newBoundaries,
    });
  }

  render() {
    const {
      increment,
      speed,
      endDateStr,
      startDateStr,
      screenHeight,
      screenWidth,
      onClose,
    } = this.props;
    const {
      isDownloaded,
      isDownloading,
      isCapturing,
      progress,
      downloadedObject,
      boundaries,
      backdropUrl,
    } = this.state;

    const spinnerStyle = {
      margin: '20px 0',
      position: 'relative',
      left: '45%',
    };

    const closeBtn = this.renderCloseBtn();

    if (isDownloading) {
      const headerText = isCapturing ? 'Capturing Frames' : 'Creating GIF';
      const cancelBtn = (
        <button className="modal-close-btn" onClick={this.onCancel} type="button">
          &times;
        </button>
      );
      return (
        <>
          {/* Masks the map while it is scaled up for capture */}
          {isCapturing && createPortal(
            <div className="wv-snapshot-progress-overlay opaque">
              {backdropUrl && (
                <img className="wv-snapshot-progress-backdrop" src={backdropUrl} alt="" />
              )}
            </div>,
            document.querySelector('.wv-content') || document.body,
          )}
          <Modal
            isOpen
            toggle={this.onCancel}
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
          boundaries={boundaries}
          screenWidth={screenWidth}
          screenHeight={screenHeight}
          closeBtn={closeBtn}
        />
      );
    }
    return this.renderSelectableBox();
  }
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
    promiseImagery: (imageryDate) => promiseImageryForTime(state, imageryDate),
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

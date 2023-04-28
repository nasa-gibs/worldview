import React, { Component } from 'react';
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
  resolutionsGeo,
  resolutionsPolar,
} from '../modules/image-download/constants';
import {
  imageUtilCalculateResolution,
  imageUtilGetCoordsFromPixelValues,
} from '../modules/image-download/util';
import { TIME_SCALE_FROM_NUMBER } from '../modules/date/constants';
import GifResults from '../components/animation-widget/gif-post-creation';
import getImageArray from '../modules/animation/selectors';
import { getStampProps, svgToPng, getNumberOfSteps } from '../modules/animation/util';
import { changeCropBounds } from '../modules/animation/actions';
import { subdailyLayersActive } from '../modules/layers/selectors';
import { formatDisplayDate } from '../modules/date/util';
import { CRS } from '../modules/map/constants';

const DEFAULT_URL = 'http://localhost:3002/api/v1/snapshot';
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
    this.onBoundaryChange = this.onBoundaryChange.bind(this);
    this.onGifProgress = this.onGifProgress.bind(this);
    this.createGIF = this.createGIF.bind(this);
    this.toggleShowDates = this.toggleShowDates.bind(this);
  }

  componentDidMount() {
    this.mounted = true;
  }

  componentWillUnmount() {
    this.mounted = false;
    const { isDownloading } = this.state;
    if (isDownloading) {
      gifStream.cancel();
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
    const resolutions = isGeoProjection ? resolutionsGeo : resolutionsPolar;
    const lonlats = imageUtilGetCoordsFromPixelValues(
      boundaries,
      map.ui.selected,
    );
    const { crs } = proj;
    const geolonlat1 = olProj.transform(lonlats[0], crs, CRS.GEOGRAPHIC);
    const geolonlat2 = olProj.transform(lonlats[1], crs, CRS.GEOGRAPHIC);
    const resolution = imageUtilCalculateResolution(
      Math.round(map.ui.selected.getView().getZoom()),
      isGeoProjection,
      proj.resolutions,
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
            projId={proj.id}
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

  createGIF(width, height) {
    const {
      getImageArray, startDate, endDate, url,
    } = this.props;
    const { boundaries, showDates } = this.state;
    const dimensions = {
      w: boundaries.y2 - boundaries.y,
      h: boundaries.x2 - boundaries.x,
    };
    let stampWidth;
    const breakPointOne = 300;
    const stampWidthRatio = 4.889;

    const build = (stamp, dateStamp, stampHeight) => {
      const options = {
        startDate,
        endDate,
        url,
        boundaries,
        showDates,
      };
      const imageArray = getImageArray(options, { width, height });
      if (!imageArray) return; // won't be true if there are too many frames

      gifStream.createGIF(
        {
          gifWidth: width,
          gifHeight: height,
          images: imageArray,
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
    };

    const stampProps = getStampProps(
      stampWidthRatio,
      breakPointOne,
      stampWidth,
      dimensions,
      width,
      height,
    );

    const newImage = svgToPng(
      'brand/images/wv-logo-w-shadow.svg',
      stampProps.stampHeight,
    );

    build(newImage, stampProps.dateStamp, stampProps.stampHeight);
    this.setState({ isDownloading: true });
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

  onGifProgress(val) {
    this.setState({
      progress: val,
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
      progress,
      downloadedObject,
      boundaries,
    } = this.state;

    const spinnerStyle = {
      margin: '20px 0',
      position: 'relative',
      left: '45%',
    };

    const closeBtn = this.renderCloseBtn();

    if (isDownloading) {
      const headerText = progress ? 'Creating GIF' : 'Requesting Imagery';
      return (
        <Modal
          isOpen
          toggle={onClose}
          size={progress === 0 ? 'sm' : 'md'}
        >
          <ModalHeader close={closeBtn}>{headerText}</ModalHeader>
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
    screenSize, proj, animation, map, date, config,
  } = state;
  const {
    speed, startDate, endDate, boundaries,
  } = animation;
  const { screenWidth, screenHeight } = screenSize;
  const {
    customSelected, interval, customInterval, customDelta,
  } = date;
  const increment = customSelected
    ? `${customDelta} ${TIME_SCALE_FROM_NUMBER[customInterval]}`
    : `1 ${TIME_SCALE_FROM_NUMBER[interval]}`;
  let url = DEFAULT_URL;
  if (config.features.imageDownload && config.features.imageDownload.url) {
    url = config.features.imageDownload.url;
  }
  if ('imageDownload' in config.parameters) {
    url = config.parameters.imageDownload;
    util.warn(`Redirecting GIF download to: ${url}`);
  }

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
    url,
    numberOfFrames: getNumberOfSteps(
      startDate,
      endDate,
      customSelected
        ? TIME_SCALE_FROM_NUMBER[customInterval]
        : TIME_SCALE_FROM_NUMBER[interval],
      customSelected ? customDelta : 1,
    ),
    getImageArray: (options, dimensions) => getImageArray(
      options,
      dimensions,
      state,
    ),
  };
}
const mapDispatchToProps = (dispatch) => ({
  onBoundaryChange: (bounds) => {
    dispatch(changeCropBounds(bounds));
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(GIF);

GIF.propTypes = {
  boundaries: PropTypes.object,
  startDate: PropTypes.object,
  endDate: PropTypes.object,
  startDateStr: PropTypes.string,
  endDateStr: PropTypes.string,
  getImageArray: PropTypes.func,
  increment: PropTypes.string,
  map: PropTypes.object,
  numberOfFrames: PropTypes.number,
  onBoundaryChange: PropTypes.func,
  onClose: PropTypes.func,
  proj: PropTypes.object,
  screenHeight: PropTypes.number,
  screenWidth: PropTypes.number,
  speed: PropTypes.number,
  url: PropTypes.string,
};

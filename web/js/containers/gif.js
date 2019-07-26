import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Spinner from 'react-loader';
import { connect } from 'react-redux';
import GifPanel from '../components/animation-widget/gif-panel';
import GifStream from '@entryline/gifstream'; // '../map/animation/gif-stream';
import util from '../util/util';
import * as olProj from 'ol/proj';
import { debounce as lodashDebounce, round as lodashRound } from 'lodash';

import Crop from '../components/util/image-crop';
import {
  resolutionsGeo,
  resolutionsPolar
} from '../modules/image-download/constants';
import {
  imageUtilCalculateResolution,
  imageUtilGetCoordsFromPixelValues,
  getPercentageFromPixel,
  getPixelFromPercentage
} from '../modules/image-download/util';
import { Progress, Modal, ModalBody, ModalHeader } from 'reactstrap';
import { timeScaleFromNumberKey } from '../modules/date/constants';
import { GifResults } from '../components/animation-widget/gif-post-creation';
import { getImageArray } from '../modules/animation/selectors';
import { getStampProps, svgToPng } from '../modules/animation/util';
import { changeCropBounds } from '../modules/animation/actions';

const gifStream = new GifStream();

class GIF extends Component {
  constructor(props) {
    super(props);
    const screenHeight = props.screenHeight;
    const screenWidth = props.screenWidth;
    const boundaries = props.boundaries || {
      x: screenWidth / 2 - 100,
      y: screenHeight / 2 - 100,
      x2: screenWidth / 2 + 100,
      y2: screenHeight / 2 + 100
    };
    this.state = {
      isDownloaded: false,
      isDownloadError: false,
      showDates: true,
      isValidSelection: true,
      progress: 0,
      downloadedObject: {},
      offsetLeft: boundaries.x2 + 20,
      offsetTop: boundaries.y - 20,
      boundaries
    };
    // set initial position of GIF panel
    this.onBoundaryChange = this.onBoundaryChange.bind(this);
    this.onGifProgress = this.onGifProgress.bind(this);
  }
  componentDidMount() {
    this.mounted = true;
  }
  componentWillUnmount() {
    this.mounted = false;
    if (this.state.isDownloading) {
      gifStream.cancel();
    }
  }
  getStyle(props) {
    return {
      left: props.offsetLeft,
      right: props.offsetRight,
      top: props.offsetTop,
      maxWidth: 342
    };
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
      endDate,
      startDate,
      numberOfFrames
    } = this.props;
    const { boundaries, showDates } = this.state;
    const { x, y, x2, y2 } = boundaries;
    const isGeoProjection = proj.id === 'geographic';
    const resolutions = isGeoProjection ? resolutionsGeo : resolutionsPolar;
    const lonlats = imageUtilGetCoordsFromPixelValues(
      boundaries,
      map.ui.selected
    );
    const crs = proj.crs;
    const geolonlat1 = olProj.transform(lonlats[0], crs, 'EPSG:4326');
    const geolonlat2 = olProj.transform(lonlats[1], crs, 'EPSG:4326');
    const resolution = imageUtilCalculateResolution(
      Math.round(map.ui.selected.getView().getZoom()),
      isGeoProjection,
      proj.resolutions
    );
    return (
      <Modal
        backdrop={false}
        isOpen={true}
        wrapClassName={'clickable-behind-modal toolbar_modal_outer'}
        className={'gif-modal dynamic-modal'}
        style={this.getStyle(this.state)}
        toggle={onClose}
      >
        <ModalHeader toggle={onClose}>Create An Animated GIF</ModalHeader>
        <ModalBody>
          <GifPanel
            speed={speed}
            resolutions={resolutions}
            resolution={resolution}
            showDates={showDates}
            increment={increment}
            projId={proj.id}
            lonlats={lonlats}
            startDate={startDate}
            endDate={endDate}
            onClick={this.createGIF.bind(this)}
            onCheck={this.toggleShowDates.bind(this)}
            numberOfFrames={numberOfFrames}
          />

          <Crop
            x={getPercentageFromPixel(screenWidth, x)}
            y={getPercentageFromPixel(screenHeight, y)}
            maxHeight={screenHeight}
            maxWidth={screenWidth}
            width={getPercentageFromPixel(screenWidth, x2 - x)}
            height={getPercentageFromPixel(screenHeight, y2 - y)}
            onChange={lodashDebounce(this.onBoundaryChange, 5)}
            onClose={onClose}
            coordinates={{
              bottomLeft: util.formatCoordinate([geolonlat1[0], geolonlat1[1]]),
              topRight: util.formatCoordinate([geolonlat2[0], geolonlat2[1]])
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
    const { getImageArray } = this.props;
    const { boundaries } = this.state;
    const dimensions = {
      w: boundaries.y2 - boundaries.y,
      h: boundaries.x2 - boundaries.x
    };
    var stampWidth;
    var build;
    var stampProps;
    var newImage;
    var breakPointOne = 300;
    var stampWidthRatio = 4.889;
    build = (stamp, dateStamp, stampHeight) => {
      let imageArray = getImageArray(this.state, this.props, { width, height });
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
          fontSize: dateStamp.fontSize + 'px',
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
            pixels: dateStamp.fontSize * 0.05
          },
          pause: 1
        },
        obj => {
          this.onGifComplete(obj, width, height);
        }
      );
    };
    stampProps = getStampProps(
      stampWidthRatio,
      breakPointOne,
      stampWidth,
      dimensions,
      width,
      height
    );
    newImage = svgToPng(
      'brand/images/wv-logo-w-shadow.svg',
      stampProps.stampHeight
    );

    build(newImage, stampProps.dateStamp, stampProps.stampHeight);
    this.setState({ isDownloading: true });
  }
  onGifComplete(obj, width, height) {
    if (obj.error) {
      this.setState({
        isDownloadError: true,
        isDownloading: false,
        progress: 0,
        downloadedObject: {}
      });
    } else if (obj.cancelled) {
      if (this.mounted) {
        this.setState({
          isDownloading: false,
          progress: 0,
          downloadedObject: {}
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
          height
        }
      });
    }
  }
  onGifProgress(val) {
    this.setState({
      progress: val
    });
  }
  onBoundaryChange(boundaries) {
    const { screenWidth, screenHeight, onBoundaryChange } = this.props;
    const x = getPixelFromPercentage(screenWidth, boundaries.x);
    const y = getPixelFromPercentage(screenHeight, boundaries.y);
    const x2 = x + getPixelFromPercentage(screenWidth, boundaries.width);
    const y2 = y + getPixelFromPercentage(screenHeight, boundaries.height);
    const width = 342;
    const height = 280;
    const bounds = { x, y, x2, y2 };
    let left = x2 + 20;
    let top = y - 20;
    if (left + width > screenWidth && x - 20 - width > 0) {
      left = x - 20 - width;
    }
    if (top + height > screenHeight) {
      top = screenHeight - 20 - height;
    }
    onBoundaryChange(bounds);
    this.setState({
      offsetLeft: left,
      offsetTop: top,
      boundaries: bounds
    });
  }
  render() {
    const {
      increment,
      speed,
      endDate,
      startDate,
      screenHeight,
      screenWidth,
      onClose
    } = this.props;
    const {
      isDownloaded,
      isDownloading,
      progress,
      downloadedObject,
      boundaries
    } = this.state;

    if (isDownloading) {
      let headerText = progress ? 'Creating GIF' : 'Requesting Imagery';
      return (
        <Modal
          isOpen={true}
          toggle={onClose}
          size={progress === 0 ? 'sm' : 'md'}
        >
          <ModalHeader toggle={onClose}>{headerText}</ModalHeader>
          <ModalBody>
            <div style={{ minHeight: 50 }}>
              <Spinner color={'#fff'} loaded={progress > 0}>
                <Progress value={progress} />
              </Spinner>
            </div>
          </ModalBody>
        </Modal>
      );
    }
    if (isDownloaded) {
      return (
        <GifResults
          speed={speed}
          gifObject={downloadedObject}
          startDate={startDate}
          onClose={onClose}
          endDate={endDate}
          increment={increment}
          boundaries={boundaries}
          screenWidth={screenWidth}
          screenHeight={screenHeight}
        />
      );
    }
    return this.renderSelectableBox();
  }
}

function mapStateToProps(state, ownProps) {
  const { browser, proj, animation, map, date, config } = state;
  const { speed, startDate, endDate, boundaries } = animation;
  const { screenWidth, screenHeight } = browser;
  const { customSelected, interval, customInterval, customDelta } = date;
  let increment = customSelected
    ? `${customDelta} ${timeScaleFromNumberKey[customInterval]}`
    : `1 ${timeScaleFromNumberKey[interval]}`;
  let url = 'http://localhost:3002/api/v1/snapshot';
  if (config.features.imageDownload && config.features.imageDownload.url) {
    url = config.features.imageDownload.url;
    util.warn('Redirecting GIF download to: ' + url);
  }
  return {
    screenWidth,
    screenHeight,
    boundaries,
    proj: proj.selected,
    isActive: animation.gifActive,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    increment: `${increment} Between Frames`,
    speed,
    map,
    url,
    numberOfFrames: util.getNumberOfDays(
      startDate,
      endDate,
      customSelected
        ? timeScaleFromNumberKey[customInterval]
        : timeScaleFromNumberKey[interval],
      customSelected ? customDelta : 1
    ),
    getImageArray: (gifComponentProps, gifComponentState, dimensions) => {
      return getImageArray(
        gifComponentProps,
        gifComponentState,
        dimensions,
        state
      );
    },
    onClose: ownProps.onClose
  };
}
const mapDispatchToProps = dispatch => ({
  onBoundaryChange: (bounds) => {
    dispatch(changeCropBounds(bounds));
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(GIF);

GIF.propTypes = {
  boundaries: PropTypes.object,
  endDate: PropTypes.string,
  getImageArray: PropTypes.func,
  increment: PropTypes.string,
  isActive: PropTypes.bool,
  map: PropTypes.object,
  numberOfFrames: PropTypes.number,
  onBoundaryChange: PropTypes.func,
  onClose: PropTypes.func,
  proj: PropTypes.object,
  screenHeight: PropTypes.number,
  screenWidth: PropTypes.number,
  speed: PropTypes.number,
  startDate: PropTypes.string
};

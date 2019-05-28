import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import GifPanel from '../components/animation-widget/gif-panel';
import GifStream from '@entryline/gifstream';
import util from '../util/util';
import * as olProj from 'ol/proj';
import { debounce as lodashDebounce } from 'lodash';
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
import { Progress } from 'reactstrap';
import { timeScaleFromNumberKey } from '../modules/date/constants';
import { getImageArray } from '../modules/animation/selectors';

const gifStream = new GifStream();

class GIF extends Component {
  constructor(props) {
    super(props);
    const screenHeight = props.screenHeight;
    const screenWidth = props.screenWidth;
    const boundaries = {
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
      boundaries
    };
    props.onChangeLocation(boundaries);
    this.onBoundaryChange = this.onBoundaryChange.bind(this);
  }
  createGIF(width, height) {
    const { getImageArray } = this.props;
    var imageArra;
    var stampWidth;
    var build;
    var stampProps;
    var newImage;
    var breakPointOne = 300;
    var stampWidthRatio = 4.889;
    build = function(stamp, dateStamp, stampHeight) {
      imageArra = getImageArray(this.state, this.props, { width, height });
      if (!imageArra) {
        // won't be true if there are too mant frames
        return;
      }
      gifStream.createGIF(
        {
          gifWidth: width,
          gifHeight: height,
          images: imageArra,
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
          progressCallback: onGifProgress,
          showFrameText: stampHeight > 20,
          extraLastFrameDelay: 1000,
          text: '',
          stroke: {
            color: '#000',
            pixels: dateStamp.fontSize * 0.05
          },
          pause: 1
        },
        onGifComplete
      );
    };
    stampProps = getStampProps(stampWidthRatio, breakPointOne, stampWidth);
    newImage = svgToPng(
      'brand/images/wv-logo-w-shadow.svg',
      stampProps.stampHeight
    );

    build(newImage, stampProps.dateStamp, stampProps.stampHeight);
  }
  onBoundaryChange(boundaries) {
    const { screenWidth, screenHeight, onChangeLocation, width } = this.props;
    const x = getPixelFromPercentage(screenWidth, boundaries.x);
    const y = getPixelFromPercentage(screenHeight, boundaries.y);
    const x2 = x + getPixelFromPercentage(screenWidth, boundaries.width);
    const y2 = y + getPixelFromPercentage(screenHeight, boundaries.height);
    onChangeLocation({ x, y, x2, y2 });
    this.setState({
      boundaries: {
        x: x,
        y: y,
        x2: x2,
        y2: y2
      }
    });
  }
  render() {
    const {
      isActive,
      increment,
      speed,
      map,
      screenWidth,
      screenHeight,
      proj,
      onClose,
      endDate,
      startDate
    } = this.props;
    const {
      isDownloaded,
      isDownloadError,
      boundaries,
      showDates,
      isDownloading,
      progress
    } = this.state;

    const { x, y, x2, y2 } = boundaries;
    const isGeoProjection = proj.id === 'geographic';
    const resolutions = isGeoProjection ? resolutionsGeo : resolutionsPolar;
    const lonlats = imageUtilGetCoordsFromPixelValues(
      boundaries,
      map.selectedMap
    );
    const crs = proj.crs;
    const geolonlat1 = olProj.transform(lonlats[0], crs, 'EPSG:4326');
    const geolonlat2 = olProj.transform(lonlats[1], crs, 'EPSG:4326');
    const resolution = imageUtilCalculateResolution(
      Math.round(map.getZoom()),
      isGeoProjection,
      proj.resolutions
    );

    if (!isActive) return '';
    if (isDownloading) return <Progress now={progress} />;
    return (
      <Fragment>
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
      </Fragment>
    );
  }
}

function mapStateToProps(state, ownProps) {
  const { browser, proj, legacy, animation, date, config } = state;
  const { speed, startDate, endDate } = animation;
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
    proj: proj.selected,
    isActive: true,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    increment: `${increment} Between Frames`,
    speed,
    map: legacy.map, // TODO replace with just map
    url,
    getImageArray: (gifComponentProps, gifComponentState, dimensions) => {
      return getImageArray(
        gifComponentProps,
        gifComponentState,
        dimensions,
        state
      );
    },
    onClose: () => {}
  };
}
const mapDispatchToProps = dispatch => ({});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(GIF);

GIF.propTypes = {};

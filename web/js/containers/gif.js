import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import GifPanel from '../components/animation-widget/gif-panel';
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
import { Modal, ModalHeader, ModalBody } from 'reactstrap';

class GIF extends Component {
  constructor(props) {
    super(props);
    const screenHeight = props.screenHeight;
    const screenWidth = props.screenWidth;
    this.state = {
      isDownloaded: false,
      isDownloadError: false,
      showDates: true,
      isValidSelection: true,
      boundaries: {
        x: screenWidth / 2 - 100,
        y: screenHeight / 2 - 100,
        x2: screenWidth / 2 + 100,
        y2: screenHeight / 2 + 100
      }
    };
  }
  onBoundaryChange(boundaries) {
    const { screenWidth, screenHeight } = this.props;
    const x = getPixelFromPercentage(screenWidth, boundaries.x);
    const y = getPixelFromPercentage(screenHeight, boundaries.y);
    const x2 = x + getPixelFromPercentage(screenWidth, boundaries.width);
    const y2 = y + getPixelFromPercentage(screenHeight, boundaries.height);
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
      animationSpeed,
      map,
      screenWidth,
      screenHeight,
      proj,
      onClose
    } = this.props;
    const {
      isDownloaded,
      isDownloadError,
      boundaries,
      showDates,
      isValidSelection
    } = this.state;
    console.log('yolo');
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
    // TODO if(isDownloaded) return <Down />
    return (
      <Fragment>
        <GifPanel
          speed={animationSpeed}
          resolutions={resolutions}
          resolution={resolution}
          showDates={showDates}
          increment={increment}
          projId={proj.id}
          lonlats={lonlats}
        />

        <Crop
          x={getPercentageFromPixel(screenWidth, x)}
          y={getPercentageFromPixel(screenHeight, y)}
          maxHeight={screenHeight}
          maxWidth={screenWidth}
          width={getPercentageFromPixel(screenWidth, x2 - x)}
          height={getPercentageFromPixel(screenHeight, y2 - y)}
          onChange={lodashDebounce(this.onBoundaryChange.bind(this), 10)}
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
  const { isActive, onClose, increment } = ownProps;
  const { browser, proj, legacy, animation } = state;
  const { screenWidth, screenHeight } = browser;
  return {
    onClose,
    screenWidth,
    screenHeight,
    proj: proj.selected,
    isActive: true,
    increment,
    map: legacy.map, // TODO replace with just map
    onClose: () => {}
  };
}
const mapDispatchToProps = dispatch => ({});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(GIF);

GIF.propTypes = {};

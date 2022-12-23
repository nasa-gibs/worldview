import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as olProj from 'ol/proj';
import { debounce as lodashDebounce } from 'lodash';
import ImageDownloadPanel from '../components/image-download/image-download-panel';
import Crop from '../components/util/image-crop';
import { onToggle } from '../modules/modal/actions';
import ErrorBoundary from './error-boundary';
import {
  getAlertMessageIfCrossesDateline,
  imageUtilCalculateResolution,
  imageUtilGetPixelValuesFromCoords,
} from '../modules/image-download/util';
import util from '../util/util';
import {
  getLayers,
  subdailyLayersActive,
} from '../modules/layers/selectors';
import { getSelectedDate } from '../modules/date/selectors';
import {
  resolutionsGeo,
  resolutionsPolar,
  fileTypesGeo,
  fileTypesPolar,
} from '../modules/image-download/constants';
import {
  onPanelChange,
  updateBoundaries,
} from '../modules/image-download/actions';
import { getNormalizedCoordinate } from '../components/location-search/util';
import { CRS } from '../modules/map/constants';

const DEFAULT_URL = 'http://localhost:3002/api/v1/snapshot';

class ImageDownloadContainer extends Component {
  constructor(props) {
    super(props);
    const { onBoundaryChange, screenHeight, screenWidth } = props;

    const boundaries = props.boundaries || {
      x: screenWidth / 2 - 100,
      y: screenHeight / 2 - 100,
      x2: screenWidth / 2 + 100,
      y2: screenHeight / 2 + 100,
    };
    const {
      x, y, y2, x2,
    } = boundaries;
    const bottomLeftLatLong = this.getLatLongFromPixelValue(x, y2);
    const topRightLatLong = this.getLatLongFromPixelValue(x2, y);

    this.state = {
      fileType: props.fileType,
      resolution: props.resolution,
      isWorldfile: props.isWorldfile,
      bottomLeftLatLong,
      topRightLatLong,
      boundaries,
    };
    this.debounceBoundaryStateUpdate = lodashDebounce(onBoundaryChange, 200);
    this.onBoundaryChange = this.onBoundaryChange.bind(this);
    this.onLatLongChange = this.onLatLongChange.bind(this);
  }

  /**
   * Convert pixel value to latitude longitude value
   * @param {Array} pixelX
   * @param {Array} pixelY
   *
   * @returns {Array}
   */
  getLatLongFromPixelValue(pixelX, pixelY) {
    const { proj, map } = this.props;
    const coordinate = map.ui.selected.getCoordinateFromPixel([Math.floor(pixelX), Math.floor(pixelY)]);
    const { crs } = proj.selected;
    const [x, y] = olProj.transform(coordinate, crs, CRS.GEOGRAPHIC);

    return [Number(x.toFixed(4)), Number(y.toFixed(4))];
  }

  /**
   * Get the crop boundaries from coordinate values
   * @param {Array} lonLat1 bottom left value
   * @param {Array} lonLat2 top right values
   *
   * @returns {Object}
   */
  getBoundaries(lonLat1, lonLat2) {
    const { map, proj } = this.props;
    const { crs } = proj.selected;
    const lonLatBottomLeft = olProj.transform(lonLat1, CRS.GEOGRAPHIC, crs);
    const lonLatTopRight = olProj.transform(lonLat2, CRS.GEOGRAPHIC, crs);
    const {
      x, y, x2, y2,
    } = imageUtilGetPixelValuesFromCoords(lonLatBottomLeft, lonLatTopRight, map.ui.selected);

    return {
      x, y, x2, y2,
    };
  }

  /**
   * Update latitude longitude state
   * with change from input
   * @param {Array} coordsArray extent array
   *
   * @returns {null}
   */
  onLatLongChange(coordsArray) {
    const bottomLeftLatLong = [coordsArray[0], coordsArray[1]];
    const topRightLatLong = [coordsArray[2], coordsArray[3]];
    const boundaries = this.getBoundaries(bottomLeftLatLong, topRightLatLong);
    this.setState({ bottomLeftLatLong, topRightLatLong, boundaries });
    this.debounceBoundaryStateUpdate(boundaries);
  }

  /**
  * Update latitude longitude values on
  * crop change
  * @param {Object} boundaries
  *
  * @returns {null}
  */
  onBoundaryChange(boundaries) {
    const {
      x, y, width, height,
    } = boundaries;
    const newBoundaries = {
      x,
      y,
      x2: x + width,
      y2: y + height,
    };
    const bottomLeftLatLong = this.getLatLongFromPixelValue(newBoundaries.x, newBoundaries.y2);
    const topRightLatLong = this.getLatLongFromPixelValue(newBoundaries.x2, newBoundaries.y);
    this.setState({ bottomLeftLatLong, topRightLatLong, boundaries: newBoundaries });
    this.debounceBoundaryStateUpdate(newBoundaries);
  }

  render() {
    const {
      proj,
      map,
      url,
      closeModal,
      screenWidth,
      screenHeight,
      date,
      getLayers,
      hasSubdailyLayers,
      markerCoordinates,
      onPanelChange,
    } = this.props;
    const {
      resolution, isWorldfile, fileType, bottomLeftLatLong, topRightLatLong, boundaries,
    } = this.state;
    const { crs } = proj.selected;
    const {
      x, y, x2, y2,
    } = boundaries;
    const lonLat1 = olProj.transform(bottomLeftLatLong, CRS.GEOGRAPHIC, crs);
    const lonLat2 = olProj.transform(topRightLatLong, CRS.GEOGRAPHIC, crs);
    const isGeoProjection = proj.id === 'geographic';
    const fileTypes = isGeoProjection ? fileTypesGeo : fileTypesPolar;
    const resolutions = isGeoProjection ? resolutionsGeo : resolutionsPolar;
    const mapView = map.ui.selected.getView();
    const newResolution = resolution
      || imageUtilCalculateResolution(
        Math.round(mapView.getZoom()),
        isGeoProjection,
        proj.selected.resolutions,
      );
    const viewExtent = mapView.calculateExtent(map.ui.selected.getSize());
    const normalizedBottomLeftLatLong = getNormalizedCoordinate(bottomLeftLatLong);
    const normalizedTopRightLatLong = getNormalizedCoordinate(topRightLatLong);

    return (
      <ErrorBoundary>
        <ImageDownloadPanel
          projection={proj}
          fileTypes={fileTypes}
          fileType={fileType}
          resolutions={resolutions}
          lonlats={[lonLat1, lonLat2]}
          resolution={newResolution}
          isWorldfile={isWorldfile}
          hasSubdailyLayers={hasSubdailyLayers}
          markerCoordinates={markerCoordinates}
          date={date}
          datelineMessage={getAlertMessageIfCrossesDateline(date, bottomLeftLatLong, topRightLatLong, proj)}
          url={url}
          viewExtent={viewExtent}
          getLayers={getLayers}
          onPanelChange={onPanelChange}
          onLatLongChange={this.onLatLongChange}
          geoLatLong={[normalizedBottomLeftLatLong, normalizedTopRightLatLong]}
          map={map.ui.selected}
        />
        <Crop
          x={x}
          y={y}
          width={x2 - x}
          height={y2 - y}
          maxHeight={screenHeight}
          maxWidth={screenWidth}
          onChange={this.onBoundaryChange}
          onClose={closeModal}
          bottomLeftStyle={{
            left: x,
            top: y2 + 5,
            width: x2 - x,
          }}
          topRightStyle={{
            left: x,
            top: y - 20,
            width: x2 - x,
          }}
          coordinates={{
            bottomLeft: util.formatCoordinate(bottomLeftLatLong),
            topRight: util.formatCoordinate(topRightLatLong),
          }}
          showCoordinates
        />
      </ErrorBoundary>
    );
  }
}

function mapStateToProps(state) {
  const {
    config,
    proj,
    screenSize,
    locationSearch,
    map,
    imageDownload,
  } = state;
  const {
    isWorldfile, fileType, resolution, boundaries,
  } = imageDownload;
  const { screenWidth, screenHeight } = screenSize;
  const markerCoordinates = locationSearch.coordinates;
  const hasSubdailyLayers = subdailyLayersActive(state);
  let url = DEFAULT_URL;
  if (config.features.imageDownload && config.features.imageDownload.url) {
    url = config.features.imageDownload.url;
  }
  if ('imageDownload' in config.parameters) {
    url = config.parameters.imageDownload;
    util.warn(`Redirecting image download to: ${url}`);
  }

  return {
    proj,
    url,
    map,
    screenWidth,
    screenHeight,
    isWorldfile,
    fileType,
    resolution,
    boundaries,
    hasSubdailyLayers,
    markerCoordinates,
    date: getSelectedDate(state),
    getLayers: () => getLayers(
      state,
      {
        reverse: true,
        renderable: true,
      },
    ),
  };
}
const mapDispatchToProps = (dispatch) => ({
  onClose: () => {
    dispatch(onToggle());
  },
  onPanelChange: (type, value) => {
    dispatch(onPanelChange(type, value));
  },
  onBoundaryChange: (obj) => {
    dispatch(updateBoundaries(obj));
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ImageDownloadContainer);

ImageDownloadContainer.propTypes = {
  closeModal: PropTypes.func.isRequired,
  fileType: PropTypes.string.isRequired,
  map: PropTypes.object.isRequired,
  onBoundaryChange: PropTypes.func.isRequired,
  onPanelChange: PropTypes.func.isRequired,
  proj: PropTypes.object.isRequired,
  url: PropTypes.string.isRequired,
  date: PropTypes.object,
  getLayers: PropTypes.func,
  hasSubdailyLayers: PropTypes.bool,
  isWorldfile: PropTypes.bool,
  markerCoordinates: PropTypes.array,
  resolution: PropTypes.string,
  screenHeight: PropTypes.number,
  screenWidth: PropTypes.number,
  boundaries: PropTypes.object,
};

import { useState } from 'react';
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
  getLayers as getLayersSelector,
  subdailyLayersActive,
} from '../modules/layers/selectors';
import { getSelectedDate } from '../modules/date/selectors';
import {
  RESOLUTIONS_GEO,
  RESOLUTIONS_POLAR,
  fileTypesGeo,
  fileTypesPolar,
} from '../modules/image-download/constants';
import {
  onPanelChange as onPanelChangeAction,
  updateBoundaries,
  updateInProgress,
} from '../modules/image-download/actions';
import { getNormalizedCoordinate } from '../components/location-search/util';
import { CRS } from '../modules/map/constants';

const DEFAULT_URL = 'http://localhost:3002/api/v1/snapshot';

function ImageDownloadContainer(props) {
  const {
    boundaries,
    fileType,
    resolution,
    isWorldfile,
    onBoundaryChange,
    screenHeight,
    screenWidth,
    proj,
    map,
    url,
    closeModal,
    date,
    getLayers,
    hasSubdailyLayers,
    markerCoordinates,
    onPanelChange,
    onProgressChange,
  } = props;

  const debounceBoundaryStateUpdate = lodashDebounce(onBoundaryChange, 200);

  const initBoundaries = boundaries || {
    x: screenWidth / 2 - 100,
    y: screenHeight / 2 - 100,
    x2: screenWidth / 2 + 100,
    y2: screenHeight / 2 + 100,
  };
  const {
    x: initX1, y: initY1, y2: initY2, x2: initX2,
  } = initBoundaries;

  const [fileTypeState] = useState(fileType);
  const [resolutionState, setResolutionState] = useState(resolution);
  const [isWorldfileState] = useState(isWorldfile);
  const [boundariesState, setBoundariesState] = useState(initBoundaries);
  const [bottomLeftLatLong, setBottomLeftLatLong] = useState(
    getLatLongFromPixelValue(initX1, initY2));
  const [topRightLatLong, setTopRightLatLong] = useState(getLatLongFromPixelValue(initX2, initY1));

  /**
   * Convert pixel value to latitude longitude value
   * @param {Array} pixelX
   * @param {Array} pixelY
   *
   * @returns {Array}
   */
  function getLatLongFromPixelValue(pixelX, pixelY) {
    const coordinate = map.ui.selected.getCoordinateFromPixel(
      [Math.floor(pixelX), Math.floor(pixelY)],
    );
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
  function getBoundaries(lonLat1, lonLat2) {
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
  function onLatLongChange(coordsArray) {
    const latLongBL = [coordsArray[0], coordsArray[1]];
    const latLongTR = [coordsArray[2], coordsArray[3]];
    const boundariesOut = getBoundaries(latLongBL, latLongTR);
    setBottomLeftLatLong(latLongBL);
    setTopRightLatLong(latLongTR);
    setBoundariesState(boundariesOut);
    debounceBoundaryStateUpdate(boundariesOut);
  }

  /**
  * Update latitude longitude values on
  * crop change
  * @param {Object} boundaries
  *
  * @returns {null}
  */
  function onBoundaryChangeFunc(boundariesIn) {
    const {
      x, y, width, height,
    } = boundariesIn;
    const newBoundaries = {
      x,
      y,
      x2: x + width,
      y2: y + height,
    };
    const latLongBL = getLatLongFromPixelValue(newBoundaries.x, newBoundaries.y2);
    const latLongTR = getLatLongFromPixelValue(newBoundaries.x2, newBoundaries.y);
    setBottomLeftLatLong(latLongBL);
    setTopRightLatLong(latLongTR);
    setBoundariesState(newBoundaries);
    debounceBoundaryStateUpdate(newBoundaries);
  }

  /**
  * Update resolution value on change
  * @param {Object} res
  *
  * @returns {null}
  */
  function onResolutionChange(res) {
    setResolutionState(res);
  }

  const { crs } = proj.selected;
  const {
    x, y, x2, y2,
  } = boundariesState;
  const lonLat1 = olProj.transform(bottomLeftLatLong, CRS.GEOGRAPHIC, crs);
  const lonLat2 = olProj.transform(topRightLatLong, CRS.GEOGRAPHIC, crs);
  const isGeoProjection = proj.id === 'geographic';
  const fileTypes = isGeoProjection ? fileTypesGeo : fileTypesPolar;
  const resolutions = isGeoProjection ? RESOLUTIONS_GEO : RESOLUTIONS_POLAR;
  const mapView = map.ui.selected.getView();
  const center = mapView.getCenter();
  const newResolution = resolutionState ||
    imageUtilCalculateResolution(
      Math.round(mapView.getZoom()),
      proj,
      center,
    );
  const viewExtent = mapView.calculateExtent(map.ui.selected.getSize());
  const normalizedBottomLeftLatLong = getNormalizedCoordinate(bottomLeftLatLong);
  const normalizedTopRightLatLong = getNormalizedCoordinate(topRightLatLong);

  return (
    <ErrorBoundary>
      <ImageDownloadPanel
        projection={proj}
        fileTypes={fileTypes}
        fileType={fileTypeState}
        resolutions={resolutions}
        lonlats={[lonLat1, lonLat2]}
        boundaries={[x, y, x2, y2]}
        resolution={newResolution}
        isWorldfile={isWorldfileState}
        hasSubdailyLayers={hasSubdailyLayers}
        markerCoordinates={markerCoordinates}
        date={date}
        datelineMessage={getAlertMessageIfCrossesDateline(
          date,
          bottomLeftLatLong,
          topRightLatLong,
          proj,
        )}
        url={url}
        viewExtent={viewExtent}
        getLayers={getLayers}
        onPanelChange={onPanelChange}
        onLatLongChange={onLatLongChange}
        geoLatLong={[normalizedBottomLeftLatLong, normalizedTopRightLatLong]}
        map={map.ui.selected}
        onResolutionChange={onResolutionChange}
        onProgressChange={onProgressChange}
      />
      <Crop
        x={x}
        y={y}
        width={x2 - x}
        height={y2 - y}
        maxHeight={screenHeight}
        maxWidth={screenWidth}
        onChange={onBoundaryChangeFunc}
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
    getLayers: () => getLayersSelector(
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
    dispatch(onPanelChangeAction(type, value));
  },
  onBoundaryChange: (obj) => {
    dispatch(updateBoundaries(obj));
  },
  onProgressChange: (obj) => {
    dispatch(updateInProgress(obj));
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ImageDownloadContainer);

ImageDownloadContainer.propTypes = {
  closeModal: PropTypes.func.isRequired,
  fileType: PropTypes.string.isRequired,
  map: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  onBoundaryChange: PropTypes.func.isRequired,
  onProgressChange: PropTypes.func.isRequired,
  onPanelChange: PropTypes.func.isRequired,
  proj: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  url: PropTypes.string.isRequired,
  date: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  getLayers: PropTypes.func,
  hasSubdailyLayers: PropTypes.bool,
  isWorldfile: PropTypes.bool,
  markerCoordinates: PropTypes.oneOfType([PropTypes.array, PropTypes.oneOf(['null'])]),
  resolution: PropTypes.string,
  screenHeight: PropTypes.number,
  screenWidth: PropTypes.number,
  boundaries: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
};

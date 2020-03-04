import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as olProj from 'ol/proj';
import { debounce as lodashDebounce } from 'lodash';
import Panel from '../components/image-download/panel';
import Crop from '../components/util/image-crop';
import { onToggle } from '../modules/modal/actions';
import ErrorBoundary from './error-boundary';
import {
  imageUtilCalculateResolution,
  imageUtilGetCoordsFromPixelValues,
} from '../modules/image-download/util';
import util from '../util/util';
import {
  hasSubDaily as hasSubDailySelector,
  getLayers,
} from '../modules/layers/selectors';
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

const DEFAULT_URL = 'http://localhost:3002/api/v1/snapshot';

class ImageDownloadContainer extends Component {
  constructor(props) {
    super(props);
    const { screenHeight } = props;
    const { screenWidth } = props;
    this.state = {
      fileType: props.fileType,
      resolution: props.resolution,
      isWorldfile: props.isWorldfile,
      boundaries: props.boundaries || {
        x: screenWidth / 2 - 100,
        y: screenHeight / 2 - 100,
        x2: screenWidth / 2 + 100,
        y2: screenHeight / 2 + 100,
      },
    };
    this.debounceBoundaryUpdate = lodashDebounce(
      this.props.onBoundaryChange,
      200,
    );
    this.onBoundaryChange = this.onBoundaryChange.bind(this);
  }

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

    this.setState({ boundaries: newBoundaries });
    this.debounceBoundaryUpdate(newBoundaries);
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
      onPanelChange,
    } = this.props;
    const {
      boundaries, resolution, isWorldfile, fileType,
    } = this.state;
    const {
      x, y, x2, y2,
    } = boundaries;
    const isGeoProjection = proj.id === 'geographic';
    const fileTypes = isGeoProjection ? fileTypesGeo : fileTypesPolar;
    const resolutions = isGeoProjection ? resolutionsGeo : resolutionsPolar;
    const lonlats = imageUtilGetCoordsFromPixelValues(
      boundaries,
      map.ui.selected,
    );
    const { crs } = proj.selected;
    const geolonlat1 = olProj.transform(lonlats[0], crs, 'EPSG:4326');
    const geolonlat2 = olProj.transform(lonlats[1], crs, 'EPSG:4326');

    const newResolution = resolution
      || imageUtilCalculateResolution(
        Math.round(map.ui.selected.getView().getZoom()),
        isGeoProjection,
        proj.selected.resolutions,
      );
    const boxTopLongitude = Math.abs(geolonlat1[0]) > 180 ? util.normalizeWrappedLongitude(geolonlat1[0]) : geolonlat1[0];
    const boxBottomLongitude = Math.abs(geolonlat2[0]) > 180 ? util.normalizeWrappedLongitude(geolonlat2[0]) : geolonlat2[0];
    return (
      <ErrorBoundary>
        <Panel
          projection={proj}
          fileTypes={fileTypes}
          fileType={fileType}
          resolutions={resolutions}
          lonlats={lonlats}
          resolution={newResolution}
          isWorldfile={isWorldfile}
          hasSubdailyLayers={hasSubdailyLayers}
          date={date}
          url={url}
          crs={crs}
          getLayers={getLayers}
          onPanelChange={onPanelChange}
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
            bottomLeft: util.formatCoordinate([boxTopLongitude, geolonlat1[1]]),
            topRight: util.formatCoordinate([boxBottomLongitude, geolonlat2[1]]),
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
    browser,
    layers,
    compare,
    date,
    map,
    imageDownload,
  } = state;
  const {
    isWorldfile, fileType, resolution, boundaries,
  } = imageDownload;
  const { screenWidth, screenHeight } = browser;
  const activeDateStr = compare.isCompareA ? 'selected' : 'selectedB';
  const activeStr = compare.activeString;
  const hasSubdailyLayers = hasSubDailySelector(layers[activeStr]);
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
    date: date[activeDateStr],
    getLayers: () => getLayers(
      layers[compare.activeString],
      {
        reverse: true,
        renderable: true,
      },
      state,
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

ImageDownloadContainer.defualtProps = {
  fileType: 'image/jpeg',
};
ImageDownloadContainer.propTypes = {
  closeModal: PropTypes.func.isRequired,
  fileType: PropTypes.string.isRequired,
  map: PropTypes.object.isRequired,
  onBoundaryChange: PropTypes.func.isRequired,
  onPanelChange: PropTypes.func.isRequired,
  proj: PropTypes.object.isRequired,
  url: PropTypes.string.isRequired,
  boundaries: PropTypes.object,
  date: PropTypes.object,
  getLayers: PropTypes.func,
  hasSubdailyLayers: PropTypes.bool,
  isWorldfile: PropTypes.bool,
  resolution: PropTypes.string,
  screenHeight: PropTypes.number,
  screenWidth: PropTypes.number,
  worldfile: PropTypes.bool,
};

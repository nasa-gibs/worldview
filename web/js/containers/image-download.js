import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Panel from '../components/image-download/panel';
import Crop from '../components/util/image-crop';
import { onToggle } from '../modules/modal/actions';
import { debounce } from 'lodash';
import * as olProj from 'ol/proj';

import {
  imageUtilCalculateResolution,
  imageUtilGetCoordsFromPixelValues,
  getPercentageFromPixel,
  getPixelFromPercentage
} from '../modules/image-download/util';
import util from '../util/util';

import {
  resolutionsGeo,
  resolutionsPolar,
  fileTypesGeo,
  fileTypesPolar
} from '../modules/image-download/constants';

const DEFAULT_URL = 'http://localhost:3002/api/v1/snapshot';

class ImageDownloadContainer extends Component {
  constructor(props) {
    super(props);
    const screenHeight = props.screenHeight;
    const screenWidth = props.screenWidth;
    this.state = {
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
      proj,
      map,
      url,
      onClose,
      models,
      screenWidth,
      screenHeight
    } = this.props;
    const { boundaries } = this.state;
    const { x, y, x2, y2 } = boundaries;
    const isGeoProjection = proj.id === 'geographic';
    const fileTypes = isGeoProjection ? fileTypesGeo : fileTypesPolar;
    const resolutions = isGeoProjection ? resolutionsGeo : resolutionsPolar;
    const lonlats = imageUtilGetCoordsFromPixelValues(
      boundaries,
      map.selectedMap
    );
    const crs = proj.selected.crs;
    const geolonlat1 = olProj.transform(lonlats[0], crs, 'EPSG:4326');
    const geolonlat2 = olProj.transform(lonlats[1], crs, 'EPSG:4326');

    const resolution = imageUtilCalculateResolution(
      Math.round(map.getZoom()),
      isGeoProjection,
      proj.selected.resolutions
    );
    return (
      <React.Fragment>
        <Panel
          projection={proj}
          fileTypes={fileTypes}
          resolutions={resolutions}
          lonlats={lonlats}
          resolution={resolution}
          models={models}
          url={url}
          crs={crs}
        />
        <Crop
          x={getPercentageFromPixel(screenWidth, x)}
          y={getPercentageFromPixel(screenHeight, y)}
          maxHeight={screenHeight}
          maxWidth={screenWidth}
          width={getPercentageFromPixel(screenWidth, x2 - x)}
          height={getPercentageFromPixel(screenHeight, y2 - y)}
          onChange={debounce(this.onBoundaryChange.bind(this), 10)}
          onClose={onClose}
          bottomLeftStyle={{
            left: x,
            top: y2 + 5,
            width: x2 - x
          }}
          topRightStyle={{
            left: x,
            top: y - 20,
            width: x2 - x
          }}
          coordinates={{
            bottomLeft: util.formatCoordinate([geolonlat1[0], geolonlat1[1]]),
            topRight: util.formatCoordinate([geolonlat2[0], geolonlat2[1]])
          }}
          showCoordinates={true}
        />
      </React.Fragment>
    );
  }
}

function mapStateToProps(state) {
  const { config, models, proj, browser } = state;
  const { screenWidth, screenHeight } = browser;
  const { map } = state.legacy;
  let url = DEFAULT_URL;
  if (config.features.imageDownload && config.features.imageDownload.url) {
    url = config.features.imageDownload.url;
  }
  if ('imageDownload' in config.parameters) {
    url = config.parameters.imageDownload;
    util.warn('Redirecting image download to: ' + url);
  }

  return {
    proj,
    url,
    map,
    models,
    screenWidth,
    screenHeight
  };
}
const mapDispatchToProps = dispatch => ({
  onClose: () => {
    dispatch(onToggle());
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ImageDownloadContainer);

ImageDownloadContainer.propTypes = {
  proj: PropTypes.object.isRequired,
  map: PropTypes.object.isRequired,
  models: PropTypes.object.isRequired,
  url: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  screenWidth: PropTypes.number,
  screenHeight: PropTypes.number
};

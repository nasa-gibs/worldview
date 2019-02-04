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
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    this.state = {
      windowWidth: windowWidth,
      windowHeight: windowHeight,
      boundaries: {
        x: windowWidth / 2 - 100,
        y: windowHeight / 2 - 100,
        x2: windowWidth / 2 + 100,
        y2: windowHeight / 2 + 100
      }
    };
  }
  updateDimensions() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    this.setState({
      windowWidth: windowWidth,
      windowHeight: windowHeight
    });
  }
  componentDidMount() {
    window.addEventListener('resize', this.updateDimensions.bind(this));
  }
  componentWillUnmount() {
    window.removeEventListener('resize', this.updateDimensions.bind(this));
  }
  onBoundaryChange(boundaries) {
    const { windowWidth, windowHeight } = this.state;
    const x = getPixelFromPercentage(windowWidth, boundaries.x);
    const y = getPixelFromPercentage(windowHeight, boundaries.y);
    const x2 = x + getPixelFromPercentage(windowWidth, boundaries.width);
    const y2 = y + getPixelFromPercentage(windowHeight, boundaries.height);
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
    const { projection, models, url, onClose } = this.props;
    const { boundaries, windowWidth, windowHeight } = this.state;
    const { x, y, x2, y2 } = boundaries;
    const isGeoProjection = projection === 'geographic';
    const fileTypes = isGeoProjection ? fileTypesGeo : fileTypesPolar;
    const resolutions = isGeoProjection ? resolutionsGeo : resolutionsPolar;
    const lonlats = imageUtilGetCoordsFromPixelValues(
      boundaries,
      models.map.selectedMap
    );
    const crs = models.proj.selected.crs;
    const geolonlat1 = olProj.transform(lonlats[0], crs, 'EPSG:4326');
    const geolonlat2 = olProj.transform(lonlats[1], crs, 'EPSG:4326');

    const resolution = imageUtilCalculateResolution(
      Math.round(models.map.getZoom()),
      isGeoProjection,
      models.proj.selected.resolutions
    );

    return (
      <React.Fragment>
        <Panel
          projection={projection}
          fileTypes={fileTypes}
          resolutions={resolutions}
          lonlats={lonlats}
          resolution={resolution}
          models={models}
          url={url}
          crs={crs}
        />
        <Crop
          x={getPercentageFromPixel(windowWidth, x)}
          y={getPercentageFromPixel(windowHeight, y)}
          maxHeight={windowHeight}
          maxWidth={windowWidth}
          width={getPercentageFromPixel(windowWidth, x2 - x)}
          height={getPercentageFromPixel(windowHeight, y2 - y)}
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
  const { id } = state.projection;
  const { config, models } = state.legacy;
  let url = DEFAULT_URL;
  if (config.features.imageDownload && config.features.imageDownload.url) {
    url = config.features.imageDownload.url;
  }
  if ('imageDownload' in config.parameters) {
    url = config.parameters.imageDownload;
    util.warn('Redirecting image download to: ' + url);
  }

  return {
    projection: id,
    url,
    models
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
  projection: PropTypes.string,
  models: PropTypes.object.isRequired,
  url: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired
};

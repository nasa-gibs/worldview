import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Panel from '../components/image-download/panel';
import Crop from '../components/util/image-crop';
import { imageUtilCalculateResolution } from '../modules/image-download/util';
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
    const bounds = [
      [windowWidth / 2 - 100, windowHeight / 2 - 100],
      [windowWidth / 2 + 100, windowHeight / 2 + 100]
    ];
    this.state = {
      boundaries: bounds
    };
  }
  // onDownload() {
  //   let time = new Date(models.date[models.date.activeDate].getTime());
  //   time.setUTCHours(0, 0, 0, 0);

  //   let layerList = models.layers.get({
  //     reverse: true,
  //     renderable: true
  //   });
  //   let layers = imageUtilGetLayers(layerList, models.proj.selected.id);
  //   let opacities = imageUtilGetLayerOpacities(layerList);
  //   let crs = models.proj.selected.crs;

  //   let params = [
  //     'REQUEST=GetSnapshot',
  //     `TIME=${util.toISOStringDate(time)}`,
  //     `BBOX=${bboxWMS13(lonlats, crs)}`,
  //     `CRS=${crs}`,
  //     `LAYERS=${layers.join(',')}`,
  //     `FORMAT=${imgFormat}`,
  //     `WIDTH=${imgWidth}`,
  //     `HEIGHT=${imgHeight}`
  //   ];
  //   if (opacities.length > 0) {
  //     params.push(`OPACITIES=${opacities.join(',')}`);
  //   }
  //   if (imgWorldfile === 'true') {
  //     params.push('WORLDFILE=true');
  //   }
  //   let dlURL = url + '?' + params.join('&') + `&ts=${Date.now()}`;
  // }
  render() {
    const { projection, models } = this.props;
    const { boundaries } = this.state;
    const isGeoProjection = projection === 'geographic';
    const fileTypes = isGeoProjection ? fileTypesGeo : fileTypesPolar;
    const resolutions = isGeoProjection ? resolutionsGeo : resolutionsPolar;
    console.log(projection, isGeoProjection, models.proj.selected.resolutions);
    const resolution = imageUtilCalculateResolution(
      models.map.zoom,
      isGeoProjection,
      models.proj.selected.resolutions
    );
    return (
      <React.Fragment>
        <Panel
          projection={projection}
          fileTypes={fileTypes}
          resolutions={resolutions}
          boundaries={boundaries}
          resolution={resolution}
        />
        <Crop />
      </React.Fragment>
    );
  }
}

function mapStateToProps(state) {
  const { id } = state.projection;
  const { config, models } = state.models;
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

export default connect(mapStateToProps)(ImageDownloadContainer);

ImageDownloadContainer.propTypes = {
  projection: PropTypes.string
};

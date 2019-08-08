import React from 'react';
import {
  imageSizeValid,
  getDimensions,
  imageUtilGetLayers,
  imageUtilGetLayerOpacities,
  imageUtilGetLayerWrap,
  bboxWMS13
} from '../../modules/image-download/util';

import SelectionList from '../util/selector';
import ResTable from './grid';
import PropTypes from 'prop-types';
import util from '../../util/util';
import googleTagManager from 'googleTagManager';

const MAX_DIMENSION_SIZE = 8200;
const RESOLUTION_KEY = {
  '0.125': '30m',
  '0.25': '60m',
  '0.5': '125m',
  '1': '250m',
  '2': '500m',
  '4': '1km',
  '20': '5km',
  '40': '10km'
};
/*
 * A react component, Builds a rather specific
 * interactive widget
 *
 * @class resolutionSelection
 * @extends React.Component
 */
export default class ImageResSelection extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      fileType: props.fileType,
      fileSize: props.fileSize,
      isWorldfile: props.isWorldfile,
      resolution: props.resolution,
      valid: props.valid,
      debugUrl: ''
    };
  }
  onDownload(imgWidth, imgHeight) {
    const { getLayers, url, lonlats, crs, projection, date } = this.props;
    const { fileType, isWorldfile, resolution } = this.state;
    let time = new Date(date.getTime());
    time.setUTCHours(0, 0, 0, 0);
    let layerList = getLayers();
    let layerWraps = imageUtilGetLayerWrap(layerList);
    let layers = imageUtilGetLayers(layerList, projection.id);
    let opacities = imageUtilGetLayerOpacities(layerList);

    let params = [
      'REQUEST=GetSnapshot',
      `TIME=${util.toISOStringDate(time)}`,
      `BBOX=${bboxWMS13(lonlats, crs)}`,
      `CRS=${crs}`,
      `LAYERS=${layers.join(',')}`,
      `WRAP=${layerWraps.join(',')}`,
      `FORMAT=${fileType}`,
      `WIDTH=${imgWidth}`,
      `HEIGHT=${imgHeight}`
    ];

    if (opacities.length > 0) {
      params.push(`OPACITIES=${opacities.join(',')}`);
    }
    if (isWorldfile === 'true') {
      params.push('WORLDFILE=true');
    }
    let dlURL = url + '?' + params.join('&') + `&ts=${Date.now()}`;
    if (url) {
      util.metrics('lc=' + encodeURIComponent(dlURL));
      window.open(dlURL, '_blank');
    } else {
      console.log(url);
    }
    googleTagManager.pushEvent({
      event: 'image_download',
      layers: {
        activeCount: layers.length
      },
      image: {
        resolution: RESOLUTION_KEY[resolution],
        format: fileType,
        worldfile: isWorldfile
      }
    });
    this.setState({ debugUrl: dlURL });
  }
  handleChange(type, value) {
    const { onPanelChange } = this.props;
    if (type === 'resolution') {
      this.setState({
        resolution: value
      });
    } else if (type === 'worldfile') {
      this.setState({
        isWorldfile: value
      });
    } else {
      this.setState({
        fileType: value
      });
    }
    onPanelChange(type, value);
  }
  _renderFileTypeSelect() {
    if (this.props.fileTypeOptions) {
      return (
        <div className="wv-image-header">
          <SelectionList
            id="wv-image-format"
            optionName="filetype"
            value={this.state.fileType}
            optionArray={this.props.fileTypes}
            onChange={this.handleChange.bind(this)}
          />
          {this.props.secondLabel}
        </div>
      );
    }
  }
  _renderWorldfileSelect() {
    if (this.props.worldFileOptions) {
      return (
        <div className="wv-image-header">
          {this.state.fileType === 'image/kmz' ? (
            <select disabled>
              <option value={false}>No</option>
            </select>
          ) : (
            <select
              id="wv-image-worldfile"
              value={this.state.isWorldfile}
              onChange={e => this.handleChange('worldfile', e.target.value)}
            >
              <option value={false}>No</option>
              <option value={true}>Yes</option>
            </select>
          )}
          Worldfile (.zip)
        </div>
      );
    }
  }
  render() {
    const { projection, lonlats, resolutions, maxImageSize } = this.props;
    const { resolution, debugUrl } = this.state;
    const dimensions = getDimensions(projection.id, lonlats, resolution);
    const height = dimensions.height;
    const width = dimensions.width;
    const filetypeSelect = this._renderFileTypeSelect();
    const worldfileSelect = this._renderWorldfileSelect();
    return (
      <div className="wv-re-pick-wrapper wv-image">
        <div
          id="wv-image-download-url"
          style={{ display: 'none' }}
          url={debugUrl}
        />
        <div className="wv-image-header">
          <SelectionList
            id="wv-image-resolution"
            optionArray={resolutions}
            value={resolution}
            optionName="resolution"
            onChange={this.handleChange.bind(this)}
          />
          {this.props.firstLabel}
        </div>
        {filetypeSelect}
        {worldfileSelect}
        <ResTable
          width={width}
          height={height}
          fileSize={((width * height * 24) / 8388608).toFixed(2)}
          maxImageSize={maxImageSize}
          valid={imageSizeValid(height, width, MAX_DIMENSION_SIZE)}
          onClick={this.onDownload.bind(this)}
        />
      </div>
    );
  }
}

ImageResSelection.defaultProps = {
  fileType: 'image/jpeg',
  fileTypeOptions: true,
  firstLabel: 'Resolution (per pixel)',
  height: '0',
  imageSize: '0',
  isWorldfile: 'false',
  maxImageSize: '8200px x 8200px',
  resolution: '1',
  secondLabel: 'Format',
  width: '0',
  worldFileOptions: true
};
ImageResSelection.propTypes = {
  crs: PropTypes.string,
  date: PropTypes.object,
  fileSize: PropTypes.string,
  fileType: PropTypes.string,
  fileTypeOptions: PropTypes.bool,
  fileTypes: PropTypes.object,
  firstLabel: PropTypes.string,
  getLayers: PropTypes.func,
  isWorldfile: PropTypes.bool,
  lonlats: PropTypes.array,
  maxImageSize: PropTypes.string,
  onPanelChange: PropTypes.func,
  projection: PropTypes.object,
  resolution: PropTypes.string,
  resolutions: PropTypes.object,
  secondLabel: PropTypes.string,
  url: PropTypes.string,
  valid: PropTypes.bool,
  worldFileOptions: PropTypes.bool
};

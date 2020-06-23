import React from 'react';
import PropTypes from 'prop-types';
// eslint-disable-next-line import/no-unresolved
import googleTagManager from 'googleTagManager';
import {
  imageSizeValid,
  getDimensions,
  getDownloadUrl,
} from '../../modules/image-download/util';

import SelectionList from '../util/selector';
import ResTable from './grid';

const MAX_DIMENSION_SIZE = 8200;
const RESOLUTION_KEY = {
  0.125: '30m',
  0.25: '60m',
  0.5: '125m',
  1: '250m',
  2: '500m',
  4: '1km',
  20: '5km',
  40: '10km',
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
      isWorldfile: props.isWorldfile,
      resolution: props.resolution,
      debugUrl: '',
    };
    this.handleChange = this.handleChange.bind(this);
    this.onDownload = this.onDownload.bind(this);
  }

  onDownload(width, height) {
    const {
      getLayers, url, lonlats, projection, date,
    } = this.props;
    const { fileType, isWorldfile, resolution } = this.state;
    const time = new Date(date.getTime());

    const layerList = getLayers();
    const dlURL = getDownloadUrl(
      url,
      projection,
      layerList,
      lonlats,
      { width, height },
      time,
      fileType,
      fileType === 'application/vnd.google-earth.kmz' ? false : isWorldfile,
    );

    if (url) {
      window.open(dlURL, '_blank');
    } else {
      console.log(url);
    }
    googleTagManager.pushEvent({
      event: 'image_download',
      layers: {
        activeCount: layerList.length,
      },
      image: {
        resolution: RESOLUTION_KEY[resolution],
        format: fileType,
        worldfile: isWorldfile,
      },
    });
    this.setState({ debugUrl: dlURL });
  }

  handleChange(type, value) {
    const { onPanelChange } = this.props;
    if (type === 'resolution') {
      this.setState({
        resolution: value,
      });
    } else if (type === 'worldfile') {
      value = Boolean(Number(value));
      this.setState({
        isWorldfile: value,
      });
    } else {
      this.setState({
        fileType: value,
      });
    }
    onPanelChange(type, value);
  }

  _renderFileTypeSelect() {
    const { fileTypeOptions, fileTypes, secondLabel } = this.props;
    const { fileType } = this.state;
    if (fileTypeOptions) {
      return (
        <div className="wv-image-header">
          <SelectionList
            id="wv-image-format"
            optionName="filetype"
            value={fileType}
            optionArray={fileTypes}
            onChange={this.handleChange}
          />
          {secondLabel}
        </div>
      );
    }
  }

  _renderWorldfileSelect() {
    const { worldFileOptions } = this.props;
    const { isWorldfile, fileType } = this.state;
    if (worldFileOptions) {
      const value = isWorldfile ? 1 : 0;
      return (
        <div className="wv-image-header">
          {fileType === 'application/vnd.google-earth.kmz' ? (
            <select disabled>
              <option value={0}>No</option>
            </select>
          ) : (
            <select
              id="wv-image-worldfile"
              value={value}
              onChange={(e) => this.handleChange('worldfile', e.target.value)}
            >
              <option value={0}>No</option>
              <option value={1}>Yes</option>
            </select>
          )}
          Worldfile (.zip)
        </div>
      );
    }
  }

  render() {
    const {
      getLayers, projection, lonlats, resolutions, maxImageSize, firstLabel,
    } = this.props;
    const { resolution, debugUrl } = this.state;
    const dimensions = getDimensions(projection.id, lonlats, resolution);
    const { height } = dimensions;
    const { width } = dimensions;
    const filetypeSelect = this._renderFileTypeSelect();
    const worldfileSelect = this._renderWorldfileSelect();
    const layerList = getLayers();
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
            onChange={this.handleChange}
          />
          {firstLabel}
        </div>
        {filetypeSelect}
        {worldfileSelect}
        <ResTable
          width={width}
          height={height}
          fileSize={((width * height * 24) / 8388608).toFixed(2)}
          maxImageSize={maxImageSize}
          validSize={imageSizeValid(height, width, MAX_DIMENSION_SIZE)}
          validLayers={layerList.length > 0}
          onClick={this.onDownload}
        />
      </div>
    );
  }
}

ImageResSelection.defaultProps = {
  fileType: 'image/jpeg',
  fileTypeOptions: true,
  firstLabel: 'Resolution (per pixel)',
  isWorldfile: 'false',
  maxImageSize: '8200px x 8200px',
  resolution: '1',
  secondLabel: 'Format',
  worldFileOptions: true,
};
ImageResSelection.propTypes = {
  date: PropTypes.object,
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
  worldFileOptions: PropTypes.bool,
};

import React from 'react';
import {
  imageSizeValid,
  getDimensions
} from '../../modules/image-download/util';

import SelectionList from '../util/selector';
import ResTable from './grid';
import PropTypes from 'prop-types';

const MAX_DIMENSION_SIZE = 8200;

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
      proj: this.props.proj,
      worldfile: props.worldfile,
      resolution: props.resolution,
      valid: props.valid
    };
  }
  onDownloadClick() {}
  handleChange(type, value) {
    if (type === 'resolution') {
      this.setState({
        resolution: value
      });
    } else if (type === 'worldfile') {
      this.setState({
        worldfile: value
      });
    } else {
      this.setState({
        fileType: value
      });
    }
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
              value={this.state.worldfile}
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
    const { projection, boundaries, resolutions, maxImageSize } = this.props;
    const { resolution } = this.state;
    const dimensions = getDimensions(projection, boundaries, resolution);
    const height = dimensions.height;
    const width = dimensions.width;
    const filetypeSelect = this._renderFileTypeSelect();
    const worldfileSelect = this._renderWorldfileSelect();
    return (
      <div className="wv-re-pick-wrapper">
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
          onClick={this.onDownloadClick.bind(this)}
        />
      </div>
    );
  }
}

ImageResSelection.defaultProps = {
  firstLabel: 'Resolution (per pixel)',
  secondLabel: 'Format',
  width: '0',
  height: '0',
  imageSize: '0',
  maxImageSize: '250 MB',
  worldfile: false,
  resolution: '1',
  worldFileOptions: true,
  fileTypeOptions: true,
  fileType: 'image/jpeg'
};
ImageResSelection.propTypes = {
  resolutions: PropTypes.object,
  fileType: PropTypes.string,
  fileTypes: PropTypes.object,
  fileSize: PropTypes.string,
  proj: PropTypes.string,
  worldfile: PropTypes.bool,
  resolution: PropTypes.string,
  valid: PropTypes.bool,
  onDownloadClick: PropTypes.func,
  firstLabel: PropTypes.string,
  maxImageSize: PropTypes.string,
  worldFileOptions: PropTypes.bool,
  secondLabel: PropTypes.string,
  fileTypeOptions: PropTypes.bool
};

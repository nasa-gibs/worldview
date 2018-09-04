import React from 'react';
import SelectionList from '../util/selector';
import ResTable from './grid';
import PropTypes from 'prop-types';

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
      imageSize: props.imageSize,
      imgHeight: props.imgHeight,
      imgWidth: props.imgWidth,
      resolutions: props.resolutions,
      onSelectionChange: props.onSelectionChange,
      fileType: props.fileType,
      fileTypes: props.fileTypes,
      fileSize: props.fileSize,
      proj: this.props.proj,
      worldfile: props.worldfile,
      resolution: props.resolution,
      valid: props.valid
    };
  }
  handleChange(type, value) {
    var fileType = this.state.fileType;
    var resolution = this.state.resolution;
    var worldfile = this.state.worldfile;

    if (type === 'resolution') {
      resolution = value;
    } else if (type === 'worldfile') {
      worldfile = value;
    } else {
      fileType = value;
    }
    this.state = {
      resolution: resolution,
      fileType: fileType,
      worldfile: worldfile
    };
    this.props.onSelectionChange(resolution, worldfile, fileType);
  }
  _renderFileTypeSelect() {
    if (this.props.fileTypeOptions) {
      return (
        <div className='wv-image-header'>
          <SelectionList
            id='wv-image-format'
            optionName='filetype'
            value={this.state.fileType}
            optionArray={this.state.fileTypes}
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
        <div className='wv-image-header'>

          {this.state.fileType === 'image/kmz'
            ? <select disabled>
              <option value='false'>No</option>
            </select>
            : <select
              id='wv-image-worldfile'
              value={this.state.worldfile}
              onChange={(e) => this.handleChange('worldfile', e.target.value)}>
              <option value='false'>No</option>
              <option value='true'>Yes</option>
            </select> }
          Worldfile (.zip)
        </div>
      );
    }
  }
  render() {
    var filetypeSelect = this._renderFileTypeSelect();
    var worldfileSelect = this._renderWorldfileSelect();

    return (
      <div className="wv-re-pick-wrapper">
        <div className='wv-image-header'>
          <SelectionList
            id='wv-image-resolution'
            optionArray={this.state.resolutions}
            value={this.state.resolution}
            optionName='resolution'
            onChange={this.handleChange.bind(this)}
          />
          {this.props.firstLabel}
        </div>
        {filetypeSelect}
        {worldfileSelect}
        <ResTable
          width={this.state.imgWidth}
          height={this.state.imgHeight}
          fileSize={this.state.fileSize}
          maxImageSize={this.props.maxImageSize}
          valid={this.state.valid}
          onClick={this.props.onDownloadClick}
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
  imgHeight: null,
  imgWidth: null,
  worldFileOptions: true,
  fileTypeOptions: true
};
ImageResSelection.propTypes = {
  imageSize: PropTypes.string,
  imgHeight: PropTypes.number,
  imgWidth: PropTypes.number,
  resolutions: PropTypes.object,
  onSelectionChange: PropTypes.func,
  fileType: PropTypes.string,
  fileTypes: PropTypes.object,
  fileSize: PropTypes.string,
  proj: PropTypes.string,
  worldfile: PropTypes.string,
  resolution: PropTypes.string,
  valid: PropTypes.bool,
  onDownloadClick: PropTypes.func,
  firstLabel: PropTypes.string,
  maxImageSize: PropTypes.string,
  worldFileOptions: PropTypes.bool,
  secondLabel: PropTypes.string,
  fileTypeOptions: PropTypes.bool
};

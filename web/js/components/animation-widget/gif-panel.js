import React from 'react';
import SelectionList from '../util/selector';
import { GifPanelGrid } from './gif-panel-grid';
import Button from '../util/button';
import { Checkbox } from '../util/checkbox';
import PropTypes from 'prop-types';
import { getDimensions } from '../../modules/image-download/util';
const MAX_GIF_SIZE = 250;
const MAX_IMAGE_DIMENSION_SIZE = 8200;

/*
 * A react component, Builds a rather specific
 * interactive widget
 *
 * @class resolutionSelection
 * @extends React.Component
 */
export default class GifPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      imgHeight: props.imgHeight,
      imgWidth: props.imgWidth,
      speed: props.speed,
      resolutions: props.resolutions,
      resolution: props.resolution,
      valid: props.valid,
      showDates: props.showDates,
      increment: props.increment
    };
    this.handleChange = this.handleChange.bind(this);
  }
  handleChange(type, value) {
    this.setState({
      resolution: value
    });
  }
  render() {
    const { projId, lonlats } = this.props;
    const { resolution } = this.props;
    const dimensions = getDimensions(projId, lonlats, resolution);
    const height = dimensions.height;
    const width = dimensions.width;
    const requestSize = ((width * height * 24) / 8388608).toFixed(2);
    const valid = isFileSizeValid(requestSize, height, width);
    return (
      <div className="animation-gif-dialog-wrapper">
        <div className="gif-selector-case">
          {this.props.firstLabel}
          <SelectionList
            id="gif-resolution"
            optionArray={this.state.resolutions}
            value={this.state.resolution}
            optionName="resolution"
            onChange={this.handleChange.bind(this)}
          />
        </div>
        <GifPanelGrid
          width={width}
          height={height}
          requestSize={((width * height * 24) / 8388608).toFixed(2)}
          maxGifSize={MAX_GIF_SIZE}
          maxImageDimensionSize={MAX_IMAGE_DIMENSION_SIZE}
          valid={valid}
          onClick={this.props.onDownloadClick}
          startDate={this.state.startDate}
          endDate={this.state.endDate}
          speed={this.state.speed}
          increment={this.state.increment}
        />
        <Button onClick={this.props.onClick} text="Create GIF" valid={valid} />
        <Checkbox
          id="wv-checkbox-gif"
          classNames="wv-checkbox-gif"
          title="Check box to remove dates from Animating GIF"
          checked={this.props.checked}
          onCheck={this.props.onCheck}
          label="Include Date Stamps"
        />
      </div>
    );
  }
}

GifPanel.defaultProps = {
  firstLabel: 'Resolution (per pixel):',
  secondLabel: 'Format',
  maxGifSize: 20,
  showDates: true
};
GifPanel.propTypes = {
  firstLabel: PropTypes.string,
  secondLabel: PropTypes.string,
  imgWidth: PropTypes.number,
  imgHeight: PropTypes.number,
  maxGifSize: PropTypes.number,
  maxImageDimensionSize: PropTypes.number,
  showDates: PropTypes.bool,
  onDownloadClick: PropTypes.func,
  onClick: PropTypes.func,
  onCheck: PropTypes.func,
  checked: PropTypes.bool,
  onSelectionChange: PropTypes.func,
  resolutions: PropTypes.object,
  requestSize: PropTypes.string,
  resolution: PropTypes.string,
  speed: PropTypes.number,
  valid: PropTypes.bool,
  increment: PropTypes.string
};
const isFileSizeValid = function(requestSize, imgHeight, imgWidth) {
  return (
    requestSize < MAX_GIF_SIZE &&
    imgHeight !== 0 &&
    imgWidth !== 0 &&
    imgHeight <= MAX_IMAGE_DIMENSION_SIZE &&
    imgWidth <= MAX_IMAGE_DIMENSION_SIZE
  );
};

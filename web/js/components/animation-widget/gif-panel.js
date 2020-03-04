import React from 'react';
import PropTypes from 'prop-types';
import SelectionList from '../util/selector';
import { GifPanelGrid } from './gif-panel-grid';
import Button from '../util/button';
import { Checkbox } from '../util/checkbox';
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
      increment: props.increment,
    };
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(type, value) {
    this.setState({
      resolution: value,
    });
  }

  render() {
    const {
      projId,
      lonlats,
      startDate,
      endDate,
      onCheck,
      showDates,
      numberOfFrames,
    } = this.props;
    const { resolution } = this.state;
    const dimensions = getDimensions(projId, lonlats, resolution);
    const { height } = dimensions;
    const { width } = dimensions;
    const requestSize = ((width * height * 24) / 8388608).toFixed(2) * numberOfFrames;
    const valid = isFileSizeValid(requestSize, height, width);
    return (
      <div className="gif-dialog">
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
            requestSize={requestSize}
            maxGifSize={MAX_GIF_SIZE}
            maxImageDimensionSize={MAX_IMAGE_DIMENSION_SIZE}
            valid={valid}
            onClick={this.props.onDownloadClick}
            startDate={startDate}
            endDate={endDate}
            speed={this.state.speed}
            increment={this.state.increment}
          />
          <Button
            onClick={() => this.props.onClick(width, height)}
            text="Create GIF"
            valid={valid}
          />
          <Checkbox
            id="wv-checkbox-gif"
            classNames="wv-checkbox-gif"
            title="Check box to remove dates from Animating GIF"
            checked={showDates}
            onCheck={onCheck}
            label="Include Date Stamps"
          />
        </div>
      </div>
    );
  }
}

GifPanel.defaultProps = {
  firstLabel: 'Resolution (per pixel):',
  maxGifSize: 20,
  secondLabel: 'Format',
  showDates: true,
};
GifPanel.propTypes = {
  checked: PropTypes.bool,
  endDate: PropTypes.string,
  firstLabel: PropTypes.string,
  imgHeight: PropTypes.number,
  imgWidth: PropTypes.number,
  increment: PropTypes.string,
  lonlats: PropTypes.array,
  maxGifSize: PropTypes.number,
  maxImageDimensionSize: PropTypes.number,
  numberOfFrames: PropTypes.number,
  onCheck: PropTypes.func,
  onClick: PropTypes.func,
  onDownloadClick: PropTypes.func,
  projId: PropTypes.string,
  requestSize: PropTypes.string,
  resolution: PropTypes.string,
  resolutions: PropTypes.object,
  secondLabel: PropTypes.string,
  showDates: PropTypes.bool,
  speed: PropTypes.number,
  startDate: PropTypes.string,
  valid: PropTypes.bool,
};
const isFileSizeValid = function(requestSize, imgHeight, imgWidth) {
  return (
    requestSize < MAX_GIF_SIZE
    && imgHeight !== 0
    && imgWidth !== 0
    && imgHeight <= MAX_IMAGE_DIMENSION_SIZE
    && imgWidth <= MAX_IMAGE_DIMENSION_SIZE
  );
};

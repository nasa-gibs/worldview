import React from 'react';
import PropTypes from 'prop-types';
import SelectionList from '../util/selector';
import GifPanelGrid from './gif-panel-grid';
import Button from '../util/button';
import Checkbox from '../util/checkbox';
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
      speed: props.speed,
      resolutions: props.resolutions,
      resolution: props.resolution,
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
      firstLabel,
      onClick,
      onDownloadClick,
    } = this.props;
    const {
      resolution, resolutions, speed, increment,
    } = this.state;
    const dimensions = getDimensions(projId, lonlats, resolution);
    const { height } = dimensions;
    const { width } = dimensions;
    const requestSize = ((width * height * 24) / 8388608).toFixed(2) * numberOfFrames;
    const valid = isFileSizeValid(requestSize, height, width);
    return (
      <div className="gif-dialog">
        <div className="animation-gif-dialog-wrapper">
          <div className="gif-selector-case">
            {firstLabel}
            <SelectionList
              id="gif-resolution"
              optionArray={resolutions}
              value={resolution}
              optionName="resolution"
              onChange={this.handleChange}
            />
          </div>
          <GifPanelGrid
            width={width}
            height={height}
            requestSize={requestSize}
            maxGifSize={MAX_GIF_SIZE}
            maxImageDimensionSize={MAX_IMAGE_DIMENSION_SIZE}
            valid={valid}
            onClick={onDownloadClick}
            startDate={startDate}
            endDate={endDate}
            speed={speed}
            increment={increment}
          />
          <Button
            onClick={() => onClick(width, height)}
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
  showDates: true,
};
GifPanel.propTypes = {
  endDate: PropTypes.string,
  firstLabel: PropTypes.string,
  increment: PropTypes.string,
  lonlats: PropTypes.array,
  numberOfFrames: PropTypes.number,
  onCheck: PropTypes.func,
  onClick: PropTypes.func,
  onDownloadClick: PropTypes.func,
  projId: PropTypes.string,
  resolution: PropTypes.string,
  resolutions: PropTypes.object,
  showDates: PropTypes.bool,
  speed: PropTypes.number,
  startDate: PropTypes.string,
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

import { useState } from 'react';
import PropTypes from 'prop-types';
import SelectionList from '../util/selector';
import GifPanelGrid from './gif-panel-grid';
import Button from '../util/button';
import Checkbox from '../util/checkbox';
import { getDimensions } from '../../modules/gif-download/util';

const MAX_GIF_SIZE = 250;
const MAX_IMAGE_DIMENSION_SIZE = 8200;

const isFileSizeValid = function(requestSize, imgHeight, imgWidth) {
  return (
    requestSize < MAX_GIF_SIZE &&
    imgHeight !== 0 &&
    imgWidth !== 0 &&
    imgHeight <= MAX_IMAGE_DIMENSION_SIZE &&
    imgWidth <= MAX_IMAGE_DIMENSION_SIZE
  );
};

/*
 * A react component, Builds a rather specific
 * interactive widget
 *
 * @function GifPanel
 */
export default function GifPanel({
  projId,
  lonlats,
  startDate,
  endDate,
  onCheck,
  showDates = true,
  numberOfFrames,
  firstLabel = 'Resolution (per pixel):',
  onClick,
  onDownloadClick,
  speed: speedProp,
  resolutions: resolutionsProp,
  resolution: resolutionProp,
  increment: incrementProp,
}) {
  const [speed] = useState(speedProp);
  const [resolutions] = useState(resolutionsProp);
  const [resolution, setResolution] = useState(resolutionProp);
  const [increment] = useState(incrementProp);

  const handleChange = (type, value) => {
    setResolution(value);
  };

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
            onChange={handleChange}
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

GifPanel.propTypes = {
  endDate: PropTypes.string,
  firstLabel: PropTypes.string,
  increment: PropTypes.string,
  lonlats: PropTypes.oneOfType([PropTypes.array, PropTypes.oneOf(['null'])]),
  numberOfFrames: PropTypes.number,
  onCheck: PropTypes.func,
  onClick: PropTypes.func,
  onDownloadClick: PropTypes.func,
  projId: PropTypes.string,
  resolution: PropTypes.string,
  resolutions: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  showDates: PropTypes.bool,
  speed: PropTypes.number,
  startDate: PropTypes.string,
};

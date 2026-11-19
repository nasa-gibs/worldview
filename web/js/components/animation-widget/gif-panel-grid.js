import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MonospaceDate from '../util/monospace-date';

/*
 * A table that updates with image
 * data
 *
 * @function GifPanelGrid
 */
export default function GifPanelGrid({
  startDate, endDate, speed, increment, valid, height,
  width, maxImageDimensionSize, maxGifSize, requestSize,
}) {
  const roundedSize = requestSize.toFixed(2);
  const imageSize = !valid
    ? (
      <div id="gif-size" className="gif-size gif-size-invalid grid-child">
        <FontAwesomeIcon icon="times" fixedWidth widthAuto />
        <span>{`${maxGifSize} MB ~${roundedSize} MB`}</span>
      </div>
    )
    : (
      <div id="gif-size" className="gif-size grid-child">
        <span>
          {`${maxGifSize} MB / ~${roundedSize} MB`}
          {' '}
        </span>
      </div>
    );

  return (
    <div className="gif-download-grid">
      <div className="grid-child label">
        <span>Start Date: </span>
      </div>
      <div className="grid-child">
        <MonospaceDate date={startDate} />
        {' '}
      </div>
      <div className="grid-child label">
        <span>End Date: </span>
      </div>
      <div className="grid-child">
        <MonospaceDate date={endDate} />
      </div>
      <div className="grid-child label">
        <span>Speed: </span>
      </div>
      <div className="grid-child">
        <span>{`${speed} Frames Per Second`}</span>
      </div>
      <div className="grid-child label">
        <span>Increment:</span>
      </div>
      <div className="grid-child">
        <span>{increment}</span>
      </div>
      <div className="grid-child label">
        <span>Max / Raw Size:</span>
      </div>
      {imageSize}
      <div className="grid-child label">
        <span>Max Dimension: </span>
      </div>
      <div
        className={
          valid
            ? 'grid-child gif-max-size'
            : 'grid-child gif-max-size gif-size-invalid'
        }
      >
        <span>{`${maxImageDimensionSize}px`}</span>
      </div>
      <div className="grid-child label">
        <span>Image Dimensions:</span>
      </div>
      <div className="grid-child" id="wv-image-width">
        <span>{`${width}px x ${height}px`}</span>
      </div>
    </div>
  );
}
GifPanelGrid.propTypes = {
  endDate: PropTypes.string,
  height: PropTypes.number,
  increment: PropTypes.string,
  maxGifSize: PropTypes.number,
  maxImageDimensionSize: PropTypes.number,
  requestSize: PropTypes.number,
  speed: PropTypes.number,
  startDate: PropTypes.string,
  valid: PropTypes.bool,
  width: PropTypes.number,
};

import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from '../util/button';

/*
 * A table that updates with image
 * data
 *
 * @function ResolutionTable
 */
export default function ResolutionTable({
  fileSize, height, maxImageSize, onClick, validLayers, validSize, width, isSnapshotInProgress,
}) {
  const imageSize = !validSize
    ? (
      <div
        id="wv-image-size"
        className="wv-image-size wv-image-size-invalid grid-child"
      >
        <FontAwesomeIcon icon="times" fixedWidth widthAuto />
        <span>{`~${fileSize}MB`}</span>
      </div>
    )
    : (
      <div id="wv-image-size" className="wv-image-size grid-child">
        <span>
          {`~${fileSize} MB`}
          {' '}
        </span>
      </div>
    );

  const isDownloadDisabled = !validSize || !validLayers || isSnapshotInProgress;
  const buttonText = isSnapshotInProgress ? 'Creating...' : 'Download';

  return (
    <div className="wv-image-download-grid">
      <div className="grid-child grid-head">
        <span>Raw Size</span>
      </div>
      <div className="grid-child grid-head">
        <span>Maximum</span>
      </div>
      {imageSize}
      <div
        className={
          validSize
            ? 'grid-child wv-image-max-size'
            : 'grid-child wv-image-max-size wv-image-size-invalid'
        }
      >
        <span>{maxImageSize}</span>
      </div>
      <div
        className="grid-child wv-image-dimensions"
        id="wv-image-dimensions"
      >
        <span>{`${width} x ${height}px`}</span>
      </div>
      <div className="grid-child wv-image-button">
        <Button
          text={buttonText}
          onClick={() => {
            onClick(width, height);
          }}
          valid={!isDownloadDisabled}
          disabled={isDownloadDisabled}
        />
      </div>
    </div>
  );
}
ResolutionTable.propTypes = {
  fileSize: PropTypes.string,
  height: PropTypes.number,
  maxImageSize: PropTypes.string,
  onClick: PropTypes.func,
  validLayers: PropTypes.bool,
  validSize: PropTypes.bool,
  width: PropTypes.number,
  isSnapshotInProgress: PropTypes.bool,
};

import React from 'react';
import PropTypes from 'prop-types';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

/*
 * A table that updates with image
 * data
 *
 * @class ResolutionTable
 * @extends React.Component
 */
export class GifPanelGrid extends React.Component {
  renderImageSize() {
    const { requestSize } = this.props;
    const roundedSize = requestSize.toFixed(2);
    if (!this.props.valid) {
      return (
        <div id="gif-size" className="gif-size gif-size-invalid grid-child">
          <FontAwesomeIcon icon={faTimes} fixedWidth />
          <span>{`${this.props.maxGifSize} MB ~${roundedSize} MB`}</span>
        </div>
      );
    }
    return (
      <div id="gif-size" className="gif-size grid-child">
        <span>
          {`${this.props.maxGifSize} MB / ~${roundedSize} MB`}
          {' '}
        </span>
      </div>
    );
  }

  render() {
    const imageSize = this.renderImageSize();
    return (
      <div className="gif-download-grid">
        <div className="grid-child label">
          <span>Start Date: </span>
        </div>
        <div className="grid-child">
          <span>
            {this.props.startDate}
            {' '}
          </span>
        </div>
        <div className="grid-child label">
          <span>End Date: </span>
        </div>
        <div className="grid-child">
          <span>{this.props.endDate}</span>
        </div>
        <div className="grid-child label">
          <span>Speed: </span>
        </div>
        <div className="grid-child">
          <span>{`${this.props.speed} Frames Per Second`}</span>
        </div>
        <div className="grid-child label">
          <span>Increment:</span>
        </div>
        <div className="grid-child">
          <span>{this.props.increment}</span>
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
            this.props.valid
              ? 'grid-child gif-max-size'
              : 'grid-child gif-max-size gif-size-invalid'
          }
        >
          <span>{`${this.props.maxImageDimensionSize}px`}</span>
        </div>
        <div className="grid-child label">
          <span>Image Dimensions:</span>
        </div>
        <div className="grid-child" id="wv-image-width">
          <span>{`${this.props.width}px x ${this.props.height}px`}</span>
        </div>
      </div>
    );
  }
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

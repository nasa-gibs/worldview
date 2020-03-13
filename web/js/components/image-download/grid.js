import React from 'react';
import PropTypes from 'prop-types';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import Button from '../util/button';

/*
 * A table that updates with image
 * data
 *
 * @class ResolutionTable
 * @extends React.Component
 */
export default class ResolutionTable extends React.Component {
  renderImageSize() {
    const size = this.props.fileSize;
    if (!this.props.validSize) {
      return (
        <div
          id="wv-image-size"
          className="wv-image-size wv-image-size-invalid grid-child"
        >
          <FontAwesomeIcon icon={faTimes} fixedWidth />
          <span>{`~${size}MB`}</span>
        </div>
      );
    }
    return (
      <div id="wv-image-size" className="wv-image-size grid-child">
        <span>
          {`~${size} MB`}
          {' '}
        </span>
      </div>
    );
  }

  render() {
    const imageSize = this.renderImageSize();
    const {
      width, height, maxImageSize, onClick, validLayers, validSize,
    } = this.props;
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
            className="black"
            text="Download"
            onClick={() => {
              onClick(width, height);
            }}
            valid={validSize && validLayers}
          />
        </div>
      </div>
    );
  }
}
ResolutionTable.propTypes = {
  fileSize: PropTypes.string,
  height: PropTypes.number,
  maxImageSize: PropTypes.string,
  onClick: PropTypes.func,
  validLayers: PropTypes.bool,
  validSize: PropTypes.bool,
  width: PropTypes.number,
};

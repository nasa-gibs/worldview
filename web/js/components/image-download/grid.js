import React from 'react';
import PropTypes from 'prop-types';
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
    var size = this.props.fileSize;
    if (!this.props.valid) {
      return (
        <div
          id="wv-image-size"
          className="wv-image-size wv-image-size-invalid grid-child"
        >
          <i className="fa fa-times fa-fw" />
          <span>{'~' + size + 'MB'}</span>
        </div>
      );
    } else {
      return (
        <div id="wv-image-size" className="wv-image-size grid-child">
          <span>{'~' + size + ' MB'} </span>
        </div>
      );
    }
  }
  render() {
    let imageSize = this.renderImageSize();
    const { width, height, onClick, valid } = this.props;
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
            this.props.valid
              ? 'grid-child wv-image-max-size'
              : 'grid-child wv-image-max-size wv-image-size-invalid'
          }
        >
          <span>{this.props.maxImageSize}</span>
        </div>
        <div
          className="grid-child wv-image-dimensions"
          id="wv-image-dimensions"
        >
          <span>{width + ' x ' + height + 'px'}</span>
        </div>
        <div className="grid-child wv-image-button">
          <Button
            className="black"
            text="Download"
            onClick={() => {
              onClick(width, height);
            }}
            valid={valid}
          />
        </div>
      </div>
    );
  }
}
ResolutionTable.propTypes = {
  height: PropTypes.number,
  width: PropTypes.number,
  valid: PropTypes.bool,
  onClick: PropTypes.func,
  fileSize: PropTypes.string,
  maxImageSize: PropTypes.string
};

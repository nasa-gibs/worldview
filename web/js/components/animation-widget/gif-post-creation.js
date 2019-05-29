import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { capitalize as lodashCapitalize } from 'lodash';
import Button from '../util/button';
import FileSaver from 'file-saver';
import googleTagManager from 'googleTagManager';
import util from '../../util/util';
/*
 * A table that updates with image
 * data
 *
 * @class ResolutionTable
 * @extends React.Component
 */
export class GifResults extends Component {
  render() {
    const { speed, startDate, endDate, increment, gifObject } = this.props;
    const blob = gifObject.blob;
    const size = gifObject.size;
    const height = gifObject.height;
    const blobURL = URL.createObjectURL(blob);
    var dlURL = util.format(
      'nasa-worldview-{1}-to-{2}.gif',
      startDate,
      endDate
    );

    return (
      <div className="gif-results-dialog-case clearfix">
        <div
          className="gif-results-dialog"
          style={{ height: height, minHeight: 210 }}
        >
          <img src={blobURL} />
          <div>
            <div>
              <b> Size: </b>
            </div>
            <div>{size} MB</div>
          </div>
          <div>
            <div>
              <b>Speed:</b>
            </div>
            <div>{speed} fps</div>
          </div>
          <div>
            <div>
              <b>Date Range:</b>
            </div>
            <div>{startDate}</div>
            <div> - </div>
            <div>{endDate} </div>
          </div>
          <div>
            <div>
              <b>Increments:</b>
            </div>
            <div> {lodashCapitalize(increment)} </div>
          </div>
          <Button
            text="Download"
            id="download-gif-button"
            className="download wv-button"
            onClick={e => {
              e.stopPropagation();
              e.preventDefault();
              FileSaver.saveAs(blob, dlURL);
              googleTagManager.pushEvent({
                event: 'GIF_download',
                GIF: {
                  downloadSize: size,
                  increments: increment,
                  frameSpeed: speed
                }
              });
            }}
          />
        </div>
      </div>
    );
  }
}
GifResults.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number,
  maxGifSize: PropTypes.number,
  maxImageDimensionSize: PropTypes.number,
  startDate: PropTypes.string,
  endDate: PropTypes.string,
  speed: PropTypes.number,
  valid: PropTypes.bool,
  requestSize: PropTypes.number,
  fileSizeEstimate: PropTypes.number,
  increment: PropTypes.string
};

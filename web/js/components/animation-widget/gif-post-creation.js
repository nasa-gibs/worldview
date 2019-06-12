import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { capitalize as lodashCapitalize } from 'lodash';
import Button from '../util/button';
import FileSaver from 'file-saver';
import googleTagManager from 'googleTagManager';
import util from '../../util/util';
import { Modal, ModalBody, ModalHeader } from 'reactstrap';

export class GifResults extends Component {
  getStyle(imgElWidth, imgElHeight) {
    const { screenHeight, screenWidth } = this.props;
    const width = imgElWidth + 204;
    const height = imgElHeight + 100;
    const top = (screenHeight - height) / 2 - 20;
    const left = (screenWidth - width) / 2;
    return {
      left: left,
      maxWidth: screenWidth,
      maxHeight: screenHeight,
      top: top > 0 ? top : 0,
      height: height,
      width: width < screenWidth ? width : screenWidth
    };
  }
  render() {
    const {
      speed,
      startDate,
      endDate,
      increment,
      gifObject,
      boundaries,
      screenWidth,
      screenHeight,
      onClose
    } = this.props;
    const blob = gifObject.blob;
    const size = gifObject.size;
    const blobURL = URL.createObjectURL(blob);
    var dlURL = util.format(
      'nasa-worldview-{1}-to-{2}.gif',
      startDate,
      endDate
    );
    const pixelWidth = boundaries.x2 - boundaries.x;
    const pixelHeight = boundaries.y2 - boundaries.y;
    const imgElWidth =
      pixelWidth > screenWidth - 198 ? screenWidth - 198 : pixelWidth;
    const imgElHeight =
      pixelHeight > screenHeight - 120 ? screenHeight - 120 : pixelHeight;

    return (
      <Modal
        backdrop={true}
        isOpen={true}
        style={this.getStyle(imgElWidth, imgElHeight)}
        className={'dynamic-modal'}
        toggle={onClose}
      >
        {/* <DetectOuterClick onClick={onClose} disabled={true}> */}
        <ModalHeader toggle={onClose}>GIF Results</ModalHeader>
        <ModalBody>
          <div className="gif-results-dialog-case clearfix">
            <img src={blobURL} width={imgElWidth} height={imgElHeight} />
            <div
              className="gif-results-dialog"
              style={{ height: imgElHeight, minHeight: 210 }}
            >
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
            </div>
            <div style={{ paddingTop: 10 }}>
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
        </ModalBody>
      </Modal>
    );
  }
}

GifResults.propTypes = {
  endDate: PropTypes.string,
  speed: PropTypes.number,
  valid: PropTypes.bool,
  requestSize: PropTypes.number,
  fileSizeEstimate: PropTypes.number,
  increment: PropTypes.string,
  gifObject: PropTypes.object,
  boundaries: PropTypes.object,
  screenWidth: PropTypes.number,
  screenHeight: PropTypes.number,
  onClose: PropTypes.func,
  startDate: PropTypes.string
};

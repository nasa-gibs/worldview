import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { capitalize as lodashCapitalize } from 'lodash';
import FileSaver from 'file-saver';
import googleTagManager from 'googleTagManager';
import { Modal, ModalBody, ModalHeader } from 'reactstrap';
import util from '../../util/util';
import Button from '../util/button';
import MonospaceDate from '../util/monospace-date';

export default class GifResults extends Component {
  getStyle(imgElWidth, imgElHeight) {
    const { screenHeight, screenWidth } = this.props;
    const width = imgElWidth + 204;
    const height = imgElHeight + 100;
    const top = (screenHeight - height) / 2 - 20;
    const left = (screenWidth - width) / 2;
    return {
      left,
      maxWidth: screenWidth,
      maxHeight: screenHeight,
      top: top > 0 ? top : 0,
      width: width < screenWidth ? width : screenWidth,
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
      onClose,
      closeBtn,
    } = this.props;
    const { blob } = gifObject;
    const { size } = gifObject;
    const blobURL = URL.createObjectURL(blob);
    const dlURL = util.format(
      'nasa-worldview-{1}-to-{2}.gif',
      startDate,
      endDate,
    );
    const pixelWidth = boundaries.x2 - boundaries.x;
    const pixelHeight = boundaries.y2 - boundaries.y;
    const imgElWidth = pixelWidth > screenWidth - 198 ? screenWidth - 198 : pixelWidth;
    const imgElHeight = pixelHeight > screenHeight - 120 ? screenHeight - 120 : pixelHeight;

    return (
      <Modal
        backdrop
        isOpen
        style={this.getStyle(imgElWidth, imgElHeight)}
        className="dynamic-modal"
        toggle={onClose}
      >
        <ModalHeader close={closeBtn}>GIF Results</ModalHeader>
        <ModalBody>
          <div className="gif-results-dialog-case clearfix">
            <img src={blobURL} width={imgElWidth} height={imgElHeight} />
            <div
              className="gif-results-dialog"
              style={{ minHeight: 210 }}
            >
              <div>
                <div>
                  <b> Size: </b>
                </div>
                <div>
                  {size}
                  {' '}
                  MB
                </div>
              </div>
              <div>
                <div>
                  <b>Speed:</b>
                </div>
                <div>
                  {speed}
                  {' '}
                  fps
                </div>
              </div>
              <div>
                <div>
                  <b>Date Range:</b>
                </div>
                <MonospaceDate date={startDate} />
                <div> - </div>
                <MonospaceDate date={endDate} />
                {' '}
              </div>
              <div>
                <div>
                  <b>Increments:</b>
                </div>
                <div>
                  {' '}
                  {lodashCapitalize(increment)}
                  {' '}
                </div>
              </div>
            </div>
            <div style={{ paddingTop: 10 }}>
              <Button
                text="Download"
                id="download-gif-button"
                className="download wv-button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  FileSaver.saveAs(blob, dlURL);
                  const sizeRange = size < 5
                    ? '<5MB'
                    : size >= 5 && size <= 25
                      ? '5MB-25MB'
                      : '>25MB';

                  googleTagManager.pushEvent({
                    event: 'GIF_download',
                    GIF: {
                      downloadSize: sizeRange,
                      increments: increment,
                      frameSpeed: speed,
                    },
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
  boundaries: PropTypes.object,
  endDate: PropTypes.string,
  gifObject: PropTypes.object,
  increment: PropTypes.string,
  onClose: PropTypes.func,
  screenHeight: PropTypes.number,
  screenWidth: PropTypes.number,
  speed: PropTypes.number,
  startDate: PropTypes.string,
};

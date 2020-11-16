/* eslint-disable no-restricted-syntax */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { UncontrolledTooltip } from 'reactstrap';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CopyClipboardTooltip from './copy-tooltip';

class CoordinatesDialog extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tooltipToggleTime: 0,
    };
  }

  // set copy tooltip time
  onCopyToClipboard = () => {
    this.setState({
      tooltipToggleTime: Date.now(),
    });
  }

  render() {
    const {
      clearCoordinates, toggleWithClose, coordinatesMetadata, isMobile, tooltipId,
    } = this.props;
    const {
      tooltipToggleTime,
    } = this.state;

    const {
      latitude,
      longitude,
      title,
    } = coordinatesMetadata;

    const latitudeText = `Latitude: ${latitude}`;
    const longitudeText = `Longitude: ${longitude}`;

    const buttonId = 'copy-coordinates-to-clipboard-button';
    const labelText = 'Copy coordinates to clipboard';
    return (
      <div className={`tooltip-custom-black tooltip-static tooltip-coordinates-container ${tooltipId}`}>
        <CopyClipboardTooltip
          tooltipToggleTime={tooltipToggleTime}
        />
        <div className="tooltip-coordinates-title">{title}</div>
        <div className="tooltip-coordinates-group">
          <div className="tooltip-coordinates-latitude">
            {latitudeText}
          </div>
          <div className="tooltip-coordinates-longitude">
            {longitudeText}
          </div>
        </div>
        <span className="close-tooltip close-coordinates-tooltip">
          <FontAwesomeIcon onClick={clearCoordinates} icon="times" fixedWidth />
        </span>
        <span className="minimize-tooltip minimize-coordinates-tooltip">
          <FontAwesomeIcon onClick={toggleWithClose} icon="minus" fixedWidth />
        </span>
        <CopyToClipboard
          options={window.clipboardData ? {} : { format: 'text/plain' }}
          text={`${latitude}, ${longitude}`}
          onCopy={this.onCopyToClipboard}
        >
          <div
            id={buttonId}
            className="copy-coordinates-to-clipboard-button"
          >
            {!isMobile && (
            <UncontrolledTooltip placement="bottom" trigger="hover" target={buttonId}>
              {labelText}
            </UncontrolledTooltip>
            )}
            <FontAwesomeIcon icon="copy" fixedWidth />
          </div>
        </CopyToClipboard>
      </div>
    );
  }
}

export default CoordinatesDialog;
CoordinatesDialog.propTypes = {
  clearCoordinates: PropTypes.func,
  toggleWithClose: PropTypes.func,
  coordinatesMetadata: PropTypes.object,
  isMobile: PropTypes.bool,
  tooltipId: PropTypes.string,
};

/* eslint-disable no-restricted-syntax */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faCopy } from '@fortawesome/free-solid-svg-icons';
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
      toggleWithClose, coordinatesMetadata,
    } = this.props;
    const {
      tooltipToggleTime,
    } = this.state;

    const {
      features, // parsed { latitude, longitude }
      title, // "Wairau Valley"
    } = coordinatesMetadata;

    const latitudeText = `Latitude: ${features.latitude} °`;
    const longitudeText = `Longitude: ${features.longitude} °`;
    return (
      <div className="tooltip-custom-black tooltip-static tooltip-coordinates-container">
        <CopyClipboardTooltip
          tooltipToggleTime={tooltipToggleTime}
        />
        <div className="tooltip-coordinates-title">{title}</div>
        <div className="tooltip-coordinates-group">
          <div>
            {latitudeText}
          </div>
          <div>
            {longitudeText}
          </div>
        </div>
        <span className="close-tooltip close-coordinates-tooltip" onClick={toggleWithClose}>
          <FontAwesomeIcon icon={faTimes} fixedWidth />
        </span>
        <CopyToClipboard
          options={window.clipboardData ? {} : { format: 'text/plain' }}
          text={`${features.latitude}, ${features.longitude}`}
          onCopy={this.onCopyToClipboard}
        >
          <FontAwesomeIcon id="copy-coordinates-to-clipboard-button" icon={faCopy} fixedWidth />
        </CopyToClipboard>
      </div>
    );
  }
}


export default CoordinatesDialog;
CoordinatesDialog.propTypes = {
  toggleWithClose: PropTypes.func,
  coordinatesMetadata: PropTypes.object,
};

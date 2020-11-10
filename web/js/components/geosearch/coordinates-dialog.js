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
      showTooltips: true,
    };
  }

  // set copy tooltip time
  onCopyToClipboard = () => {
    this.setState({
      tooltipToggleTime: Date.now(),
    });
  }

  // close dialog and remove map marker
  clearCoordinates = () => {
    const { clearCoordinates } = this.props;
    this.setState({
      showTooltips: false,
    });
    clearCoordinates();
  }

  // minimize dialog (destroy component)
  minimizeDialog = () => {
    const { removeCoordinatesDialog } = this.props;
    this.setState({
      showTooltips: false,
    });
    removeCoordinatesDialog();
  }

  // render minimize and remove dialog button controls
  renderDialogButtonControls = () => {
    const {
      isMobile,
    } = this.props;
    const { showTooltips } = this.state;

    const closeButtonId = 'close-coordinates-tooltip';
    const minimizeButtonId = 'minimize-coordinates-tooltip';
    const closeButtonLabelText = 'Remove map marker';
    const minimizeButtonLabelText = 'Minimize coordinates tooltip';

    const tooltipVisibilityCondition = !isMobile && showTooltips;
    return (
      <>
        <span id={closeButtonId} className="close-tooltip close-coordinates-tooltip">
          {tooltipVisibilityCondition
          && (
            <UncontrolledTooltip
              trigger="hover"
              target={closeButtonId}
              boundariesElement="window"
              placement="top"
            >
              {closeButtonLabelText}
            </UncontrolledTooltip>
          )}
          <FontAwesomeIcon onClick={this.clearCoordinates} icon="times" fixedWidth />
        </span>
        <span id={minimizeButtonId} className="minimize-tooltip minimize-coordinates-tooltip">
          {tooltipVisibilityCondition
          && (
            <UncontrolledTooltip
              trigger="hover"
              target={minimizeButtonId}
              boundariesElement="window"
              placement="top"
            >
              {minimizeButtonLabelText}
            </UncontrolledTooltip>
          )}
          <FontAwesomeIcon onClick={this.minimizeDialog} icon="minus" fixedWidth />
        </span>
      </>
    );
  }

  // render copy to clipboard button
  renderCopyToClipboardButton = () => {
    const { coordinatesMetadata, isMobile } = this.props;
    const { latitude, longitude } = coordinatesMetadata;

    const buttonId = 'copy-coordinates-to-clipboard-button';
    const labelText = 'Copy coordinates to clipboard';
    return (
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
    );
  }

  render() {
    const {
      coordinatesMetadata, tooltipId,
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
        {this.renderDialogButtonControls()}
        {this.renderCopyToClipboardButton()}
      </div>
    );
  }
}

export default CoordinatesDialog;
CoordinatesDialog.propTypes = {
  clearCoordinates: PropTypes.func,
  removeCoordinatesDialog: PropTypes.func,
  coordinatesMetadata: PropTypes.object,
  isMobile: PropTypes.bool,
  tooltipId: PropTypes.string,
};

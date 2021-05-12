/* eslint-disable no-restricted-syntax */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { UncontrolledTooltip } from 'reactstrap';
import copy from 'copy-to-clipboard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CopyClipboardTooltip from './copy-tooltip';

class CoordinatesDialog extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tooltipToggleTime: 0,
      showTooltips: true,
      isCopyToClipboardTooltipVisible: false,
    };
    this.copyToClipboard = this.copyToClipboard.bind(this);
  }

  copyToClipboard(coords) {
    const options = window.clipboardData ? {} : { format: 'text/plain' };
    options.onCopy = () => {
      this.setState({
        tooltipToggleTime: Date.now(),
        isCopyToClipboardTooltipVisible: true,
      });

      // Prevent keyboard overlay in iOS
      setTimeout(() => {
        document.getElementById('location-search-autocomplete').blur();
      }, 50);
    };
    copy(coords, options);
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

  clearCopyToClipboardTooltip = () => {
    this.setState({
      isCopyToClipboardTooltipVisible: false,
    });
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
        <span
          id={closeButtonId}
          className={`close-tooltip ${closeButtonId}`}
          onTouchEnd={this.clearCoordinates}
        >
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
        <span
          id={minimizeButtonId}
          className={`minimize-tooltip ${minimizeButtonId}`}
          onTouchEnd={this.minimizeDialog}
        >
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
    const { coordinates } = coordinatesMetadata;
    const { isCopyToClipboardTooltipVisible, showTooltips } = this.state;

    const buttonId = 'copy-coordinates-to-clipboard-button';
    const labelText = 'Copy coordinates to clipboard';
    const tooltipVisibilityCondition = !isMobile && !isCopyToClipboardTooltipVisible && showTooltips;
    return (
      <div
        id={buttonId}
        className={buttonId}
        onClick={() => this.copyToClipboard(coordinates)}
        onTouchEnd={() => this.copyToClipboard(coordinates)}
      >
        {tooltipVisibilityCondition && (
          <UncontrolledTooltip
            placement="bottom"
            trigger="hover"
            target={buttonId}
          >
            {labelText}
          </UncontrolledTooltip>
        )}
        <FontAwesomeIcon icon="copy" fixedWidth />
      </div>
    );
  }

  render() {
    const {
      coordinatesMetadata, tooltipId,
    } = this.props;
    const {
      showTooltips,
      tooltipToggleTime,
    } = this.state;
    const {
      coordinates,
      title,
    } = coordinatesMetadata;

    return (
      <div className={`tooltip-custom-black tooltip-static tooltip-coordinates-container ${tooltipId}`}>
        {showTooltips && (
        <CopyClipboardTooltip
          tooltipToggleTime={tooltipToggleTime}
          clearCopyToClipboardTooltip={this.clearCopyToClipboardTooltip}
        />
        )}
        <div className="tooltip-coordinates-title">{title}</div>
        <div className="tooltip-coordinates">{coordinates}</div>
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

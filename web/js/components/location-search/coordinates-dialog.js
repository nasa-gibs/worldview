/* eslint-disable no-restricted-syntax */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { UncontrolledTooltip } from 'reactstrap';
import copy from 'copy-to-clipboard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CopyClipboardTooltip from './copy-tooltip';
import { getFormattedCoordinates } from './util';
import util from '../../util/util';
import { LOCATION_SEARCH_COORDINATE_FORMAT } from '../../util/constants';

const { events } = util;

class CoordinatesDialog extends Component {
  constructor(props) {
    super(props);
    const { coordinates } = this.props;
    this.state = {
      tooltipToggleTime: 0,
      showTooltips: false,
      isCopyToClipboardTooltipVisible: false,
      formattedCoordinates: getFormattedCoordinates(coordinates),
    };
    this.copyToClipboard = this.copyToClipboard.bind(this);
  }

  componentDidMount() {
    setTimeout(() => {
      this.setState({ showTooltips: true });
    }, 200);
    events.on(LOCATION_SEARCH_COORDINATE_FORMAT, this.updateCoordinateFormat);
  }

  componentWillUnmount() {
    events.off(LOCATION_SEARCH_COORDINATE_FORMAT, this.updateCoordinateFormat);
  }

  updateCoordinateFormat = () => {
    const { coordinates } = this.props;
    this.setState({ formattedCoordinates: getFormattedCoordinates(coordinates) });
  };

  copyToClipboard(coords) {
    const options = window.clipboardData ? {} : { format: 'text/plain' };
    options.onCopy = () => {
      this.setState({
        tooltipToggleTime: Date.now(),
        isCopyToClipboardTooltipVisible: true,
      });

      // Prevent keyboard overlay in iOS
      const searchElement = document.getElementById('location-search-autocomplete');
      if (searchElement) {
        setTimeout(() => {
          searchElement.blur();
        }, 50);
      }
    };
    copy(coords, options);
  }

  // close dialog and remove map marker
  removeMarker = () => {
    const { removeMarker } = this.props;
    this.setState({
      showTooltips: false,
    });
    removeMarker();
  };

  // minimize dialog (destroy component)
  minimizeDialog = () => {
    const { removeCoordinatesDialog } = this.props;
    this.setState({
      showTooltips: false,
    });
    removeCoordinatesDialog();
  };

  clearCopyToClipboardTooltip = () => {
    this.setState({
      isCopyToClipboardTooltipVisible: false,
    });
  };

  // render minimize and remove dialog button controls
  renderDialogButtonControls = () => {
    const {
      isMobile, tooltipId,
    } = this.props;
    const { showTooltips } = this.state;

    const closeButtonClassName = 'close-coordinates-tooltip';
    const closeButtonId = `${closeButtonClassName}${tooltipId}`;
    const minimizeButtonClassName = 'minimize-coordinates-tooltip';
    const minimizeButtonId = `${minimizeButtonClassName}${tooltipId}`;
    const closeButtonLabelText = 'Remove map marker';
    const minimizeButtonLabelText = 'Minimize coordinates tooltip';

    const tooltipVisibilityCondition = !isMobile && showTooltips;
    return (
      <>
        <span
          id={closeButtonId}
          className={`close-tooltip ${closeButtonClassName}`}
          onTouchEnd={this.removeMarker}
        >
          {tooltipVisibilityCondition
          && (
            <UncontrolledTooltip
              id="center-align-tooltip"
              trigger="hover"
              target={closeButtonId}
              boundariesElement="window"
              placement="top"
            >
              {closeButtonLabelText}
            </UncontrolledTooltip>
          )}
          <FontAwesomeIcon onClick={this.removeMarker} icon="times" fixedWidth />
        </span>
        <span
          id={minimizeButtonId}
          className={`minimize-tooltip ${minimizeButtonClassName}`}
          onTouchEnd={this.minimizeDialog}
        >
          {tooltipVisibilityCondition
          && (
            <UncontrolledTooltip
              id="center-align-tooltip"
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
  };

  // render copy to clipboard button
  renderCopyToClipboardButton = () => {
    const { isMobile } = this.props;
    const { isCopyToClipboardTooltipVisible, showTooltips, formattedCoordinates } = this.state;

    const buttonId = 'copy-coordinates-to-clipboard-button';
    const labelText = 'Copy coordinates to clipboard';
    const tooltipVisibilityCondition = !isMobile && !isCopyToClipboardTooltipVisible && showTooltips;

    return (
      <div
        id={buttonId}
        className={buttonId}
        onClick={() => this.copyToClipboard(formattedCoordinates)}
        onTouchEnd={() => this.copyToClipboard(formattedCoordinates)}
      >
        {tooltipVisibilityCondition && (
          <UncontrolledTooltip
            id="center-align-tooltip"
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
  };

  render() {
    const {
      tooltipId,
      title,
    } = this.props;
    const {
      showTooltips,
      tooltipToggleTime,
      formattedCoordinates,
    } = this.state;

    return (
      <div className={`tooltip-custom-black tooltip-static tooltip-coordinates-container ${tooltipId}`}>
        {showTooltips && (
          <CopyClipboardTooltip
            tooltipToggleTime={tooltipToggleTime}
            clearCopyToClipboardTooltip={this.clearCopyToClipboardTooltip}
            placement="bottom"
          />
        )}
        <div className="tooltip-coordinates-title">{title}</div>
        <div className="tooltip-coordinates">{formattedCoordinates}</div>
        {this.renderDialogButtonControls()}
        {this.renderCopyToClipboardButton()}
      </div>
    );
  }
}

export default CoordinatesDialog;
CoordinatesDialog.propTypes = {
  removeMarker: PropTypes.func,
  removeCoordinatesDialog: PropTypes.func,
  title: PropTypes.string,
  coordinates: PropTypes.array,
  isMobile: PropTypes.bool,
  tooltipId: PropTypes.string,
};

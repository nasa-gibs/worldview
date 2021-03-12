import React, { Component } from 'react';
import PropTypes from 'prop-types';
import util from '../../util/util';
import Alert from '../util/alert';

class DistractionFreeTimeUI extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showDistractionFreeAlert: true,
    };
  }

  // dismiss message instruction alert
  dismissDistractionFreeAlert = () => this.setState({ showDistractionFreeAlert: false });

  handleMouseOver = () => {
    const { hoverOverDistractionFreeTimeUI } = this.props;
    hoverOverDistractionFreeTimeUI(true);
  }

  // render alert message to let desktop users know they are in distraction free mode
  renderDistractionFreeAlert = () => {
    const {
      showDistractionFreeAlert,
    } = this.state;
    const message = 'You are now in distraction free mode. Click the eye button to exit.';

    return showDistractionFreeAlert && (
      <Alert
        id="distraction-free-mode-active-alert"
        isOpen
        title="Distraction Free Mode is Active"
        timeout={6000}
        message={message}
        onDismiss={this.dismissDistractionFreeAlert}
      />
    );
  }

  render() {
    const { date, hasSubdailyLayers, isHoverOverDistractionFreeTimeUI } = this.props;

    // get month as string (e.g., 2 -> 'FEB')
    const monthNumber = new Date(date).getUTCMonth();
    const monthString = util.monthStringArray[monthNumber];

    // split date first YMD and second HR (subdaily)
    const dateSplit = date.split('T');
    const dateFirstHalfYMD = dateSplit[0].split('-');
    const dateSecondHalfHM = dateSplit[1].split(':', 2).join(':');

    // update month to use string
    dateFirstHalfYMD[1] = monthString;

    // display date as '2000-10-28' for default or '2000-10-28 20:28Z' for subdaily
    let displayDate;
    if (hasSubdailyLayers) {
      displayDate = `${dateFirstHalfYMD.join(' ')} ${dateSecondHalfHM}`;
    } else {
      displayDate = dateFirstHalfYMD.join(' ');
    }

    const opacityStyle = { opacity: isHoverOverDistractionFreeTimeUI ? '0' : '1' };
    return (
      <>
        {this.renderDistractionFreeAlert()}
        <div
          className="distraction-free-date"
          style={opacityStyle}
          onMouseOver={this.handleMouseOver}
        >
          {displayDate}
        </div>
      </>
    );
  }
}

DistractionFreeTimeUI.propTypes = {
  date: PropTypes.string,
  hasSubdailyLayers: PropTypes.bool,
  hoverOverDistractionFreeTimeUI: PropTypes.func,
  isHoverOverDistractionFreeTimeUI: PropTypes.bool,
};

export default DistractionFreeTimeUI;

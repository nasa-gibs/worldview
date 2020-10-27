/* eslint-disable no-restricted-syntax */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

class CoordinatesDialog extends PureComponent {
  render() {
    const {
      toggleWithClose, coordinatesMetadata,
    } = this.props;

    const {
      features, // { latitude, longitude }
      title, // "Wairau Valley"
    } = coordinatesMetadata;

    const latitudeText = `Latitude: ${features.latitude} °`;
    const longitudeText = `Longitude: ${features.longitude} °`;
    return (
      <div className="tooltip-custom-black tooltip-static tooltip-coordinates-container">
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
      </div>
    );
  }
}

export default CoordinatesDialog;
CoordinatesDialog.propTypes = {
  toggleWithClose: PropTypes.func,
  coordinatesMetadata: PropTypes.object,
};

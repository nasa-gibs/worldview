import React from 'react';
import PropTypes from 'prop-types';
import util from '../../util/util';

// previous : next
const formatOrder = {
  'latlon-dd': 'latlon-dm',
  'latlon-dm': 'latlon-dms',
  'latlon-dms': 'latlon-dd',
};

export default class Coordinates extends React.Component {
  constructor(props) {
    super(props);
    this.changeFormat = this.changeFormat.bind(this);
  }

  changeFormat() {
    const { format, onFormatChange } = this.props;
    const nextFormat = formatOrder[format];
    onFormatChange(nextFormat);
  }

  render() {
    const {
      latitude, longitude, format, crs,
    } = this.props;
    if (latitude === null) {
      return null;
    }
    if (longitude === null) {
      return null;
    }

    const coords = util.formatCoordinate(
      [longitude, latitude],
      format,
    );

    return (
      <div
        id="coords-panel"
        className="wv-coords-map wv-coords-map-btn"
        onClick={this.changeFormat}
      >
        <span className="map-coord">
          {coords}
        </span>
        <div className="map-coord-format">
          <span className="map-coord">
            {crs}
          </span>
          <div aria-label="Change coordinates format" className="coord-btn">
            <i className="coord-switch" />
          </div>
        </div>
      </div>
    );
  }
}

Coordinates.propTypes = {
  onFormatChange: PropTypes.func.isRequired,
  crs: PropTypes.string,
  format: PropTypes.string,
  latitude: PropTypes.number,
  longitude: PropTypes.number,
};





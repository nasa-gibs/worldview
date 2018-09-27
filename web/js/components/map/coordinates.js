import React from 'react';
import PropTypes from 'prop-types';
import util from '../../util/util';

// previous : next
const formatOrder = {
  'latlon-dd': 'latlon-dm',
  'latlon-dm': 'latlon-dms',
  'latlon-dms': 'latlon-dd'
};

class Coordinates extends React.Component {
  constructor(props) {
    super(props);
    this.changeFormat = this.changeFormat.bind(this);
  }

  changeFormat() {
    let thisFormat = this.props.format;
    let nextFormat = formatOrder[thisFormat];
    this.props.onFormatChange(nextFormat);
  }

  render() {
    if (this.props.latitude === null) {
      return null;
    }
    if (this.props.longitude === null) {
      return null;
    }

    let coords = util.formatCoordinate(
      [this.props.longitude, this.props.latitude],
      this.props.format
    );

    return (
      <div className='wv-coords-map wv-coords-map-btn'
        onClick={this.changeFormat}>
        <span className='map-coord'>{coords} {this.props.crs}</span>
        <div className='coord-btn'>
          <i className='coord-switch'/>
        </div>
      </div>
    );
  }
}

Coordinates.propTypes = {
  format: PropTypes.string,
  latitude: PropTypes.number,
  longitude: PropTypes.number,
  crs: PropTypes.string,
  onFormatChange: PropTypes.func.isRequired
};

export default Coordinates;

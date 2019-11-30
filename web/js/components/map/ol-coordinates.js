import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Coordinates from './coordinates';
import util from '../../util/util';
import { transform } from 'ol/proj';

class OlCoordinates extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasMouse: false,
      latitude: null,
      longitude: null,
      crs: null,
      format: null
    };
    this.mouseMove = this.mouseMove.bind(this);
    this.mouseOut = this.mouseOut.bind(this);
    this.changeFormat = this.changeFormat.bind(this);
    this.registerMouseListeners();
  }

  registerMouseListeners() {
    this.props.mouseEvents.on('mousemove', this.mouseMove);
    this.props.mouseEvents.on('mouseout', this.mouseOut);
  }

  mouseMove(event, map, crs) {
    const pixels = map.getEventPixel(event);
    const coord = map.getCoordinateFromPixel(pixels);
    if (!coord) {
      this.clearCoord();
      return;
    }

    const pcoord = transform(coord, crs, 'EPSG:4326');
    const [lon, lat] = pcoord;
    if (lon < -180 || lon > 180 || lat < -90 || lat > 90) {
      this.clearCoord();
      return;
    }

    this.setState({
      hasMouse: true,
      format: util.getCoordinateFormat(),
      latitude: pcoord[1],
      longitude: pcoord[0],
      crs
    });
  }

  mouseOut(event) {
    if (event.relatedTarget && event.relatedTarget.classList) {
      const cl = event.relatedTarget.classList;
      // Ignore when the mouse goes over the coordinate display. Clearing
      // the coordinates in this situation causes a flicker.
      if (cl.contains('map-coord')) {
        return;
      }
    }
    this.clearCoord();
  }

  clearCoord() {
    this.setState({ latitude: null, longitude: null });
  }

  changeFormat(format) {
    util.setCoordinateFormat(format);
    this.setState({ format });
  }

  render() {
    // Don't render until a mouse is being used
    if (!this.state.hasMouse) {
      return null;
    }

    return (
      <div id='ol-coords-case' style={{ display: this.props.isDistractionFreeModeActive ? 'none' : 'block' }}>
        <Coordinates
          format={this.state.format}
          latitude={this.state.latitude}
          longitude={this.state.longitude}
          crs={this.state.crs}
          onFormatChange={this.changeFormat}
        />
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    isDistractionFreeModeActive: state.ui.isDistractionFreeModeActive
  };
}

OlCoordinates.propTypes = {
  mouseEvents: PropTypes.object.isRequired
};

// export default OlCoordinates;

export default connect(
  mapStateToProps
)(OlCoordinates);

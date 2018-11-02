import React from 'react';
import PropTypes from 'prop-types';
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
    let pixels = map.getEventPixel(event);
    let coord = map.getCoordinateFromPixel(pixels);
    if (!coord) {
      this.clearCoord();
      return;
    }

    let pcoord = transform(coord, crs, 'EPSG:4326');
    let [lon, lat] = pcoord;
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
      let cl = event.relatedTarget.classList;
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
      <div>
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

OlCoordinates.propTypes = {
  mouseEvents: PropTypes.object.isRequired
};

export default OlCoordinates;

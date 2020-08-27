import React from 'react';
import PropTypes from 'prop-types';
import {
  throttle as lodashThrottle,
} from 'lodash';
import { transform } from 'ol/proj';
import Coordinates from './coordinates';
import util from '../../util/util';

export default class OlCoordinates extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasMouse: false,
      latitude: null,
      longitude: null,
      crs: null,
      format: null,
    };
    this.mouseMove = lodashThrottle(this.mouseMove.bind(this), 8);
    this.mouseOut = lodashThrottle(this.mouseOut.bind(this), 8);
    this.changeFormat = this.changeFormat.bind(this);
    this.registerMouseListeners();
  }

  componentWillUnmount() {
    const { mouseEvents } = this.props;
    mouseEvents.off('mousemove', this.mouseMove);
    mouseEvents.off('mouseout', this.mouseOut);
  }

  registerMouseListeners() {
    const { mouseEvents } = this.props;
    mouseEvents.on('mousemove', this.mouseMove);
    mouseEvents.on('mouseout', this.mouseOut);
  }

  mouseMove(event, map, crs) {
    const pixels = map.getEventPixel(event);
    const coord = map.getCoordinateFromPixel(pixels);
    if (!coord) {
      this.clearCoord();
      return;
    }
    let pcoord = transform(coord, crs, 'EPSG:4326');
    // eslint-disable-next-line prefer-const
    let [lon, lat] = pcoord;
    if (Math.abs(lat) > 90) {
      this.clearCoord();
      return;
    }
    if (Math.abs(lon) > 180) {
      if (crs === 'EPSG:4326' && Math.abs(lon) < 250) {
        lon = util.normalizeWrappedLongitude(lon);
        pcoord = [lon, lat];
      } else {
        this.clearCoord();
        return;
      }
    }
    this.setState({
      hasMouse: true,
      format: util.getCoordinateFormat(),
      latitude: pcoord[1],
      longitude: pcoord[0],
      crs,
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
    const {
      hasMouse, format, latitude, longitude, crs,
    } = this.state;
    // Don't render until a mouse is being used
    if (!hasMouse) {
      return null;
    }

    return (
      <div id="ol-coords-case">
        <Coordinates
          format={format}
          latitude={latitude}
          longitude={longitude}
          crs={crs}
          onFormatChange={this.changeFormat}
        />
      </div>
    );
  }
}

OlCoordinates.propTypes = {
  mouseEvents: PropTypes.object.isRequired,
};

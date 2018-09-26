import React from 'react';
import PropTypes from 'prop-types';
import Coordinates from './coordinates';
import util from '../../util/util';
import olProj from 'ol/proj';
import throttle from 'lodash/throttle';

class OlCoordinates extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      latitude: null,
      longitude: null,
      crs: null,
      format: null
    };
    this.mouseMove = throttle(this.mouseMove, 100).bind(this);
    this.mouseOut = this.mouseOut.bind(this);
    this.changeFormat = this.changeFormat.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (this.props.maps && prevProps.maps !== this.props.maps) {
      this.registerMouseListeners();
    }
  }

  registerMouseListeners() {
    Object.values(this.props.maps).forEach(map => {
      let target = map.getTarget();
      let mapElement = document.getElementById(target);
      let crs = map.getView().getProjection().getCode();
      mapElement.addEventListener('mousemove', event =>
        this.mouseMove(map, crs, event)
      );
      mapElement.addEventListener('mouseout', this.mouseOut);
    });
  }

  mouseMove(map, crs, event) {
    let pixels = map.getEventPixel(event);
    let coord = map.getCoordinateFromPixel(pixels);
    if (!coord) {
      this.clearCoord();
      return;
    }

    let pcoord = olProj.transform(coord, crs, 'EPSG:4326');
    let [lon, lat] = pcoord;
    if (lon < -180 || lon > 180 || lat < -90 || lat > 90) {
      this.clearCoord();
      return;
    }

    this.setState({
      format: util.getCoordinateFormat(),
      latitude: pcoord[0],
      longitude: pcoord[1],
      crs
    });
  }

  mouseOut(event) {
    // Ignore when the mouse goes over the coordinate display. Clearing
    // the coordinates in this situation causes a flicker.
    if (event.relatedTarget) {
      let element = event.relatedTarget;
      if (element.classList.contains('map-coord')) {
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
    // if mobile return
    if (util.browser.small) {
      return;
    }

    return (
      <Coordinates
        format={this.state.format}
        latitude={this.state.latitude}
        longitude={this.state.longitude}
        crs={this.state.crs}
        onFormatChange={this.changeFormat}
      />
    );
  }
}

OlCoordinates.propTypes = {
  maps: PropTypes.object
};

export default OlCoordinates;

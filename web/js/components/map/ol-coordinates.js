import React from 'react';
import { transform } from 'ol/proj';
import Coordinates from './coordinates';
import util from '../../util/util';

const { events } = util;
const getContainerWidth = (format) => {
  const formatWidth = {
    'latlon-dd': 230,
    'latlon-dm': 265,
    'latlon-dms': 255,
  };
  return formatWidth[format];
};

export default class OlCoordinates extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasMouse: false,
      latitude: null,
      longitude: null,
      crs: null,
      format: null,
      width: null,
    };
    this.mouseMove = this.mouseMove.bind(this);
    this.mouseOut = this.mouseOut.bind(this);
    this.changeFormat = this.changeFormat.bind(this);
    this.setInitFormat = this.setInitFormat.bind(this);
  }

  componentDidMount() {
    events.on('map:mousemove', this.mouseMove);
    events.on('map:mouseout', this.mouseOut);
    this.setInitFormat();
  }

  componentWillUnmount() {
    events.off('map:mousemove', this.mouseMove);
    events.off('map:mouseout', this.mouseOut);
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
      if (cl.contains('wv-coords-map')) {
        return;
      }
    }
    this.clearCoord();
  }

  clearCoord() {
    this.setState({ latitude: null, longitude: null });
  }

  setInitFormat() {
    const format = util.getCoordinateFormat();
    const width = getContainerWidth(format);
    this.setState({
      format,
      width,
    });
  }

  changeFormat(format) {
    util.setCoordinateFormat(format);
    const width = getContainerWidth(format);
    this.setState({
      format,
      width,
    });
  }

  render() {
    const {
      hasMouse, format, latitude, longitude, crs, width,
    } = this.state;
    // Don't render until a mouse is being used
    if (!hasMouse) {
      return null;
    }

    return (
      <div id="ol-coords-case" className="wv-coords-container" style={{ width }}>
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

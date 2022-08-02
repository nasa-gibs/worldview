import React from 'react';
import PropTypes from 'prop-types';
import {
  throttle as lodashThrottle,
} from 'lodash';
import { transform } from 'ol/proj';
import { UncontrolledTooltip } from 'reactstrap';
import Coordinates from './coordinates';
import util from '../../util/util';
import { getNormalizedCoordinate } from '../location-search/util';
import { connect } from 'react-redux';
import { changeCoordinateFormat } from '../../modules/settings/actions';

const { events } = util;
const getContainerWidth = (format) => {
  const formatWidth = {
    'latlon-dd': 230,
    'latlon-dm': 265,
    'latlon-dms': 255,
  };
  return formatWidth[format];
};

class OlCoordinates extends React.Component {
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
    const options = { leading: true, trailing: true };
    this.mouseMove = lodashThrottle(this.mouseMove.bind(this), 200, options);
    this.mouseOut = lodashThrottle(this.mouseOut.bind(this), 200, options);
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

  mouseMove({ pixel }, map, crs) {
    const coord = map.getCoordinateFromPixel(pixel);
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
        pcoord = getNormalizedCoordinate([lon, lat]);
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
    const { changeCoordinateFormatAction } = this.props;
    changeCoordinateFormatAction(format);
    //event
    events.trigger('location-search:coordinate-format');
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
    const { show } = this.props;
    return (
      <div id="ol-coords-case" className="wv-coords-container" style={{ width }}>
        {hasMouse && show && (
          <>
            <Coordinates
              format={format}
              latitude={latitude}
              longitude={longitude}
              crs={crs}
              onFormatChange={this.changeFormat}
            />
            {latitude && latitude && (
              <UncontrolledTooltip placement="bottom" target="ol-coords-case">
                Change coordinates format
              </UncontrolledTooltip>
            )}
          </>
        )}
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { settings } = state;
  const { coordinateFormat } = settings;
  return {
    coordinateFormat
  }
}

const mapDispatchToProps = (dispatch) => ({
  changeCoordinateFormatAction: (value) => {
  dispatch(changeCoordinateFormat(value))
  }
})

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(OlCoordinates)

OlCoordinates.propTypes = {
  show: PropTypes.bool,
};

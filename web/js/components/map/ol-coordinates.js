import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {
  throttle as lodashThrottle,
} from 'lodash';
import { transform } from 'ol/proj';
import { UncontrolledTooltip } from 'reactstrap';
import Coordinates from './coordinates';
import util from '../../util/util';
import { getNormalizedCoordinate } from '../location-search/util';
import { changeCoordinateFormat } from '../../modules/settings/actions';
import { MAP_MOUSE_MOVE, MAP_MOUSE_OUT } from '../../util/constants';
import { CRS } from '../../modules/map/constants';

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
    events.on(MAP_MOUSE_MOVE, this.mouseMove);
    events.on(MAP_MOUSE_OUT, this.mouseOut);
    this.setInitFormat();
  }

  // listening to state changes from the settings menu
  componentDidUpdate(prevProps) {
    const { coordinateFormat } = this.props;
    if (prevProps.coordinateFormat !== coordinateFormat) {
      this.changeFormat(coordinateFormat);
    }
  }

  componentWillUnmount() {
    events.off(MAP_MOUSE_MOVE, this.mouseMove);
    events.off(MAP_MOUSE_OUT, this.mouseOut);
  }

  mouseMove({ pixel }, map, crs) {
    const coord = map.getCoordinateFromPixel(pixel);
    if (!coord) {
      this.clearCoord();
      return;
    }
    let pcoord = transform(coord, crs, CRS.GEOGRAPHIC);
    // eslint-disable-next-line prefer-const
    let [lon, lat] = pcoord;
    if (Math.abs(lat) > 90) {
      this.clearCoord();
      return;
    }
    if (Math.abs(lon) > 180) {
      if (crs === CRS.GEOGRAPHIC && Math.abs(lon) < 250) {
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

  changeFormat = (format) => {
    const { changeCoordinateFormat } = this.props;
    changeCoordinateFormat(format);
    util.setCoordinateFormat(format);
    const width = getContainerWidth(format);
    this.setState({
      format,
      width,
    });
  };

  render() {
    const {
      hasMouse, format, latitude, longitude, crs, width,
    } = this.state;
    const { show, isMobile } = this.props;
    const coordContainerStyle = isMobile ? {
      display: 'none',
    }
      : {
        width,
      };

    return (
      <div id="ol-coords-case" className="wv-coords-container" style={coordContainerStyle}>
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
              <UncontrolledTooltip id="center-align-tooltip" placement="bottom" target="ol-coords-case">
                Change coordinates format
              </UncontrolledTooltip>
            )}
          </>
        )}
      </div>
    );
  }
}

function mapStateToProps (state) {
  const { settings, screenSize } = state;
  const { coordinateFormat } = settings;
  const isMobile = screenSize.isMobileDevice;
  return {
    coordinateFormat,
    isMobile,
  };
}

const mapDispatchToProps = (dispatch) => ({
  changeCoordinateFormat: (value) => {
    dispatch(changeCoordinateFormat(value));
  },
});

OlCoordinates.propTypes = {
  show: PropTypes.bool,
  changeCoordinateFormat: PropTypes.func,
  coordinateFormat: PropTypes.string,
  isMobile: PropTypes.bool,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(OlCoordinates);

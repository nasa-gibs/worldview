import { connect } from 'react-redux';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { transform } from 'ol/proj';
import Alert from '../util/alert';
import {
  setPlaceMarker, toggleReverseGeocodeActive,
} from '../../modules/location-search/actions';
import { getNormalizedCoordinate } from './util';
import { areCoordinatesWithinExtent } from '../../modules/location-search/util';
import { reverseGeocode } from '../../modules/location-search/util-api';
import util from '../../util/util';
import { MAP_SINGLE_CLICK, MAP_CONTEXT_MENU, CONTEXT_MENU_LOCATION } from '../../util/constants';
import { CRS } from '../../modules/map/constants';

const { events } = util;

export class CoordinatesMarker extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showExtentAlert: false,
    };
    this.singleClick = this.singleClick.bind(this);
    this.rightClick = this.rightClick.bind(this);
  }

  componentDidMount() {
    events.on(CONTEXT_MENU_LOCATION, this.singleClick);
  }

  componentDidUpdate(prevProps) {
    const { isCoordinateSearchActive } = this.props;
    if (isCoordinateSearchActive) {
      events.on(MAP_SINGLE_CLICK, this.singleClick);
      events.on(MAP_CONTEXT_MENU, this.rightClick);
    } else if (prevProps.isCoordinateSearchActive && !isCoordinateSearchActive) {
      events.off(MAP_SINGLE_CLICK, this.singleClick);
      events.off(MAP_CONTEXT_MENU, this.rightClick);
    }
  }

  componentWillUnmount() {
    events.off(CONTEXT_MENU_LOCATION, this.singleClick);
  }

  rightClick(e) {
    const {
      toggleReverseGeocodeActive,
    } = this.props;

    e.preventDefault();
    toggleReverseGeocodeActive(false);
  }

  singleClick(e, map, crs) {
    const {
      config,
      proj,
      setPlaceMarker,
    } = this.props;

    // handle reverse geocoding mouse click
    const pixels = e.pixel;
    const coord = map.getCoordinateFromPixel(pixels);
    const tCoord = transform(coord, crs, CRS.GEOGRAPHIC);
    const [lon, lat] = getNormalizedCoordinate(tCoord);

    if (!areCoordinatesWithinExtent(proj, [lon, lat])) {
      this.setState({ showExtentAlert: true });
      return;
    }

    reverseGeocode([lon, lat], config).then((results) => {
      setPlaceMarker(tCoord, results);
    });
    this.setState({ showExtentAlert: false });
  }

  // render Location Search extent alert for selecting points outside of the current map extent
  renderExtentAlert = () => {
    const message = 'The selected coordinates are outside of the current map extent. Select a new point or try a different projection.';
    return (
      <Alert
        id="ol-coordinates-location-search-select-coordinates-extent-alert"
        isOpen
        title="Selected Coordinates Outside Current Map Projection"
        timeout={15000}
        message={message}
        onDismiss={() => this.setState({ showExtentAlert: false })}
      />
    );
  };

  render() {
    const { showExtentAlert } = this.state;
    return showExtentAlert && this.renderExtentAlert();
  }
}

function mapStateToProps(state) {
  const {
    screenSize,
    config,
    map,
    proj,
    measure,
    locationSearch,
  } = state;
  const { coordinates, isCoordinateSearchActive } = locationSearch;
  const isMobile = screenSize.isMobileDevice;

  return {
    config,
    coordinates,
    isCoordinateSearchActive,
    isMobile,
    isShowingClick: map.isClickable,
    map,
    measureIsActive: measure.isActive,
    proj,
  };
}

const mapDispatchToProps = (dispatch) => ({
  setPlaceMarker: (coordinates, reverseGeocodeResults) => {
    dispatch(setPlaceMarker(coordinates, reverseGeocodeResults));
  },
  toggleReverseGeocodeActive: (isActive) => {
    dispatch(toggleReverseGeocodeActive(isActive));
  },
});
CoordinatesMarker.propTypes = {
  config: PropTypes.object.isRequired,
  isCoordinateSearchActive: PropTypes.bool.isRequired,
  setPlaceMarker: PropTypes.func.isRequired,
  toggleReverseGeocodeActive: PropTypes.func.isRequired,
  proj: PropTypes.object,
};
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(CoordinatesMarker);

import { connect } from 'react-redux';
import {
  isNaN as lodashIsNaN,
} from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { transform } from 'ol/proj';
import Alert from '../util/alert';
import {
  setPlaceMarker, toggleReverseGeocodeActive,
} from '../../modules/location-search/actions';
import { areCoordinatesWithinExtent } from '../../modules/location-search/util';
import { reverseGeocode } from '../../modules/location-search/util-api';
import { getCoordinateFixedPrecision } from './util';
import util from '../../util/util';

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
    events.on('context-menu:location', this.singleClick);
  }

  componentDidUpdate(prevProps) {
    const { isCoordinateSearchActive } = this.props;
    if (isCoordinateSearchActive) {
      events.on('map:singleclick', this.singleClick);
      events.on('map:contextmenu', this.rightClick);
    } else if (prevProps.isCoordinateSearchActive && !isCoordinateSearchActive) {
      events.off('map:singleclick', this.singleClick);
      events.off('map:contextmenu', this.rightClick);
    }
  }

  componentWillUnmount() {
    events.off('context-menu:location', this.singleClick);
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
      toggleReverseGeocodeActive,
    } = this.props;

    // handle reverse geocoding mouse click
    const pixels = e.pixel;
    const coord = map.getCoordinateFromPixel(pixels);
    const [lon, lat] = transform(coord, crs, 'EPSG:4326');
    const latitude = getCoordinateFixedPrecision(lat);
    const longitude = getCoordinateFixedPrecision(lon);
    const normalizedLongitude = util.normalizeWrappedLongitude(longitude);

    // show alert warning and exit mode if outside current map extent
    const validNums = !lodashIsNaN(parseFloat(latitude)) && !lodashIsNaN(parseFloat(longitude));
    const withinExtent = areCoordinatesWithinExtent(proj, [normalizedLongitude, latitude]);
    if (!validNums || !withinExtent) {
      this.setState({ showExtentAlert: true });
      toggleReverseGeocodeActive(false);
      return;
    }
    // get available reverse geocoding for coordinates and fly to point
    reverseGeocode([normalizedLongitude, latitude], config).then((results) => {
      setPlaceMarker([longitude, latitude], results);
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
  }

  render() {
    const { showExtentAlert } = this.state;
    return showExtentAlert && this.renderExtentAlert();
  }
}

function mapStateToProps(state) {
  const {
    browser,
    config,
    map,
    proj,
    measure,
    locationSearch,
  } = state;
  const { coordinates, isCoordinateSearchActive } = locationSearch;
  const isMobile = browser.lessThan.medium;

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
  proj: PropTypes.object,
  setPlaceMarker: PropTypes.func.isRequired,
  toggleReverseGeocodeActive: PropTypes.func.isRequired,
};
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(CoordinatesMarker);

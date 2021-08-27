import { connect } from 'react-redux';
import {
  isNaN as lodashIsNaN,
} from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { transform } from 'ol/proj';
import Alert from '../util/alert';
import { changeCursor as changeCursorActionCreator } from '../../modules/map/actions';
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
    this.mouseMove = this.mouseMove.bind(this);
    this.singleClick = this.singleClick.bind(this);
    this.rightClick = this.rightClick.bind(this);
  }

  componentDidMount() {
    events.on('map:mousemove', this.mouseMove);
    events.on('map:singleclick', this.singleClick);
    events.on('map:contextmenu', this.rightClick);
  }

  componentWillUnmount() {
    events.off('map:mousemove', this.mouseMove);
    events.off('map:singleclick', this.singleClick);
    events.off('map:contextmenu', this.rightClick);
  }

  mouseMove(event, map, crs) {
    const {
      changeCursor,
      coordinates,
      isCoordinateSearchActive,
      isShowingClick,
      measureIsActive,
    } = this.props;

    if (measureIsActive
      || (!isCoordinateSearchActive && coordinates.length === 0)) {
      return;
    }

    const pixels = map.getEventPixel(event);
    const coord = map.getCoordinateFromPixel(pixels);
    if (!coord) {
      return;
    }
    const [lon, lat] = transform(coord, crs, 'EPSG:4326');
    if (lon < -250 || lon > 250 || lat < -90 || lat > 90) {
      return;
    }
    const hasFeatures = map.hasFeatureAtPixel(pixels);
    if (hasFeatures && !isShowingClick) {
      const featureCheck = (feature) => {
        if (feature.getId() === 'coordinates-map-marker') {
          changeCursor(true);
        }
        return true;
      };
      map.forEachFeatureAtPixel(pixels, featureCheck);
    }
    if (!hasFeatures && isShowingClick) {
      changeCursor(false);
    }
  }

  rightClick(e) {
    const {
      isCoordinateSearchActive,
      toggleReverseGeocodeActive,
    } = this.props;

    if (!isCoordinateSearchActive) return;
    e.preventDefault();
    toggleReverseGeocodeActive(false);
  }

  singleClick(e, map, crs) {
    const {
      config,
      isCoordinateSearchActive,
      measureIsActive,
      proj,
      setPlaceMarker,
      toggleReverseGeocodeActive,
    } = this.props;

    if (measureIsActive) return;
    const pixels = e.pixel;

    // handle reverse geocoding mouse click
    if (isCoordinateSearchActive) {
      const coord = map.getCoordinateFromPixel(pixels);
      const [lon, lat] = transform(coord, crs, 'EPSG:4326');
      const latitude = getCoordinateFixedPrecision(lat);
      const longitude = getCoordinateFixedPrecision(lon);

      // show alert warning and exit mode if outside current map extent
      const validNums = !lodashIsNaN(parseFloat(latitude)) && !lodashIsNaN(parseFloat(longitude));
      const withinExtent = areCoordinatesWithinExtent(proj, [longitude, latitude]);
      if (!validNums || !withinExtent) {
        this.setState({ showExtentAlert: true });
        toggleReverseGeocodeActive(false);
        return;
      }
      // get available reverse geocoding for coordinates and fly to point
      reverseGeocode([longitude, latitude], config).then((results) => {
        setPlaceMarker([longitude, latitude], results);
      });
      this.setState({ showExtentAlert: false });
    }
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
  changeCursor: (bool) => {
    dispatch(changeCursorActionCreator(bool));
  },
  setPlaceMarker: (coordinates, reverseGeocodeResults) => {
    dispatch(setPlaceMarker(coordinates, reverseGeocodeResults));
  },
  toggleReverseGeocodeActive: (isActive) => {
    dispatch(toggleReverseGeocodeActive(isActive));
  },
});
CoordinatesMarker.propTypes = {
  changeCursor: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
  coordinates: PropTypes.array,
  isCoordinateSearchActive: PropTypes.bool.isRequired,
  isShowingClick: PropTypes.bool.isRequired,
  measureIsActive: PropTypes.bool.isRequired,
  proj: PropTypes.object,
  setPlaceMarker: PropTypes.func.isRequired,
  toggleReverseGeocodeActive: PropTypes.func.isRequired,
};
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(CoordinatesMarker);

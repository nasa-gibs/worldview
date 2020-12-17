import { connect } from 'react-redux';
import {
  isNaN as lodashIsNaN,
} from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { transform } from 'ol/proj';
import Alert from '../util/alert';
import { changeCursor as changeCursorActionCreator } from '../../modules/map/actions';
import { isCoordinatesDialogAvailableAtPixel } from './ol-coordinates-marker-util';
import {
  setPlaceMarker, toggleDialogVisible, toggleReverseGeocodeActive,
} from '../../modules/geosearch/actions';
import { areCoordinatesWithinExtent } from '../../modules/geosearch/util';
import { reverseGeocode } from '../../modules/geosearch/util-api';
import { getCoordinateFixedPrecision } from './util';

export class CoordinatesMarker extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showExtentAlert: false,
    };
    this.mouseMove = this.mouseMove.bind(this);
    this.singleClick = this.singleClick.bind(this);
    this.rightClick = this.rightClick.bind(this);
    this.registerMouseListeners();
  }

  componentWillUnmount() {
    const { mouseEvents } = this.props;
    mouseEvents.off('mousemove', this.mouseMove);
    mouseEvents.off('singleclick', this.singleClick);
    mouseEvents.off('contextmenu', this.rightClick);
  }

  registerMouseListeners() {
    const { mouseEvents } = this.props;
    mouseEvents.on('mousemove', this.mouseMove);
    mouseEvents.on('singleclick', this.singleClick);
    mouseEvents.on('contextmenu', this.rightClick);
  }

  mouseMove(event, map, crs) {
    const pixels = map.getEventPixel(event);
    const coord = map.getCoordinateFromPixel(pixels);

    const {
      isShowingClick,
      changeCursor,
      measureIsActive,
    } = this.props;

    if (!coord) {
      return;
    }
    const [lon, lat] = transform(coord, crs, 'EPSG:4326');
    if (lon < -250 || lon > 250 || lat < -90 || lat > 90) {
      return;
    }
    const hasFeatures = map.hasFeatureAtPixel(pixels);
    if (hasFeatures && !isShowingClick && !measureIsActive) {
      const featureCheck = (feature) => feature.getId() === 'coordinates-map-marker';
      const isActiveLayer = map.forEachFeatureAtPixel(pixels, featureCheck);
      if (isActiveLayer) {
        changeCursor(true);
      }
    } else if (!hasFeatures && isShowingClick) {
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
      setPlaceMarker,
      toggleReverseGeocodeActive,
    } = this.props;

    const pixels = e.pixel;
    const coord = map.getCoordinateFromPixel(pixels);

    const [lon, lat] = transform(coord, crs, 'EPSG:4326');

    const latitude = getCoordinateFixedPrecision(lat);
    const longitude = getCoordinateFixedPrecision(lon);

    if (measureIsActive) return;
    // handle reverse geocoding mouse click
    if (isCoordinateSearchActive) {
      // show alert warning and exit mode if outside current map extent
      const validNums = !lodashIsNaN(parseFloat(latitude)) && !lodashIsNaN(parseFloat(longitude));
      const withinExtent = areCoordinatesWithinExtent({ ui: { selected: map } }, config, [longitude, latitude]);
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
    } else {
      // handle clicking on pixel and/or map marker
      e.stopPropagation();
      this.getCoordinatesDialog(pixels, map);
    }
  }

  getCoordinatesDialog = (pixels, olMap) => {
    const {
      isMobile,
      toggleDialogVisible,
    } = this.props;
    const isMarker = isCoordinatesDialogAvailableAtPixel(pixels, olMap, isMobile);

    if (isMarker) {
      toggleDialogVisible(true);
    }
  }

  // render geosearch extent alert for selecting points outside of the current map extent
  renderExtentAlert = () => {
    const message = 'The selected coordinates are outside of the current map extent. Select a new point or try a different projection.';
    return (
      <Alert
        id="ol-coordinates-geosearch-select-coordinates-extent-alert"
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
    measure,
    geosearch,
  } = state;
  const { coordinates, isCoordinateSearchActive } = geosearch;
  const isMobile = browser.lessThan.medium;

  return {
    config,
    map,
    coordinates,
    isCoordinateSearchActive,
    isMobile,
    isShowingClick: map.isClickable,
    measureIsActive: measure.isActive,
  };
}

const mapDispatchToProps = (dispatch) => ({
  changeCursor: (bool) => {
    dispatch(changeCursorActionCreator(bool));
  },
  setPlaceMarker: (coordinates, reverseGeocodeResults) => {
    dispatch(setPlaceMarker(coordinates, reverseGeocodeResults));
  },
  toggleDialogVisible: (isVisible) => {
    dispatch(toggleDialogVisible(isVisible));
  },
  toggleReverseGeocodeActive: (isActive) => {
    dispatch(toggleReverseGeocodeActive(isActive));
  },
});
CoordinatesMarker.propTypes = {
  changeCursor: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
  isCoordinateSearchActive: PropTypes.bool.isRequired,
  isMobile: PropTypes.bool.isRequired,
  isShowingClick: PropTypes.bool.isRequired,
  measureIsActive: PropTypes.bool.isRequired,
  mouseEvents: PropTypes.object.isRequired,
  setPlaceMarker: PropTypes.func.isRequired,
  toggleDialogVisible: PropTypes.func.isRequired,
  toggleReverseGeocodeActive: PropTypes.func.isRequired,
};
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(CoordinatesMarker);

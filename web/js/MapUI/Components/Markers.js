import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { reverseGeocode } from '../../modules/location-search/util-api';
import { getNormalizedCoordinate } from '../../components/location-search/util';
import { animateCoordinates, areCoordinatesWithinExtent, getCoordinatesMarker } from '../../modules/location-search/util';
import { setGeocodeResults, removeMarker } from '../../modules/location-search/actions';
import { getActiveLayers, getMaxZoomLevelLayerCollection } from '../../modules/layers/selectors';

const Markers = (props) => {
  const {
    action,
    config,
    coordinates,
    isMobileDevice,
    proj,
    removeMarker,
    setGeocodeResults,
    setUI,
    state,
    ui,
  } = props;

  useEffect(() => {
    switch (action.type) {
      case 'LOCATION_SEARCH/REMOVE_MARKER': {
        return removeCoordinatesMarker(action.coordinates);
      }
      case 'LOCATION_SEARCH/SET_MARKER': {
        if (action.flyToExistingMarker) {
          return flyToMarker(action.coordinates);
        }
        return addMarkerAndUpdateStore(true, action.reverseGeocodeResults, action.isCoordinatesSearchActive, action.coordinates);
      }
      case 'LOCATION_SEARCH/TOGGLE_DIALOG_VISIBLE': {
        return addMarkerAndUpdateStore(false);
      }
      default:
        break;
    }
  }, [action]);

  /*
   * Remove coordinates marker from all projections
   *
   * @method removeCoordinatesMarker
   * @static
   *
   * @returns {void}
   */
  const removeCoordinatesMarker = (coordinatesObject) => {
    const uiCopy = ui;
    uiCopy.markers.forEach((marker) => {
      if (marker.id === coordinatesObject.id) {
        marker.setMap(null);
        uiCopy.selected.removeOverlay(marker);
      }
    });
    setUI(uiCopy);
  };

  /*
   * Remove all coordinates markers
   *
   * @method removeAllCoordinatesMarkers
   * @static
   *
   * @returns {void}
   */
  const removeAllCoordinatesMarkers = () => {
    const uiCopy = ui;
    uiCopy.markers.forEach((marker) => {
      marker.setMap(null);
      uiCopy.selected.removeOverlay(marker);
    });
    setUI(uiCopy);
  };

  /*
   * Handle reverse geocode and add map marker with results
   *
   * @method handleActiveMapMarker
   * @static
   *
   * @returns {void}
   */
  const handleActiveMapMarker = () => {
    removeAllCoordinatesMarkers();
    if (coordinates && coordinates.length > 0) {
      coordinates.forEach((coordinatesObject) => {
        const { longitude, latitude } = coordinatesObject;
        const coord = [longitude, latitude];
        if (!areCoordinatesWithinExtent(proj, coord)) return;
        reverseGeocode(getNormalizedCoordinate(coord), config).then((results) => {
          addMarkerAndUpdateStore(true, results, null, coordinatesObject);
        });
      });
    }
  };

  const flyToMarker = (coordinatesObject) => {
    const { sources } = config;
    const { longitude, latitude } = coordinatesObject;
    const latestCoordinates = coordinatesObject && [longitude, latitude];
    const zoom = ui.selected.getView().getZoom();
    const activeLayers = getActiveLayers(state).filter(({ projections }) => projections[proj.id]);
    const maxZoom = getMaxZoomLevelLayerCollection(activeLayers, zoom, proj.id, sources);
    animateCoordinates(ui.selected, proj, latestCoordinates, maxZoom);
  };

  /*
   * Add map coordinate marker and update store
   *
   * @method addMarkerAndUpdateStore
   * @static
   *
   * @param {Object} geocodeResults
   * @param {Boolean} shouldFlyToCoordinates - if location search via input
   * @returns {void}
   */
  const addMarkerAndUpdateStore = (showDialog, geocodeResults, shouldFlyToCoordinates, coordinatesObject) => {
    const uiCopy = ui;
    const results = geocodeResults;
    if (!results) return;
    const remove = () => removeMarker(coordinatesObject);
    const marker = getCoordinatesMarker(
      proj,
      coordinatesObject,
      results,
      remove,
      isMobileDevice,
      showDialog,
    );

    if (!marker) {
      return false;
    }

    uiCopy.markers.push(marker);
    uiCopy.selected.addOverlay(marker);
    uiCopy.selected.renderSync();

    if (shouldFlyToCoordinates) {
      flyToMarker(coordinatesObject);
    }

    setGeocodeResults(geocodeResults);
    setUI(uiCopy);
  };

  useEffect(() => {
    if (!ui.proj) return;
    handleActiveMapMarker();
  }, [ui]);

  return null;
};

const mapStateToProps = (state) => {
  const { locationSearch, proj, screenSize } = state;
  const { coordinates } = locationSearch;
  const { isMobileDevice } = screenSize;
  return {
    coordinates,
    isMobileDevice,
    proj,
    state,
  };
};

const mapDispatchToProps = (dispatch) => ({
  setGeocodeResults: (value) => {
    dispatch(setGeocodeResults(value));
  },
  removeMarker: (value) => {
    dispatch(removeMarker(value));
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Markers);

Markers.propTypes = {
  action: PropTypes.object,
  config: PropTypes.object,
  coordinates: PropTypes.array,
  isMobileDevice: PropTypes.bool,
  proj: PropTypes.object,
  removeMarker: PropTypes.func,
  setGeocodeResults: PropTypes.func,
  setUI: PropTypes.func,
  state: PropTypes.object,
  ui: PropTypes.object,
};



import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { reverseGeocode } from '../../../modules/location-search/util-api';
import { getNormalizedCoordinate } from '../../../components/location-search/util';
import { animateCoordinates, areCoordinatesWithinExtent, getCoordinatesMarker } from '../../../modules/location-search/util';
import { setGeocodeResults, removeMarker } from '../../../modules/location-search/actions';
import { getActiveLayers, getMaxZoomLevelLayerCollection } from '../../../modules/layers/selectors';

function Markers(props) {
  const {
    action,
    activeLayers,
    config,
    coordinates,
    isKioskModeActive,
    isMobileDevice,
    selectedMap,
    selectedMapMarkers,
    proj,
    removeMarker,
    setGeocodeResults,
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

  /**
   * Remove coordinates marker from all projections
   *
   * @method removeCoordinatesMarker
   * @static
   *
   * @param {Object} coordinatesObject - set of coordinates for marker
   *
   * @returns {void}
   */
  const removeCoordinatesMarker = (coordinatesObject) => {
    selectedMapMarkers.forEach((marker) => {
      if (marker.id === coordinatesObject.id) {
        marker.setMap(null);
        selectedMap.removeOverlay(marker);
      }
    });
  };

  /**
   * Remove all coordinates markers
   *
   * @method removeAllCoordinatesMarkers
   * @static
   *
   * @returns {void}
   */
  const removeAllCoordinatesMarkers = () => {
    ui.markers.forEach((marker) => {
      marker.setMap(null);
      ui.selected.removeOverlay(marker);
    });
  };

  /**
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
    const zoom = selectedMap.getView().getZoom();
    const maxZoom = getMaxZoomLevelLayerCollection(activeLayers, zoom, proj.id, sources);
    animateCoordinates(selectedMap, proj, latestCoordinates, maxZoom, isKioskModeActive);
  };

  /**
   * Add map coordinate marker and update store
   *
   * @method addMarkerAndUpdateStore
   * @static
   *
   * @param {Boolean} showDialog
   * @param {Object} geocodeResults
   * @param {Boolean} shouldFlyToCoordinates - if location search via input
   * @param {Object} coordinatesObject - set of coordinates for marker
   * @returns {void}
   */
  const addMarkerAndUpdateStore = (showDialog, geocodeResults, shouldFlyToCoordinates, coordinatesObject) => {
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

    ui.markers.push(marker);
    ui.selected.addOverlay(marker);
    ui.selected.renderSync();

    if (shouldFlyToCoordinates) {
      flyToMarker(coordinatesObject);
    }

    setGeocodeResults(geocodeResults);
  };

  useEffect(() => {
    handleActiveMapMarker();
  }, [ui]);

  return null;
}

const mapStateToProps = (state) => {
  const {
    locationSearch, proj, screenSize, map,
  } = state;
  const { isKioskModeActive } = state.ui;
  const { coordinates } = locationSearch;
  const { isMobileDevice } = screenSize;
  const activeLayers = getActiveLayers(state).filter(({ projections }) => projections[proj.id]);
  const selectedMap = map.ui.selected;
  const selectedMapMarkers = map.ui.markers;
  return {
    activeLayers,
    coordinates,
    isKioskModeActive,
    isMobileDevice,
    selectedMap,
    selectedMapMarkers,
    proj,
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

export default React.memo(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  )(Markers),
);

Markers.propTypes = {
  action: PropTypes.object,
  config: PropTypes.object,
  coordinates: PropTypes.array,
  isKioskModeActive: PropTypes.bool,
  isMobileDevice: PropTypes.bool,
  proj: PropTypes.object,
  removeMarker: PropTypes.func,
  setGeocodeResults: PropTypes.func,
  state: PropTypes.object,
  ui: PropTypes.object,
};



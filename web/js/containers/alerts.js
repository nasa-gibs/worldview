import { useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import AlertUtil from '../components/util/alert';
import { openCustomContent } from '../modules/modal/actions';
import { hasVectorLayers } from '../modules/layers/util';
import {
  DISABLE_VECTOR_ZOOM_ALERT,
  DISABLE_VECTOR_EXCEEDED_ALERT,
  MODAL_PROPERTIES,
} from '../modules/alerts/constants';
import safeLocalStorage from '../util/local-storage';
import { getActiveLayers, subdailyLayersActive } from '../modules/layers/selectors';

const { granuleModalProps, zoomModalProps } = MODAL_PROPERTIES;

const HAS_LOCAL_STORAGE = safeLocalStorage.enabled;
const {
  DISMISSED_COMPARE_ALERT,
  DISMISSED_DISTRACTION_FREE_ALERT,
  DISMISSED_EVENT_VIS_ALERT,
  DISSMISSED_DDV_ZOOM_ALERT,
  DISSMISSED_DDV_LOCATION_ALERT,
} = safeLocalStorage.keys;

function DismissableAlerts(props) {
  const {
    dismissVectorZoomAlert,
    dismissVectorExceededAlert,
    hasSubdailyLayers,
    isCompareActive,
    isDistractionFreeModeActive,
    isEmbedModeActive,
    isEventsActive,
    isSmall,
    isMobile,
    isAnimationActive,
    isVectorZoomAlertPresent,
    isVectorExceededAlertPresent,
    openAlertModal,
    isDDVZoomAlertPresent,
    isDDVLocationAlertPresent,
    openGranuleAlertModal,
    openZoomAlertModal,
    ddvZoomAlerts,
    ddvLocationAlerts,
  } = props;

  const [hasDismissedEvents, setHasDismissedEvents] = useState(
    () => !!safeLocalStorage.getItem(DISMISSED_EVENT_VIS_ALERT),
  );
  const [hasDismissedCompare, setHasDismissedCompare] = useState(
    () => !!safeLocalStorage.getItem(DISMISSED_COMPARE_ALERT),
  );
  const [hasDismissedDistractionFree, setHasDismissedDistractionFree] = useState(
    () => !!safeLocalStorage.getItem(DISMISSED_DISTRACTION_FREE_ALERT),
  );
  const [hasDismissedDDVZoom, setHasDismissedDDVZoom] = useState(
    () => !!safeLocalStorage.getItem(DISSMISSED_DDV_ZOOM_ALERT),
  );
  const [hasDismissedDDVLocation, setHasDismissedDDVLocation] = useState(
    () => !!safeLocalStorage.getItem(DISSMISSED_DDV_LOCATION_ALERT),
  );
  const [distractionFreeModeInitLoad, setDistractionFreeModeInitLoad] = useState(false);

  const prevDistractionFreeRef = useRef(isDistractionFreeModeActive);

  // componentDidMount: set init load flag if distraction free mode is already active
  useEffect(() => {
    if (isDistractionFreeModeActive) {
      setDistractionFreeModeInitLoad(true);
    }
  }, []);

  // componentDidUpdate: clear init load flag when distraction free mode is deactivated
  useEffect(() => {
    const prev = prevDistractionFreeRef.current;
    prevDistractionFreeRef.current = isDistractionFreeModeActive;
    if (distractionFreeModeInitLoad && prev && !isDistractionFreeModeActive) {
      setDistractionFreeModeInitLoad(false);
    }
  }, [isDistractionFreeModeActive, distractionFreeModeInitLoad]);

  const dismissAlert = (storageKey, stateKey) => {
    safeLocalStorage.setItem(storageKey, true);
    const setters = {
      hasDismissedEvents: setHasDismissedEvents,
      hasDismissedCompare: setHasDismissedCompare,
      hasDismissedDistractionFree: setHasDismissedDistractionFree,
      hasDismissedDDVZoom: setHasDismissedDDVZoom,
      hasDismissedDDVLocation: setHasDismissedDDVLocation,
    };
    if (setters[stateKey]) setters[stateKey](true);
  };

  const { eventModalProps, compareModalProps, vectorModalProps } = MODAL_PROPERTIES;
  const hasFailCondition = !HAS_LOCAL_STORAGE ||
    isEmbedModeActive ||
    distractionFreeModeInitLoad;
  if (hasFailCondition) return null;

  const showEventsAlert = !isSmall && !hasDismissedEvents && isEventsActive;
  const showCompareAlert = !isSmall && !hasDismissedCompare && isCompareActive;
  const showAnimationAlert = isMobile && isAnimationActive && hasSubdailyLayers;
  const showDDVZoomAlert = isDDVZoomAlertPresent && !hasDismissedDDVZoom;
  const showDDVLocationAlert = isDDVLocationAlertPresent && !hasDismissedDDVLocation;

  return isDistractionFreeModeActive
    ? !hasDismissedDistractionFree && (
      <AlertUtil
        id="distraction-free-mode-active-alert"
        isOpen
        noPortal
        onDismiss={() => dismissAlert(DISMISSED_DISTRACTION_FREE_ALERT, 'hasDismissedDistractionFree')}
        message="You are now in distraction free mode. Click the eye button to exit."
      />
    )
    : (
      <>
        {showEventsAlert && (
          <AlertUtil
            id="event-alert"
            isOpen
            noPortal
            onClick={() => openAlertModal(eventModalProps)}
            onDismiss={() => dismissAlert(DISMISSED_EVENT_VIS_ALERT, 'hasDismissedEvents')}
            message="Events may not be visible at all times."
          />
        )}
        {showCompareAlert && (
          <AlertUtil
            isOpen
            noPortal
            onClick={() => openAlertModal(compareModalProps)}
            onDismiss={() => dismissAlert(DISMISSED_COMPARE_ALERT, 'hasDismissedCompare')}
            message="You are now in comparison mode."
          />
        )}
        {isVectorZoomAlertPresent && (
          <AlertUtil
            isOpen
            noPortal
            onClick={() => openAlertModal(vectorModalProps)}
            onDismiss={dismissVectorZoomAlert}
            message="Vector features may not be clickable at all zoom levels."
          />
        )}
        {isVectorExceededAlertPresent && (
          <AlertUtil
            isOpen
            noPortal
            onDismiss={dismissVectorExceededAlert}
            message="Too many results at selected point. Zoom in map to see more individual points."
          />
        )}
        {showAnimationAlert && (
          <AlertUtil
            isOpen
            noPortal
            icon="info-circle"
            message="Some animations may use a large amount of data (>100MB)"
            onDismiss={() => {}}
          />
        )}
        {showDDVZoomAlert &&
          ddvZoomAlerts.map((layer) => (
            <AlertUtil
              key={`ddv-zoom-${layer}`}
              id={`zoom-alert-${`${layer}`.replace(/[^a-z0-9_-]/gi, '-')}`}
              isOpen
              noPortal
              title="Zoom in to see imagery for this layer"
              messageTitle={layer}
              message="Imagery is not available at this zoom level."
              onDismiss={() => dismissAlert(DISSMISSED_DDV_ZOOM_ALERT, 'hasDismissedDDVZoom')}
              onClick={openZoomAlertModal}
            />
          ))}
        { showDDVLocationAlert &&
          ddvLocationAlerts.map((layer) => (
            <AlertUtil
              key={`ddv-location-${layer}`}
              id={`granule-alert-${`${layer}`.replace(/[^a-z0-9_-]/gi, '-')}`}
              isOpen
              noPortal
              title="Try moving the map or select a different date in the layer's settings."
              messageTitle={layer}
              message="Imagery is not available at this location or date."
              onDismiss={() => dismissAlert(DISSMISSED_DDV_LOCATION_ALERT, 'hasDismissedDDVLocation')}
              onClick={openGranuleAlertModal}
            />
          ))}
      </>
    );
}

const mapDispatchToProps = (dispatch) => ({
  openAlertModal: ({ id, props }) => {
    dispatch(openCustomContent(id, props));
  },
  openGranuleAlertModal: () => {
    const { id, props } = granuleModalProps;
    dispatch(openCustomContent(id, props));
  },
  openZoomAlertModal: () => {
    const { id, props } = zoomModalProps;
    dispatch(openCustomContent(id, props));
  },
  dismissVectorZoomAlert: () => dispatch({ type: DISABLE_VECTOR_ZOOM_ALERT }),
  dismissVectorExceededAlert: () => dispatch({ type: DISABLE_VECTOR_EXCEEDED_ALERT }),
});
const mapStateToProps = (state) => {
  const {
    embed, events, sidebar, compare, alerts, ui, animation, screenSize,
  } = state;
  const {
    isVectorZoomAlertPresent,
    isVectorExceededAlertPresent,
    isDDVZoomAlertPresent,
    isDDVLocationAlertPresent,
    ddvZoomAlerts,
    ddvLocationAlerts,
  } = alerts;
  const activeLayers = getActiveLayers(state);
  const hasActiveVectorLayers = hasVectorLayers(activeLayers);

  return {
    ddvLocationAlerts,
    ddvZoomAlerts,
    isCompareActive: compare.active,
    isDDVZoomAlertPresent,
    isDDVLocationAlertPresent,
    isDistractionFreeModeActive: ui.isDistractionFreeModeActive,
    isEmbedModeActive: embed.isEmbedModeActive,
    isEventsActive: !!(events.selected.id && sidebar.activeTab === 'events'),
    isSmall: screenSize.screenWidth < screenSize.breakpoints.small,
    isMobile: screenSize.isMobileDevice,
    isAnimationActive: animation.isActive,
    isVectorZoomAlertPresent: hasActiveVectorLayers && isVectorZoomAlertPresent,
    isVectorExceededAlertPresent: hasActiveVectorLayers && isVectorExceededAlertPresent,
    hasSubdailyLayers: subdailyLayersActive(state),
  };
};
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(DismissableAlerts);

DismissableAlerts.propTypes = {
  ddvZoomAlerts: PropTypes.oneOfType([PropTypes.array, PropTypes.oneOf(['null'])]),
  ddvLocationAlerts: PropTypes.oneOfType([PropTypes.array, PropTypes.oneOf(['null'])]),
  dismissVectorZoomAlert: PropTypes.func,
  dismissVectorExceededAlert: PropTypes.func,
  hasSubdailyLayers: PropTypes.bool,
  isAnimationActive: PropTypes.bool,
  isCompareActive: PropTypes.bool,
  isDistractionFreeModeActive: PropTypes.bool,
  isEmbedModeActive: PropTypes.bool,
  isEventsActive: PropTypes.bool,
  isSmall: PropTypes.bool,
  isMobile: PropTypes.bool,
  isVectorZoomAlertPresent: PropTypes.bool,
  isVectorExceededAlertPresent: PropTypes.bool,
  openAlertModal: PropTypes.func,
  isDDVZoomAlertPresent: PropTypes.bool,
  isDDVLocationAlertPresent: PropTypes.bool,
  openGranuleAlertModal: PropTypes.func,
  openZoomAlertModal: PropTypes.func,
};

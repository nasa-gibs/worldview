import EventsAlertModalBody from '../../components/events/alert-body';
import CompareAlertModalBody from '../../components/compare/alert';
import VectorZoomAlertModalBody from '../../components/feature-alert/vector-alert-modal';
import GranuleAlertModalBody from '../../components/feature-alert/granuleAlertModal';
import ZoomAlertModalBody from '../../components/feature-alert/zoomAlertModal';

export const DISABLE_VECTOR_ZOOM_ALERT = 'ALERTS/DISABLE_VECTOR_ZOOM_ALERT';
export const ACTIVATE_VECTOR_ZOOM_ALERT = 'ALERTS/ACTIVATE_VECTOR_ZOOM_ALERT';
export const DISABLE_VECTOR_EXCEEDED_ALERT = 'ALERTS/DISABLE_VECTOR_EXCEEDED_ALERT';
export const ACTIVATE_VECTOR_EXCEEDED_ALERT = 'ALERTS/ACTIVATE_VECTOR_EXCEEDED_ALERT';
export const ACTIVATE_DDV_ZOOM_ALERT = 'ALERTS/ACTIVATE_DDV_ZOOM_ALERT';
export const ACTIVATE_DDV_LOCATION_ALERT = 'ALERTS/ACTIVATE_DDV_LOCATION_ALERT';
export const DEACTIVATE_DDV_ZOOM_ALERT = 'ALERTS/DEACTIVATE_DDV_ZOOM_ALERT';
export const DEACTIVATE_DDV_LOCATION_ALERT = 'ALERTS/DEACTIVATE_DDV_LOCATION_ALERT';

export const MODAL_PROPERTIES = {
  eventModalProps: {
    id: 'event_visibility_info',
    props: {
      headerText: 'Events may not be visible at all times.',
      backdrop: false,
      size: 'lg',
      clickableBehindModal: true,
      bodyComponent: EventsAlertModalBody,
      desktopOnly: true,
    },
  },
  compareModalProps: {
    id: 'compare_mode_info',
    props: {
      headerText: 'You are now in comparison mode',
      backdrop: false,
      size: 'lg',
      clickableBehindModal: true,
      bodyComponent: CompareAlertModalBody,
      desktopOnly: true,
    },
  },
  vectorModalProps: {
    id: 'vector_layer_info',
    props: {
      headerText: 'Vector features may not be clickable at all zoom levels.',
      backdrop: false,
      size: 'lg',
      clickableBehindModal: true,
      bodyComponent: VectorZoomAlertModalBody,
      desktopOnly: true,
    },
  },
  granuleModalProps: {
    id: 'granule_layer_info',
    props: {
      headerText: 'Layer imagery is not visible at this location or date.',
      backdrop: false,
      size: 'lg',
      clickableBehindModal: true,
      bodyComponent: GranuleAlertModalBody,
      desktopOnly: true,
    },
  },
  zoomModalProps: {
    id: 'zoom_layer_info',
    props: {
      headerText: 'Layer imagery is not visible at this zoom level.',
      backdrop: false,
      size: 'lg',
      clickableBehindModal: true,
      bodyComponent: ZoomAlertModalBody,
      desktopOnly: true,
    },
  },
};

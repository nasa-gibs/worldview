import EventsAlertModalBody from '../../components/events/alert-body';
import CompareAlertModalBody from '../../components/compare/alert';
import VectorZoomAlertModalBody from '../../components/feature-alert/vector-alert-modal';

export const DISABLE_VECTOR_ZOOM_ALERT = 'ALERTS/DISABLE_VECTOR_ZOOM_ALERT';
export const ACTIVATE_VECTOR_ZOOM_ALERT = 'ALERTS/ACTIVATE_VECTOR_ZOOM_ALERT';
export const DISABLE_VECTOR_EXCEEDED_ALERT = 'ALERTS/DISABLE_VECTOR_EXCEEDED_ALERT';
export const ACTIVATE_VECTOR_EXCEEDED_ALERT = 'ALERTS/ACTIVATE_VECTOR_EXCEEDED_ALERT';

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
};

/* eslint-disable no-storage/no-browser-storage */
/* eslint-disable no-console */
const enabled = (function() {
  try {
    if (window.localStorage) {
      const uid = new Date().toString();
      localStorage.setItem(uid, uid);
      const result = localStorage.getItem(uid) === uid;
      localStorage.removeItem(uid);
      return result && true;
    }
  } catch (error) {
    console.warn('Local storage disabled.');
    return false;
  }
}());

export default {
  enabled,
  keys: {
    RECENT_LAYERS: 'recentLayers',
    LOCATION_SEARCH_COLLAPSED: 'locationSearchState',
    DISMISSED_EVENT_VIS_ALERT: 'dismissedEventVisibilityAlert',
    DISMISSED_COMPARE_ALERT: 'dismissedCompareAlert',
    DISMISSED_DISTRACTION_FREE_ALERT: 'dismissedDistractionFreeAlert',
    GLOBAL_TEMPERATURE_UNIT: 'globalTemperatureUnit',
    HIDE_TOUR: 'hideTour',
    HIDE_EDS_WARNING: 'hideEDS',
    SIDEBAR_COLLAPSED: 'sidebarState',
    COORDINATE_FORMAT: 'coordinateFormat',
    NOTIFICATION_OUTAGE: 'outage',
    NOTIFICATION_ALERT: 'alert',
    NOTIFICATION_MSG: 'message',
    GROUP_OVERLAYS: 'groupOverlays',
  },
  getItem(key) {
    return enabled && localStorage.getItem(key);
  },
  setItem(key, value) {
    if (enabled) {
      localStorage.setItem(key, value);
    }
  },
  removeItem(key) {
    if (enabled) {
      localStorage.removeItem(key);
    }
  },
};

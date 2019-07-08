module.exports = {
  url: 'http://localhost:3000/',
  production: 'https://worldview.earthdata.nasa.gov/',
  selectors: {
    eventsTab: '#events-sidebar-tab',
    dataTab: '#download-sidebar-tab',
    yearlyResolutionTooltip: '#zoom-years',
    timelineSetToYears: '#current-zoom.zoom-years',
    modalCloseButton: '.modal-header .close',
    notificationDismissButton: '.ui-dialog.notify-alert .fa-times',
    overlayLayerItems: '#overlays li',
    resolutionTooltip: '#zoom-btn-container',
    notifyMessage: '.notify-alert .notify-message'
  },
  delay: 3000, // Acceptable delay in ms between performing actions and seeing results
  timeout: 20000
};

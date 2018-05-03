module.exports = {
  url: 'http://localhost:3000/',
  production: 'https://worldview.earthdata.nasa.gov/',
  selectors: {
    'eventsTab': '[data-tab="events"]',
    'dataTab': '[data-tab="download"]',
    'infoButton': '.wv-layers-info',
    'optionsButton': '.wv-layers-options',
    'infoDialog': '[aria-describedby="wv-layers-info-dialog"]',
    'optionsDialog': '[aria-describedby="wv-layers-options-dialog"]',
    'layersSearchField': '#layers-search-input',
    'sourceInfoIcon': '.layers-all-layer .fa-info-circle',
    'sourceMetadataCloseButton': '.source-metadata .metadata-more',
    'yearlyResolutionTooltip': '#zoom-years',
    'timelineSetToYears': '#current-zoom.zoom-years',
    'modalCloseButton': '.ui-dialog.ui-draggable.ui-resizable .ui-dialog-titlebar-close',
    'notificationDismissButton': '.ui-dialog.notify-alert .fa-times',
    'overlayLayerItems': '#overlays li',
    'resolutionTooltip': '#zoom-btn-container',
    'notifyMessage': '.notify-alert .notify-message',
    'clearRotationButton': '#wv-map-arctic > button.wv-map-reset-rotation.wv-map-zoom.ui-button.ui-widget.ui-state-default.ui-corner-all.ui-button-text-only > span'
  },
  delay: 3000 // Acceptable delay in ms between performing actions and seeing results
};

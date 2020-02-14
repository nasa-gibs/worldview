module.exports = {
  // animations
  createGifIcon: '#wv-animation-widget-file-video-icon',
  createGifButton: '.gif-dialog .button-text',
  gifPreviewStartDate: '.gif-download-grid .grid-child:nth-child(2) span',
  gifPreviewEndDate: '.gif-download-grid .grid-child:nth-child(4) span',
  gifPreviewFrameRateValue: '.gif-download-grid .grid-child:nth-child(6) span',
  gifPreviewEndResolutionSelector: '.gif-selector-case #gif-resolution',
  gifPreviewEndResolutionOption250: '#gif-resolution option[value="1"]',
  gifPreviewEndResolutionOption500: '#gif-resolution option[value="2"]',
  gifDownloadIcon: '.animation-gif-dialog-wrapper .wv-button.gray',
  gifDownloadButton: '.animation-gif-dialog-wrapper .wv-button',
  gifResults: '.gif-results-dialog-case img',
  animationWidget: '#wv-animation-widget',
  animationButton: '#animate-button',

  // sidebar
  sidebarContainer: '#productsHolder',

  // compare
  swipeButton: '#compare-swipe-button',
  opacityButton: '#compare-opacity-button',
  spyButton: '#compare-spy-button',
  aTab: '.ab-tabs-case .ab-tab.first-tab',
  bTab: '.ab-tabs-case .ab-tab.second-tab',
  swipeDragger: '.ab-swipe-line .ab-swipe-dragger',
  compareButton: '#compare-toggle-button',

  // measure
  measureBtn: '#wv-measure-button',
  measureMenu: '#measure_menu',
  measureDistanceBtn: '#measure-distance-button',
  measureAreaBtn: '#measure-area-button',
  clearMeasurementsBtn: '#clear-measurements-button',
  unitOfMeasureToggle: '.measure-unit-toggle .custom-control-label',
  measurementTooltip: '.tooltip-measure.tooltip-static',

  // timeline
  dragger: '.timeline-dragger',

  // layers
  infoButton: '.wv-layers-info',
  optionsButton: '.wv-layers-options',
  infoDialog: '.layer-info-settings-modal',
  optionsDialog: '.layer-info-settings-modal',
  layersSearchField: 'input#layers-search-input',
  categoriesContainer: '.category-masonry-case',
  categoriesNav: '#categories-nav',
  // layersAll: '#layers-all',
  allCategoryHeader: '#legacy-all .layer-category-name',
  floodsCategoryHeader: '#floods .layer-category-name',
  layersAll: '.layers-all-layer',

  layerBrowseList: '.layer-list-container.browse',
  layerSearchList: '.layer-list-container.search',
  layersSearchRow: '.search-row.layers-all-layer',
  sourceInfoIcon: '.layers-all-layer .fa-info-circle',
  layerPickerBackButton: '#layer-search .back-button',
  layerCheckBoxEnabled: '.search-row.layers-all-layer .wv-checkbox.checked',
  layerDetails: '.layer-detail-container',
  layerDetailsDateRange: '.source-metadata .layer-date-range',
  layerDetailHeader: '.layer-detail-container .layers-all-header',
  layerResultsCountText: '.header-filter-container .results-text',
  addLayers: '#layers-add',
  addToMapButton: '.layer-detail-container .add-to-map-btn',
  layerModal: '#layer-modal-main',
  sourceMetadataCloseButton: '.source-metadata .metadata-more',
  layersModalCloseButton: '.custom-layer-dialog .modal-header .close',
  aerosolOpticalDepth: '#legacy-all #layer-category-item-legacy-all-aerosol-optical-depth',
  backToCategories: 'a.breadcrumb-item',
  headerForAOD: '#accordion-legacy-all-aerosol-optical-depth',
  correctedReflectanceCheckboxContainer: '#checkbox-case-MODIS_Aqua_CorrectedReflectance_TrueColor',
  correctedReflectanceChecked: '#checkbox-case-MODIS_Aqua_CorrectedReflectance_TrueColor .wv-checkbox.checked',
  weldReflectanceCheckboxContainer: '#checkbox-case-Landsat_WELD_CorrectedReflectance_TrueColor_Global_Monthly',
  weldUnavailableTooltipIcon: '#checkbox-case-Landsat_WELD_CorrectedReflectance_TrueColor_Global_Monthly #availability-info',
  unavailableFilterToggle: '.header-filter-container .react-switch-label',
  unavailableFilterTooltipIcon: '.header-filter-container #availability-filter',
  scienceDisciplinesTab: '#categories-nav .nav-item:nth-child(2)'
};

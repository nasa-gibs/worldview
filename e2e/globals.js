module.exports = {
  url: 'http://localhost:3000',
  selectors: {
    'info button': '.wv-layers-info',
    'options button': '.wv-layers-options',
    'info dialog': '[aria-describedby="wv-layers-info-dialog"]',
    'options dialog': '[aria-describedby="wv-layers-options-dialog"]',
    'layers search field': '#layers-search-input',
    'source info icon': '.layers-all-layer .fa-info-circle',
    'source metadata close button': '.source-metadata .metadata-more'
  },
  delay: 3000 // Acceptable delay in ms between performing actions and seeing results
};

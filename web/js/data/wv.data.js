var wv = wv || {};

wv.data = (function(self) {

  self.parse = function(state, errors, config) {
    if (state.dataDownload) {
      state.download = state.dataDownload;
      delete state.dataDownload;
    }
    var productId = state.download;
    if (productId) {
      if (!config.products[productId]) {
        delete state.download;
        errors.push({
          message: "No such product: " + productId
        });
      }
    }
  };

  return self;

})(wv.data || {});

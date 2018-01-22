import $ from 'jquery';
import lodashEach from 'lodash/each';
import lodashFind from 'lodash/find';
import util from '../util/util';
import { dataHandlerGetByName } from './handler';

export function dataModel(models, config) {
  var NO_PRODUCT_ID = '__NO_PRODUCT';
  var NO_PRODUCT = {
    name: 'Not available for download &nbsp;&nbsp;<span class=\'link\'>(?)</span>',
    notSelectable: true
  };

  var layersModel = models.layers;
  var queryExecuting = false;
  var nextQuery = null;

  var self = {};

  /**
   * Fired when the data download mode is activated.
   *
   * @event EVENT_ACTIVATE
   * @final
   */
  self.EVENT_ACTIVATE = 'activate';

  /**
   * Fired when the data download mode is deactivated.
   *
   * @event EVENT_ACTIVATE
   * @final
   */
  self.EVENT_DEACTIVATE = 'deactivate';

  self.EVENT_PRODUCT_SELECT = 'productSelect';
  self.EVENT_LAYER_UPDATE = 'layerUpdate';
  self.EVENT_QUERY = 'query';
  self.EVENT_QUERY_RESULTS = 'queryResults';
  self.EVENT_QUERY_CANCEL = 'queryCancel';
  self.EVENT_QUERY_ERROR = 'queryError';
  self.EVENT_QUERY_TIMEOUT = 'queryTimeout';
  self.EVENT_GRANULE_SELECT = 'granuleSelect';
  self.EVENT_GRANULE_UNSELECT = 'granuleUnselect';

  /**
   * Indicates if data download mode is active.
   *
   * @attribute active {boolean}
   * @default false
   * @readOnly
   */
  self.active = false;

  /**
   * Handler for events fired by this class.
   *
   * @attribute events {Events}
   * @readOnly
   * @type Events
   */
  self.events = util.events();

  self.selectedProduct = null;
  self.selectedGranules = {};
  self.prefer = 'science';

  self.granules = [];

  // FIXME: This is hackish at the moment, but bridges well from the older
  // code to the newer stuff
  self.layers = [];
  self.projection = null;
  self.crs = null;
  self.time = null;

  var init = function () {
    models.layers.events.on('change', updateLayers);
    models.proj.events.on('select', updateProjection);
    models.date.events.on('select', updateDate);
    updateLayers();
    updateProjection();
    updateDate();
  };

  /**
   * Activates data download mode. If the mode is already active, this method
   * does nothing.
   *
   * @method activate
   */
  self.activate = function (productName) {
    if (!self.active) {
      try {
        if (productName) {
          validateProduct(productName);
        }
        self.active = true;
        self.events.trigger(self.EVENT_ACTIVATE);
        if (productName) {
          self.selectProduct(productName);
        } else if (!self.selectedProduct) {
          self.selectProduct(findAvailableProduct());
        } else {
          self.events.trigger(self.EVENT_PRODUCT_SELECT,
            self.selectedProduct);
          query();
        }
      } catch (error) {
        self.active = false;
        self.selectedProduct = null;
        throw error;
      }
    }
  };

  /**
   * Deactivates data download mode. If the mode is not already active, this
   * method does nothing.
   *
   * @method deactivate
   */
  self.deactivate = function () {
    if (self.active) {
      self.active = false;
      self.events.trigger(self.EVENT_DEACTIVATE);
    }
  };

  /**
   * Toggles the current mode of data download. DeEVENT_ACTIVATEs if already
   * active. EVENT_ACTIVATEs if already inactive.
   *
   * @method toggleMode
   */
  self.toggleMode = function () {
    if (self.active) {
      self.deactivate();
    } else {
      self.activate();
    }
  };

  self.groupByProducts = function () {
    var products = {};
    $.each(self.layers, function (index, layer) {
      var productId = layer.product || NO_PRODUCT_ID;
      var product = config.products[productId] || NO_PRODUCT;
      if (!products[productId]) {
        products[productId] = {
          title: product.name,
          items: [],
          notSelectable: product.notSelectable
        };
      }
      products[productId].items.push({
        label: layer.name,
        sublabel: layer.description,
        value: layer.id,
        categories: {
          All: 1
        }
      });
    });

    // FIXME: This is a hack to force the not availables to the bottom
    // especially for IE9. This whole function needs clean up.
    var results = {};
    var none = products.__NO_PRODUCT;
    lodashEach(products, function (product, key) {
      if (key !== NO_PRODUCT_ID) {
        results[key] = product;
      }
    });
    if (none) {
      results[NO_PRODUCT_ID] = none;
    }
    return results;
  };

  self.getProductsString = function () {
    var parts = [];
    var products = self.groupByProducts();
    $.each(products, function (key, product) {
      var layers = [];
      $.each(product.items, function (index, item) {
        layers.push(item.value);
      });
      parts.push(key + ',' + layers.join(','));
    });
    return parts.join('~');
  };

  self.selectProduct = function (productName) {
    if (self.selectedProduct === productName) {
      return;
    }
    self.selectedProduct = productName;

    if (self.active) {
      self.events.trigger(self.EVENT_PRODUCT_SELECT, self.selectedProduct);
      if (productName) {
        query();
      }
    }
  };

  self.selectGranule = function (granule) {
    self.selectedGranules[granule.id] = granule;
    self.events.trigger(self.EVENT_GRANULE_SELECT, granule);
  };

  self.unselectGranule = function (granule) {
    if (self.selectedGranules[granule.id]) {
      delete self.selectedGranules[granule.id];
      self.events.trigger(self.EVENT_GRANULE_UNSELECT, granule);
    }
  };

  self.toggleGranule = function (granule) {
    if (self.isSelected(granule)) {
      self.unselectGranule(granule);
    } else {
      self.selectGranule(granule);
    }
  };

  self.isSelected = function (granule) {
    var selected = false;
    $.each(self.selectedGranules, function (index, selection) {
      if (granule.id === selection.id) {
        selected = true;
      }
    });
    return selected;
  };

  self.getSelectionSize = function () {
    var totalSize = 0;
    var sizeValid = true;
    $.each(self.selectedGranules, function (index, granule) {
      if (sizeValid && granule.granule_size) {
        totalSize += parseFloat(granule.granule_size);
      } else {
        sizeValid = false;
      }
    });
    if (sizeValid) {
      return totalSize;
    }
  };

  self.getSelectionCounts = function () {
    var counts = {};
    $.each(self.layers, function (index, layer) {
      if (layer.product) {
        counts[layer.product] = 0;
      }
    });
    $.each(self.selectedGranules, function (index, granule) {
      counts[granule.product]++;
    });
    return counts;
  };

  self.setPreference = function (preference) {
    self.prefer = preference;
    query();
  };

  self.save = function (state) {
    if (self.active) {
      state.download = self.selectedProduct;
    }
  };

  self.load = function (state, errors) {
    var productId = state.download;
    if (productId) {
      var found = lodashFind(models.layers.active, {
        product: productId
      });
      if (!found) {
        errors.push({
          message: 'No active layers match product: ' +
            productId
        });
      } else {
        models.wv.events.on('startup', function () {
          self.activate(productId);
        });
      }
    }
  };

  var query = function () {
    if (!self.active) {
      return;
    }
    if (!self.selectedProduct) {
      self.events.trigger(self.EVENT_QUERY_RESULTS, {
        meta: {},
        granules: []
      });
      return;
    }

    var productConfig = config.products[self.selectedProduct];
    if (!productConfig) {
      throw Error('Product not defined: ' + self.selectedProduct);
    }

    var handlerFactory = dataHandlerGetByName(productConfig.handler);
    var handler = handlerFactory(config, self);
    handler.events.on('query', function () {
      self.events.trigger(self.EVENT_QUERY);
    })
      .on('results', function (results) {
        queryExecuting = false;
        if (self.active && !nextQuery) {
          self.events.trigger(self.EVENT_QUERY_RESULTS, results);
        }
        if (nextQuery) {
          var q = nextQuery;
          nextQuery = null;
          executeQuery(q);
        }
      })
      .on('error', function (textStatus, errorThrown) {
        queryExecuting = false;
        if (self.active) {
          self.events.trigger(self.EVENT_QUERY_ERROR, textStatus,
            errorThrown);
        }
      })
      .on('timeout', function () {
        queryExecuting = false;
        if (self.active) {
          self.events.trigger(self.EVENT_QUERY_TIMEOUT);
        }
      });
    executeQuery(handler);
  };

  var executeQuery = function (handler) {
    if (!queryExecuting) {
      try {
        queryExecuting = true;
        handler.submit();
      } catch (error) {
        queryExecuting = false;
        throw error;
      }
    } else {
      nextQuery = handler;
    }
  };

  var updateLayers = function () {
    self.layers = [];
    var foundSelected = false;
    lodashEach(models.layers.get(), function (layer) {
      var id = layer.id;
      var names = models.layers.getTitles(layer.id);
      var layerName = names.title;
      var description = names.subtitle;
      var productName = layer.product;
      self.layers.push({
        id: id,
        name: layerName,
        description: description,
        product: productName
      });
      if (productName === self.selectedProduct) {
        foundSelected = true;
      }
    });
    if (!foundSelected) {
      self.selectProduct(null);
    }
    self.events.trigger(self.EVENT_LAYER_UPDATE);
    if (self.active && !foundSelected) {
      self.selectProduct(findAvailableProduct());
    }

    // If a layer was removed and the product no longer exists,
    // remove any selected items in that product
    // FIXME: This is a hack for now and should be cleaned up when
    // everything changes to models.
    var products = self.groupByProducts();
    lodashEach(self.selectedGranules, function (selected) {
      if (!products[selected.product] &&
        !productActive(selected.product)) {
        self.unselectGranule(selected);
      }
    });
  };

  var productActive = function (product) {
    var active = false;
    lodashEach(layersModel.active, function (layer) {
      if (layer.product === product) {
        active = true;
        return false;
      }
    });
    return active;
  };

  var updateProjectionInfo = function () {
    self.projection = models.proj.selected.id;
    self.crs = models.proj.selected.crs;
  };

  var updateProjection = function () {
    updateProjectionInfo();
    self.events.trigger('projectionUpdate');
    updateLayers();
    query();
  };
  // FIXME: This is a hack
  self.updateProjection = updateProjection;

  var updateDate = function () {
    self.time = models.date.selected;
    query();
  };

  var findAvailableProduct = function () {
    var foundProduct = null;
    var list = models.layers.get({
      flat: true
    });

    // Find the top most layer that has a product entry in CMR
    for (var i = list.length - 1; i >= 0; i--) {
      if (list[i].product) {
        foundProduct = list[i].product;
      }
    }
    return foundProduct;
  };

  var validateProduct = function (productName) {
    var found = false;
    $.each(self.layers, function (index, layer) {
      var layerProduct = layer.product;
      if (layerProduct === productName) {
        found = true;
        return false;
      }
    });
    if (!found) {
      throw Error('No layer displayed for product: ' + productName);
    }
  };

  init();
  return self;
};

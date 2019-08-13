import util from '../../util/util';
import { each as lodashEach } from 'lodash';
import { getTitles } from '../layers/selectors';
const NO_PRODUCT_ID = '__NO_PRODUCT';
const NO_PRODUCT = {
  name: "Not available for download &nbsp;&nbsp;<span class='link'>(?)</span>",
  notSelectable: true
};

// For each product displayed in the sidebar, gets the count of
// granules that have been selected by the user. Returns an object
// in the form of product_id = count.
export function getSelectionCounts(layers, selectedGranules) {
  var counts = {};
  for (const layer of layers) {
    if (layer.product) {
      const products = util.toArray(layer.product);
      for (const product of products) {
        counts[product] = 0;
      }
    }
  }
  for (const granule of Object.values(selectedGranules)) {
    counts[granule.product]++;
  }
  return counts;
}
export function getDataSelectionSize(selectedGranules) {
  var totalSize = 0;
  var sizeValid = true;
  lodashEach(selectedGranules, function(granule, key) {
    const size = granule.granule_size;
    if (sizeValid && size) {
      totalSize += parseFloat(size);
    } else {
      sizeValid = false;
    }
  });
  if (sizeValid) {
    return totalSize;
  }
  return sizeValid ? totalSize : 0;
}
export function groupByProducts(config, dataProducts) {
  let products = {};
  // If no products have been defined in the configuration, return
  // the empty object.
  if (!config.products) {
    return products;
  }
  for (let layer of dataProducts) {
    // If products is a list, use it. If a single item, convert to a list.
    // If no products are defined, add it to the no product group.
    let productIds = util.toArray(layer.product);
    if (productIds.length === 0) {
      productIds = [NO_PRODUCT_ID];
    }
    for (const productId of productIds) {
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
    }
  }

  // FIXME: This is a hack to force the not availables to the bottom
  // especially for IE9. This whole function needs clean up.
  var results = {};
  var none = products.__NO_PRODUCT;
  lodashEach(products, function(product, key) {
    if (key !== NO_PRODUCT_ID) {
      results[key] = product;
    }
  });
  if (none) {
    results[NO_PRODUCT_ID] = none;
  }
  return results;
}
export function doesSelectedExist(activeLayers, selectedId) {
  let exists = false;
  lodashEach(activeLayers, function(layer) {
    if (layer.product === selectedId) exists = true;
  });
  return exists;
}
export function getDataProductsFromActiveLayers(layers, config, projId) {
  const dataProducts = [];
  lodashEach(layers, function(layer) {
    var id = layer.id;
    var names = getTitles(config, layer.id, projId);
    var layerName = names.title;
    var description = names.subtitle;
    var productName = layer.product;
    dataProducts.push({
      id: id,
      name: layerName,
      description: description,
      product: productName
    });
  });
  var products = groupByProducts(config, dataProducts);
  return products;
}

export function findAvailableProduct(layers) {
  var foundProduct = null;

  // Find the top most layer that has a product entry in CMR
  for (var i = layers.length - 1; i >= 0; i--) {
    if (layers[i].product) {
      foundProduct = layers[i].product;
      // If the layer has more than one product, select the first.
      if (Array.isArray(foundProduct)) {
        foundProduct = foundProduct[0];
      }
    }
  }
  return foundProduct;
}

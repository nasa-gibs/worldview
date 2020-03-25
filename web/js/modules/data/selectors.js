/* eslint-disable no-restricted-syntax */
import { each as lodashEach } from 'lodash';
import util from '../../util/util';
import { getTitles } from '../layers/selectors';

const NO_PRODUCT_ID = '__NO_PRODUCT';
const NO_PRODUCT = {
  name: "Not available for download &nbsp;&nbsp;<span class='link'>(?)</span>",
  notSelectable: true,
};

// For each product displayed in the sidebar, gets the count of
// granules that have been selected by the user. Returns an object
// in the form of product_id = count.
export function getSelectionCounts(layers, selectedGranules) {
  const counts = {};
  for (const layer of layers) {
    if (layer.product) {
      const products = util.toArray(layer.product);
      for (const product of products) {
        counts[product] = 0;
      }
    }
  }
  for (const granule of Object.values(selectedGranules)) {
    counts[granule.product] += 1;
  }
  return counts;
}
export function getDataSelectionSize(selectedGranules) {
  let totalSize = 0;
  let sizeValid = true;
  lodashEach(selectedGranules, (granule, key) => {
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
  const products = {};
  // If no products have been defined in the configuration, return
  // the empty object.
  if (!config.products) {
    return products;
  }
  for (const layer of dataProducts) {
    // If products is a list, use it. If a single item, convert to a list.
    // If no products are defined, add it to the no product group.
    let productIds = util.toArray(layer.product);
    if (productIds.length === 0) {
      productIds = [NO_PRODUCT_ID];
    }
    for (const productId of productIds) {
      const product = config.products[productId] || NO_PRODUCT;
      if (!products[productId]) {
        products[productId] = {
          title: product.name,
          items: [],
          notSelectable: product.notSelectable,
        };
      }
      products[productId].items.push({
        label: layer.name,
        sublabel: layer.description,
        value: layer.id,
        categories: {
          All: 1,
        },
      });
    }
  }

  // FIXME: This is a hack to force the not availables to the bottom
  // especially for IE9. This whole function needs clean up.
  const results = {};
  const none = products.__NO_PRODUCT;
  lodashEach(products, (product, key) => {
    if (key !== NO_PRODUCT_ID) {
      results[key] = product;
    }
  });
  if (none) {
    results[NO_PRODUCT_ID] = none;
  }
  return results;
}
export function doesSelectedExist(products, selectedId) {
  let exists = false;
  lodashEach(products, (productItemArray) => {
    const id = productItemArray[0];
    if (id === selectedId) {
      exists = true;
      return false;
    }
  });
  return exists;
}
export function getDataProductsFromActiveLayers(layers, config, projId) {
  const dataProducts = [];
  lodashEach(layers, (layer) => {
    const { id } = layer;
    const names = getTitles(config, layer.id, projId);
    const layerName = names.title;
    const description = names.subtitle;
    const productName = layer.product;
    dataProducts.push({
      id,
      name: layerName,
      description,
      product: productName,
    });
  });
  const products = groupByProducts(config, dataProducts);
  return products;
}

export function findAvailableProduct(layers) {
  let foundProduct = null;

  // Find the top most layer that has a product entry in CMR
  for (let i = layers.length - 1; i >= 0; i -= 1) {
    if (layers[i].product) {
      foundProduct = layers[i].product;
      // If the layer has more than one product, select the first.
      if (Array.isArray(foundProduct)) {
        // eslint-disable-next-line prefer-destructuring
        foundProduct = foundProduct[0];
      }
    }
  }
  return foundProduct;
}

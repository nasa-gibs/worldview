import lodashSize from 'lodash/size';
import brand from '../brand';

export default (function() {
  const self = {};
  const configPromises = {};

  self.config = function(rootObj, attr, url) {
    const root = rootObj;
    let promise = Promise;

    // If a request is already outstanding, chain to that one
    if (configPromises[url]) {
      configPromises[url]
        .then(promise.resolve)
        .catch(promise.reject);
      return promise;
    }

    if (root[attr] && lodashSize(root[attr]) > 0) {
      return promise.resolve(root[attr]);
    }
    promise = fetch(brand.url(url))
      .then((response) => response.json())
      .then((result) => {
        root[attr] = result;
        return result;
      })
      .catch((err) => console.error(err))
      .finally(() => {
        delete configPromises[url];
      });

    configPromises[url] = promise;

    return promise;
  };

  return self;
}());

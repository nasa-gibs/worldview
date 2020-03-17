import lodashSize from 'lodash/size';
import wvui from '../ui/ui';
import brand from '../brand';

export default (function() {
  const self = {};
  const configPromises = {};
  let loading = 0;
  let indicatorTimeout = null;
  let indicatorId = null;

  self.config = function(root, attr, url) {
    let promise = $.Deferred();
    // If a request is already outstanding, chain to that one
    if (configPromises[url]) {
      configPromises[url].done(promise.resolve)
        .fail(promise.reject);
      return promise;
    }
    if (root[attr] && lodashSize(root[attr]) > 0) {
      promise.resolve(root[attr]);
    } else {
      loading += 1;
      promise = $.getJSON(brand.url(url));
      if (loading === 1) {
        indicatorTimeout = setTimeout(() => {
          indicatorId = wvui.indicator.loading();
        }, 2000);
      }
      promise.done((result) => {
        root[attr] = result;
      })
        .always(() => {
          delete configPromises[url];
          loading -= 1;
          if (loading === 0) {
            clearTimeout(indicatorTimeout);
            indicatorTimeout = null;
            if (indicatorId) wvui.indicator.hide(indicatorId);
          }
        })
        .fail(wvui.error);

      configPromises[url] = promise;
    }
    return promise;
  };

  return self;
}());

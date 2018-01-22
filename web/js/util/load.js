import $ from 'jquery';
import lodashSize from 'lodash/size';
import wvui from '../ui/ui';
import brand from '../brand';

export default (function () {
  var self = {};
  var configPromises = {};
  var loading = 0;
  var indicatorTimeout = null;
  var indicatorId = null;

  self.config = function (root, attr, url) {
    var promise = $.Deferred();
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
        indicatorTimeout = setTimeout(function () {
          indicatorId = wvui.indicator.loading();
        }, 2000);
      }
      promise.done(function (result) {
        root[attr] = result;
      })
        .always(function () {
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
})();

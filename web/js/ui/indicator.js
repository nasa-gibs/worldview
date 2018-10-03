import lodashUniqueId from 'lodash/uniqueId';
import lodashIsString from 'lodash/isString';
import lodashEach from 'lodash/each';
import lodashRemove from 'lodash/remove';
import lodashIsEmpty from 'lodash/isEmpty';
import lodashLast from 'lodash/last';

export default (function () {
  var self = {};

  var $indicator;
  var $icon;
  var $message;

  self.active = [];

  var init = function () {
    $indicator = $('<div></div>')
      .attr('id', 'indicator');
    $icon = $('<img />');
    $message = $('<span></span>');

    $indicator.append($icon)
      .append($message)
      .hide();
    $('body')
      .append($indicator);
  };

  self.show = function (message, icon) {
    self._show(message, icon);
    var id = lodashUniqueId();
    self.active.push({
      id: id,
      message: message,
      icon: icon
    });
    return id;
  };

  self.hide = function (hides) {
    if (lodashIsString(hides)) {
      hides = [hides];
    }
    lodashEach(hides, function (id) {
      lodashRemove(self.active, {
        id: id
      });
    });
    if (lodashIsEmpty(self.active)) {
      self._hide();
    } else {
      var def = lodashLast(self.active);
      self._show(def.message, def.icon);
    }
  };

  self.replace = function (hides, message, icon) {
    self.hide(hides);
    return self.show(message, icon);
  };

  self._show = function (message, icon) {
    if (!$indicator) {
      init();
    }
    if (icon) {
      $indicator.removeClass('message');
      $icon.attr('src', icon)
        .show();
    } else {
      $indicator.addClass('message');
      $icon.removeAttr('src')
        .hide();
    }
    $message.html(message);
    $indicator.show();
  };

  self._hide = function () {
    if ($indicator) {
      $indicator.hide();
    }
  };

  self.searching = function (hides) {
    if (hides) {
      self.hide(hides);
    }
    return self.show('Searching for Data', 'images/activity.gif');
  };

  self.loading = function (hides) {
    if (hides) {
      self.hide(hides);
    }
    return self.show('Loading', 'images/activity.gif');
  };

  self.noData = function (hides) {
    if (hides) {
      self.hide(hides);
    }
    return self.show('No Data Available', 'images/red-x.svg');
  };

  self.delayed = function (promise, delay) {
    delay = delay || 1000;
    var id;
    var timeout = setTimeout(function () {
      id = self.loading();
    }, delay);
    promise.always(function () {
      clearTimeout(timeout);
      if (id) {
        self.hide(id);
      }
    });
  };

  return self;
})();

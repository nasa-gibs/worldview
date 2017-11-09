import $ from 'jquery';
import loUniqueId from 'lodash/uniqueId';
import loIsString from 'lodash/isString';
import loEach from 'lodash/each';
import loRemove from 'lodash/remove';
import loIsEmpty from 'lodash/isEmpty';
import loLast from 'lodash/last';

export function loadingIndicator() {
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
    var id = loUniqueId();
    self.active.push({
      id: id,
      message: message,
      icon: icon
    });
    return id;
  };

  self.hide = function (hides) {
    if (loIsString(hides)) {
      hides = [hides];
    }
    loEach(hides, function (id) {
      loRemove(self.active, {
        id: id
      });
    });
    if (loIsEmpty(self.active)) {
      self._hide();
    } else {
      var def = loLast(self.active);
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
};

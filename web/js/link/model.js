import $ from 'jquery';
import lodashEach from 'lodash/each';
import lodashMap from 'lodash/map';
import lodashIsArray from 'lodash/isArray';
import lodashIsObject from 'lodash/isObject';
import util from '../util/util';
import Cache from 'cachai';

export function linkModel(config) {
  var self = {};
  var DEBUG_SHORTEN_LINK = 'http://go.nasa.gov/1iKIZ4j';
  var ENCODING_EXCEPTIONS = [
    {
      match: new RegExp('%2C', 'g'),
      replace: ','
    }, {
      match: new RegExp('%3B', 'g'),
      replace: ';'
    }, {
      match: new RegExp('%3D', 'g'),
      replace: '='
    }
  ];

  var shortenCache = new Cache(10);
  var mock = '';
  var components = [];

  self.events = util.events();

  var init = function () {
    if (config && config.parameters && config.parameters.shorten) {
      mock = '-' + config.parameters.shorten;
    }
  };

  self.register = function (component) {
    components.push(component);
    if (component.events) {
      component.events.any(function () {
        self.events.trigger('update');
      });
    }
    return self;
  };

  // Returns a serialized string containing information of the current session
  self.toQueryString = function () {
    var state = {};
    lodashEach(components, function (component) {
      component.save(state);
    });
    var strings = lodashMap(state, function (value, key) {
      if (lodashIsArray(value)) {
        var parts = [];
        lodashEach(value, function (item) {
          var part = '';
          if (lodashIsObject(item)) {
            part = item.id;
            if (item.attributes && item.attributes.length > 0) {
              var attributes = [];
              lodashEach(item.attributes, function (attribute) {
                if (attribute.value) {
                  attributes.push(attribute.id + '=' + attribute.value);
                } else {
                  attributes.push(attribute.id);
                }
              });
              part += '(' + attributes.join(',') + ')';
            }
          } else {
            part = item;
          }
          parts.push(part);
        });
        value = parts.join(',');
      }
      return key + '=' + encode(value);
    });
    return strings.join('&');
  };

  self.get = function () {
    var queryString = self.toQueryString();
    var url = window.location.href;
    var prefix = url.split('?')[0];
    prefix = (prefix !== null && prefix !== undefined) ? prefix : url;
    return prefix + '?' + queryString;
  };

  self.shorten = function (link) {
    if (!link) {
      link = self.get();
    }
    if (shortenCache[link]) {
      return $.Deferred().resolve(shortenCache[link]);
    }
    if (/localhost/.test(link)) {
      return $.Deferred().resolve({
        status_code: 200,
        data: {
          url: DEBUG_SHORTEN_LINK
        }
      });
    }
    var promise = $.getJSON('service/link/shorten.cgi' + mock + '?url=' + encodeURIComponent(link));
    promise.done(function (result) {
      shortenCache[link] = result;
    });
    return promise;
  };

  self.load = function (state, errors) {
    errors = errors || [];
    lodashEach(components, function (component) {
      component.load(state, errors);
    });
  };

  var encode = function (value) {
    var encoded = encodeURIComponent(value);
    lodashEach(ENCODING_EXCEPTIONS, function (exception) {
      encoded = encoded.replace(exception.match, exception.replace);
    });
    return encoded;
  };

  init();

  return self;
};

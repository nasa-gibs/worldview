import lodashEach from 'lodash/each';
import lodashMap from 'lodash/map';
import lodashIsArray from 'lodash/isArray';
import lodashIsObject from 'lodash/isObject';
import { assign, isEmpty, forOwn, keys as lodashKeys } from 'lodash';
import util from '../util/util';

export function linkModel(config) {
  var self = {};
  var ENCODING_EXCEPTIONS = [
    {
      match: new RegExp('%2C', 'g'),
      replace: ','
    },
    {
      match: new RegExp('%3B', 'g'),
      replace: ';'
    },
    {
      match: new RegExp('%3D', 'g'),
      replace: '='
    }
  ];
  var components = [];
  self.events = util.events();

  var init = function() {};

  self.register = function(component, key, dispatchLegacyUpdate, legacy) {
    components.push(component);
    if (component.events) {
      component.events.any(function() {
        // self.events.trigger('update');
      });
    }
    return self;
  };

  // Returns a serialized string containing information of the current session
  self.toQueryString = function() {
    var state = {};
    lodashEach(components, function(component) {
      component.save(state);
    });
    var strings = lodashMap(state, function(value, key) {
      if (lodashIsArray(value)) {
        var parts = [];
        lodashEach(value, function(item) {
          var part = '';
          if (lodashIsObject(item)) {
            part = item.id;
            if (item.attributes && item.attributes.length > 0) {
              var attributes = [];
              lodashEach(item.attributes, function(attribute) {
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

  // self.load = function(state, errors, dispatchLegacyUpdate, legacy) {
  //   errors = errors || [];
  //   console.log(components);
  //   lodashEach(components, function(component, i) {
  //     // component.load(state, errors);
  //     console.log(component);
  //     // if (!isEmpty(legacy[keys[i]])) {
  //     //   forOwn(legacy[keys[i]], (value, subKey) => {
  //     //     console.log(component[subKey], value);
  //     //     component[subKey] = value;
  //     //   });
  //     // }
  //   });
  // };

  var encode = function(value) {
    var encoded = encodeURIComponent(value);
    lodashEach(ENCODING_EXCEPTIONS, function(exception) {
      encoded = encoded.replace(exception.match, exception.replace);
    });
    return encoded;
  };

  init();

  return self;
}

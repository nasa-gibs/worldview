import lodashEach from 'lodash/each';
import lodashIsNaN from 'lodash/isNaN';
import lodashParseInt from 'lodash/parseInt';
import util from './util/util';

export var debug = (function() {
  var parameters = util.fromQueryString(location.search);
  var self = {};

  var init = function() {
    if (parameters.loadDelay) {
      var delay;
      try {
        delay = parseInt(parameters.loadDelay);
        self.loadDelay(delay);
      } catch (error) {
        console.warn('Invalid load delay: ' + delay);
      }
    }
  };

  var delayedCallback = function(jqXHR, wrap, delay) {
    return function(fn) {
      wrap(function() {
        var args = arguments;
        setTimeout(function() {
          if (fn) {
            fn.apply(jqXHR, args);
          }
        }, delay);
      });
      return jqXHR;
    };
  };

  self.loadDelay = function(delay) {
    var ajax = $.ajax;
    $.ajax = function() {
      var ajaxArgs = arguments;
      console.log('delay', delay, ajaxArgs);
      var jqXHR = ajax.apply($, arguments);

      var done = jqXHR.done;
      jqXHR.done = delayedCallback(jqXHR, done, delay);
      jqXHR.done(function() {
        console.log('done', ajaxArgs);
      });

      var fail = jqXHR.fail;
      jqXHR.fail = delayedCallback(jqXHR, fail, delay);
      jqXHR.fail(function() {
        console.log('fail', ajaxArgs);
      });

      var always = jqXHR.always;
      jqXHR.always = delayedCallback(jqXHR, always, delay);

      return jqXHR;
    };
  };

  init();
  return self;
})();

export function debugConfig(config) {
  if (config.parameters.debug === 'tiles') {
    var tileSize = lodashParseInt(config.parameters.tileSize);
    if (lodashIsNaN(tileSize)) {
      throw new Error('No tileSize specified');
    }
    console.log('Debugging tiles with size', tileSize);
    config.layers.debug_tile = {
      id: 'debug_tile',
      title: 'Debug Tiles',
      subtitle: 'Worldview',
      tags: 'debug',
      group: 'overlays',
      format: 'image/svg',
      type: 'wmts',
      noTransition: 'true',
      projections: {}
    };
    lodashEach(config.projections, function(proj) {
      config.layers.debug_tile.projections[proj.id] = {
        source: 'debug_tile',
        matrixSet: tileSize
      };
    });
    config.sources.debug_tile = {
      url: 'service/debug_tile.cgi',
      matrixSets: {}
    };
    config.sources.debug_tile.matrixSets[tileSize] = {
      id: tileSize,
      tileSize: [tileSize, tileSize]
    };
    config.layerOrder.push('debug_tile');
    config.defaults.startingLayers.push({
      id: 'debug_tile'
    });
  }
}

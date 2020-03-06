import lodashEach from 'lodash/each';
import lodashIsNaN from 'lodash/isNaN';
import lodashParseInt from 'lodash/parseInt';
import util from './util/util';

export const debug = (function() {
  const parameters = util.fromQueryString(location.search);
  const self = {};

  const init = function() {
    if (parameters.loadDelay) {
      let delay;
      try {
        delay = parseInt(parameters.loadDelay, 10);
        self.loadDelay(delay);
      } catch (error) {
        console.warn(`Invalid load delay: ${delay}`);
      }
    }
  };

  const delayedCallback = function(jqXHR, wrap, delay) {
    return function(fn) {
      wrap(function() {
        const args = arguments;
        setTimeout(() => {
          if (fn) {
            fn.apply(jqXHR, args);
          }
        }, delay);
      });
      return jqXHR;
    };
  };

  self.loadDelay = function(delay) {
    const { ajax } = $;
    $.ajax = function() {
      const ajaxArgs = arguments;
      console.log('delay', delay, ajaxArgs);
      const jqXHR = ajax.apply($, arguments);

      const { done } = jqXHR;
      jqXHR.done = delayedCallback(jqXHR, done, delay);
      jqXHR.done(() => {
        console.log('done', ajaxArgs);
      });

      const { fail } = jqXHR;
      jqXHR.fail = delayedCallback(jqXHR, fail, delay);
      jqXHR.fail(() => {
        console.log('fail', ajaxArgs);
      });

      const { always } = jqXHR;
      jqXHR.always = delayedCallback(jqXHR, always, delay);

      return jqXHR;
    };
  };

  init();
  return self;
}());

export function debugConfig(config) {
  if (config.parameters.debug === 'tiles') {
    const tileSize = lodashParseInt(config.parameters.tileSize);
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
      projections: {},
    };
    lodashEach(config.projections, (proj) => {
      config.layers.debug_tile.projections[proj.id] = {
        source: 'debug_tile',
        matrixSet: tileSize,
      };
    });
    config.sources.debug_tile = {
      url: 'service/debug_tile.cgi',
      matrixSets: {},
    };
    config.sources.debug_tile.matrixSets[tileSize] = {
      id: tileSize,
      tileSize: [tileSize, tileSize],
    };
    config.layerOrder.push('debug_tile');
    config.defaults.startingLayers.push({
      id: 'debug_tile',
    });
  }
}

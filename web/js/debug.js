import lodashEach from 'lodash/each';
import lodashIsNaN from 'lodash/isNaN';
import lodashParseInt from 'lodash/parseInt';

// eslint-disable-next-line import/prefer-default-export
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

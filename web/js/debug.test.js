import { debugConfig } from './debug';

describe('debugConfig', () => {
  const makeConfig = (overrides = {}) => ({
    parameters: { debug: 'tiles', tileSize: '256', ...overrides.parameters },
    layers: {},
    projections: {
      geo: { id: 'geo' },
      arctic: { id: 'arctic' },
    },
    sources: {},
    layerOrder: [],
    defaults: { startingLayers: [] },
    ...overrides,
  });

  it('does nothing when debug is not "tiles"', () => {
    const config = makeConfig({ parameters: { debug: 'other' } });
    debugConfig(config);
    expect(config.layers.debug_tile).toBeUndefined();
  });

  it('throws when tileSize is not specified', () => {
    const config = makeConfig({ parameters: { debug: 'tiles', tileSize: 'abc' } });
    expect(() => debugConfig(config)).toThrow('No tileSize specified');
  });

  it('throws when tileSize is missing', () => {
    const config = makeConfig({ parameters: { debug: 'tiles' } });
    expect(() => debugConfig(config)).toThrow('No tileSize specified');
  });

  it('logs tileSize to console', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const config = makeConfig();
    debugConfig(config);
    expect(consoleSpy).toHaveBeenCalledWith('Debugging tiles with size', 256);
    consoleSpy.mockRestore();
  });

  it('adds debug_tile layer to config.layers', () => {
    const config = makeConfig();
    debugConfig(config);
    expect(config.layers.debug_tile).toBeDefined();
  });

  it('sets correct debug_tile layer properties', () => {
    const config = makeConfig();
    debugConfig(config);
    expect(config.layers.debug_tile).toMatchObject({
      id: 'debug_tile',
      title: 'Debug Tiles',
      subtitle: 'Worldview',
      tags: 'debug',
      group: 'overlays',
      format: 'image/svg',
      type: 'wmts',
      noTransition: 'true',
    });
  });

  it('adds projections for each config projection', () => {
    const config = makeConfig();
    debugConfig(config);
    expect(config.layers.debug_tile.projections.geo).toEqual({ source: 'debug_tile', matrixSet: 256 });
    expect(config.layers.debug_tile.projections.arctic).toEqual({ source: 'debug_tile', matrixSet: 256 });
  });

  it('adds debug_tile source with correct url', () => {
    const config = makeConfig();
    debugConfig(config);
    expect(config.sources.debug_tile.url).toBe('service/debug_tile.cgi');
  });

  it('adds matrixSet to debug_tile source', () => {
    const config = makeConfig();
    debugConfig(config);
    expect(config.sources.debug_tile.matrixSets[256]).toEqual({
      id: 256,
      tileSize: [256, 256],
    });
  });

  it('pushes debug_tile to layerOrder', () => {
    const config = makeConfig();
    debugConfig(config);
    expect(config.layerOrder).toContain('debug_tile');
  });

  it('pushes debug_tile to defaults.startingLayers', () => {
    const config = makeConfig();
    debugConfig(config);
    expect(config.defaults.startingLayers).toContainEqual({ id: 'debug_tile' });
  });

  it('handles config with no projections', () => {
    const config = makeConfig({ projections: {} });
    debugConfig(config);
    expect(config.layers.debug_tile.projections).toEqual({});
  });

  it('parses tileSize string to integer', () => {
    const config = makeConfig({ parameters: { debug: 'tiles', tileSize: '512' } });
    debugConfig(config);
    expect(config.sources.debug_tile.matrixSets[512]).toBeDefined();
  });
});

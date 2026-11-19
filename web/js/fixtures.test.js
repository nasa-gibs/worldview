import fixtures, { registerProjections } from './fixtures';

jest.mock('proj4', () => {
  const defs = jest.fn();
  return { defs, default: { defs } };
});

jest.mock('ol/proj/proj4', () => ({
  register: jest.fn(),
}));

jest.mock('cachai', () => jest.fn().mockImplementation(() => ({})));

jest.mock('./modules/layers/reducers', () => ({
  initialState: { active: [] },
}));
jest.mock('./modules/compare/reducers', () => ({
  initialCompareState: { active: false },
}));
jest.mock('./modules/charting/reducers', () => ({
  initialChartingState: { active: false },
}));
jest.mock('./modules/date/reducers', () => ({
  getInitialState: jest.fn(() => ({ selected: new Date() })),
}));
jest.mock('./modules/animation/reducers', () => ({
  defaultState: { isActive: false },
}));
jest.mock('./modules/alerts/reducer', () => ({
  defaultAlertState: { alerts: [] },
}));
jest.mock('./modules/natural-events/reducers', () => ({
  getInitialEventsState: jest.fn(() => ({ events: [] })),
}));
jest.mock('./modules/sidebar/reducers', () => ({
  sidebarState: { activeTab: 'layers' },
}));
jest.mock('./modules/ui/reducers', () => ({
  uiState: { isLoading: false },
}));
jest.mock('./util/util', () => ({
  now: jest.fn(() => new Date('2020-01-01T00:00:00Z')),
}));

import proj4 from 'proj4';
import { register } from 'ol/proj/proj4';

describe('fixtures', () => {
  describe('color fixtures', () => {
    it('has red color', () => {
      expect(fixtures.red).toBe('ff0000ff');
    });

    it('has green color', () => {
      expect(fixtures.green).toBe('00ff00ff');
    });

    it('has blue color', () => {
      expect(fixtures.blue).toBe('0000ffff');
    });

    it('has yellow color', () => {
      expect(fixtures.yellow).toBe('ffff00ff');
    });

    it('has light_red color', () => {
      expect(fixtures.light_red).toBe('fff0f0ff');
    });

    it('has dark_red color', () => {
      expect(fixtures.dark_red).toBe('400000ff');
    });

    it('has light_blue color', () => {
      expect(fixtures.light_blue).toBe('f0f0ffff');
    });

    it('has dark_blue color', () => {
      expect(fixtures.dark_blue).toBe('000040');
    });
  });

  describe('fixtures.config', () => {
    let config;

    beforeEach(() => {
      config = fixtures.config();
    });

    it('returns a config object', () => {
      expect(config).toBeDefined();
    });

    it('has pageLoadTime', () => {
      expect(config.pageLoadTime).toBeDefined();
    });

    it('has initialDate', () => {
      expect(config.initialDate).toBeDefined();
    });

    it('has now', () => {
      expect(config.now).toBeDefined();
    });

    it('has defaults with projection', () => {
      expect(config.defaults.projection).toBe('geographic');
    });

    it('has defaults.startingLayers', () => {
      expect(config.defaults.startingLayers).toHaveLength(3);
    });

    it('includes terra-aod in startingLayers', () => {
      expect(config.defaults.startingLayers).toContainEqual({ id: 'terra-aod' });
    });

    it('includes terra-cr in startingLayers', () => {
      expect(config.defaults.startingLayers).toContainEqual({ id: 'terra-cr' });
    });

    it('includes aqua-cr in startingLayers', () => {
      expect(config.defaults.startingLayers).toContainEqual({ id: 'aqua-cr', hidden: 'true' });
    });

    it('has geographic projection', () => {
      expect(config.projections.geographic).toBeDefined();
      expect(config.projections.geographic.crs).toBe('EPSG:4326');
    });

    it('has arctic projection', () => {
      expect(config.projections.arctic).toBeDefined();
      expect(config.projections.arctic.crs).toBe('EPSG:3413');
    });

    it('has antarctic projection', () => {
      expect(config.projections.antarctic).toBeDefined();
      expect(config.projections.antarctic.crs).toBe('EPSG:3031');
    });

    it('has layers defined', () => {
      expect(config.layers).toBeDefined();
    });

    it('has terra-cr layer', () => {
      expect(config.layers['terra-cr']).toBeDefined();
      expect(config.layers['terra-cr'].group).toBe('baselayers');
    });

    it('has aqua-cr layer', () => {
      expect(config.layers['aqua-cr']).toBeDefined();
    });

    it('has terra-aod layer', () => {
      expect(config.layers['terra-aod']).toBeDefined();
      expect(config.layers['terra-aod'].group).toBe('overlays');
    });

    it('has aqua-aod layer', () => {
      expect(config.layers['aqua-aod']).toBeDefined();
    });

    it('has combo-aod layer', () => {
      expect(config.layers['combo-aod']).toBeDefined();
    });

    it('has mask layer', () => {
      expect(config.layers.mask).toBeDefined();
    });

    it('has granule-cr layer', () => {
      expect(config.layers['granule-cr']).toBeDefined();
    });

    it('has OrbitTracks_Aqua_Ascending layer', () => {
      expect(config.layers.OrbitTracks_Aqua_Ascending).toBeDefined();
      expect(config.layers.OrbitTracks_Aqua_Ascending.type).toBe('vector');
    });

    it('has AMSRE layer', () => {
      expect(config.layers.AMSRE_Brightness_Temp_89H_Night).toBeDefined();
    });

    it('has MODIS_Combined_L4_LAI_4Day layer', () => {
      expect(config.layers.MODIS_Combined_L4_LAI_4Day).toBeDefined();
    });

    it('has sources defined', () => {
      expect(config.sources).toBeDefined();
    });

    it('has GIBS geographic nrt source', () => {
      expect(config.sources['GIBS:geographic:nrt']).toBeDefined();
    });

    it('has naturalEvents with categories', () => {
      expect(config.naturalEvents.categories).toHaveLength(3);
    });

    it('has features.compare enabled', () => {
      expect(config.features.compare).toBe(true);
    });

    it('has features.naturalEvents.host', () => {
      expect(config.features.naturalEvents.host).toBe('fake.eonet.url/api');
    });

    it('has features.cmr.url', () => {
      expect(config.features.cmr.url).toBe('mock.cmr.api/');
    });

    it('has palettes.rendered with terra-aod', () => {
      expect(config.palettes.rendered['terra-aod']).toBeDefined();
    });

    it('has palettes.rendered with aqua-aod', () => {
      expect(config.palettes.rendered['aqua-aod']).toBeDefined();
    });

    it('has palettes.custom with blue-1', () => {
      expect(config.palettes.custom['blue-1']).toBeDefined();
    });

    it('has palettes.custom with red-1', () => {
      expect(config.palettes.custom['red-1']).toBeDefined();
    });

    it('has palettes.lookups for terra-aod', () => {
      expect(config.palettes.lookups['terra-aod']).toBeDefined();
    });

    it('has vectorData.OrbitTracks', () => {
      expect(config.vectorData.OrbitTracks).toBeDefined();
    });

    it('has vectorStyles.OrbitTracks_Aura_Ascending', () => {
      expect(config.vectorStyles.OrbitTracks_Aura_Ascending).toBeDefined();
    });

    it('terra-aod palette references correct colors', () => {
      const maps = config.palettes.rendered['terra-aod'].maps[0];
      expect(maps.entries.colors).toContain(fixtures.green);
      expect(maps.entries.colors).toContain(fixtures.yellow);
      expect(maps.entries.colors).toContain(fixtures.red);
    });
  });

  describe('fixtures.getState', () => {
    let state;

    beforeEach(() => {
      state = fixtures.getState();
    });

    it('returns a state object', () => {
      expect(state).toBeDefined();
    });

    it('has compare state', () => {
      expect(state.compare).toBeDefined();
    });

    it('has charting state', () => {
      expect(state.charting).toBeDefined();
    });

    it('has config in state', () => {
      expect(state.config).toBeDefined();
    });

    it('has layers state', () => {
      expect(state.layers).toBeDefined();
    });

    it('has alerts state', () => {
      expect(state.alerts).toBeDefined();
    });

    it('has date state', () => {
      expect(state.date).toBeDefined();
    });

    it('has events state', () => {
      expect(state.events).toBeDefined();
    });

    it('has map state', () => {
      expect(state.map).toBeDefined();
    });

    it('has animation state', () => {
      expect(state.animation).toBeDefined();
    });

    it('has sidebar state', () => {
      expect(state.sidebar).toBeDefined();
    });

    it('has ui state', () => {
      expect(state.ui).toBeDefined();
    });

    it('has proj state with geographic selected', () => {
      expect(state.proj.selected.id).toBe('geographic');
      expect(state.proj.selected.crs).toBe('EPSG:4326');
    });

    it('has proj.selected.maxExtent', () => {
      expect(state.proj.selected.maxExtent).toEqual([-180, -90, 180, 90]);
    });

    it('has palettes.active', () => {
      expect(state.palettes.active).toBeDefined();
    });

    it('has palettes.activeB', () => {
      expect(state.palettes.activeB).toBeDefined();
    });

    it('has palettes.rendered with terra-aod', () => {
      expect(state.palettes.rendered['terra-aod']).toBeDefined();
    });

    it('has palettes.rendered with aqua-aod', () => {
      expect(state.palettes.rendered['aqua-aod']).toBeDefined();
    });

    it('has palettes.custom with blue-1', () => {
      expect(state.palettes.custom['blue-1']).toBeDefined();
    });

    it('has palettes.custom with red-1', () => {
      expect(state.palettes.custom['red-1']).toBeDefined();
    });

    it('has vectorStyles.custom', () => {
      expect(state.vectorStyles.custom).toBeDefined();
    });

    it('has vectorStyles.custom.OrbitTracks_Aura_Ascending', () => {
      expect(state.vectorStyles.custom.OrbitTracks_Aura_Ascending).toBeDefined();
    });
  });

  describe('fixtures.map', () => {
    it('returns a map object', () => {
      expect(fixtures.map()).toBeDefined();
    });

    it('has ui.selected', () => {
      expect(fixtures.map().ui.selected).toBeDefined();
    });

    it('getView returns an object with calculateExtent', () => {
      const view = fixtures.map().ui.selected.getView();
      expect(typeof view.calculateExtent).toBe('function');
    });

    it('calculateExtent returns expected extent', () => {
      const view = fixtures.map().ui.selected.getView();
      expect(view.calculateExtent()).toEqual([-15.06, 27.16, 13.32, 56.06]);
    });
  });

  describe('fixtures.cache', () => {
    it('is defined', () => {
      expect(fixtures.cache).toBeDefined();
    });
  });
});

describe('registerProjections', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers EPSG:3413', () => {
    registerProjections();
    expect(proj4.defs).toHaveBeenCalledWith(
      'EPSG:3413',
      expect.stringContaining('+proj=stere'),
    );
  });

  it('registers EPSG:3031', () => {
    registerProjections();
    expect(proj4.defs).toHaveBeenCalledWith(
      'EPSG:3031',
      expect.stringContaining('+proj=stere'),
    );
  });

  it('calls register with proj4', () => {
    registerProjections();
    expect(register).toHaveBeenCalledWith(proj4);
  });

  it('registers EPSG:3413 with correct lat_0', () => {
    registerProjections();
    expect(proj4.defs).toHaveBeenCalledWith(
      'EPSG:3413',
      expect.stringContaining('+lat_0=90'),
    );
  });

  it('registers EPSG:3031 with correct lat_0', () => {
    registerProjections();
    expect(proj4.defs).toHaveBeenCalledWith(
      'EPSG:3031',
      expect.stringContaining('+lat_0=-90'),
    );
  });

  it('calls proj4.defs twice', () => {
    registerProjections();
    expect(proj4.defs).toHaveBeenCalledTimes(2);
  });
});

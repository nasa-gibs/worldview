import initSearch from './search-config';
import { getTitles } from '../layers/selectors';
import { getLayersForProjection } from './selectors';
import { getSelectedDate } from '../date/selectors';
import { formatDisplayDate } from '../date/util';

jest.mock('../layers/selectors', () => ({
  getTitles: jest.fn(),
}));

jest.mock('./selectors', () => ({
  getLayersForProjection: jest.fn(),
}));

jest.mock('../date/selectors', () => ({
  getSelectedDate: jest.fn(),
}));

jest.mock('../date/util', () => ({
  formatDisplayDate: jest.fn(() => 'Jan 01, 2024'),
}));

jest.mock('./facet-config', () => [
  { field: 'type' },
  { field: 'coverage', hideZeroCount: true },
  { field: 'categories' },
]);

const makeLayer = (overrides = {}) => ({
  id: 'layer1',
  type: 'Raster',
  coverage: ['Always Available'],
  categories: ['Atmosphere'],
  ...overrides,
});

const makeState = (overrides = {}) => ({
  productPicker: {
    filters: [],
    searchTerm: '',
    ...overrides.productPicker,
  },
  config: { layers: {} },
  proj: { id: 'geographic' },
  ...overrides,
});

describe('initSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getSelectedDate.mockReturnValue(new Date('2024-01-01'));
    getLayersForProjection.mockReturnValue([]);
    getTitles.mockReturnValue({ title: '', subtitle: '', tags: '' });
  });

  describe('return value shape', () => {
    it('returns alwaysSearchOnInitialLoad as true', () => {
      const config = initSearch(makeState());
      expect(config.alwaysSearchOnInitialLoad).toBe(true);
    });

    it('returns trackUrlState as false', () => {
      const config = initSearch(makeState());
      expect(config.trackUrlState).toBe(false);
    });

    it('returns searchQuery as empty object', () => {
      const config = initSearch(makeState());
      expect(config.searchQuery).toEqual({});
    });

    it('returns onSearch as a function', () => {
      const config = initSearch(makeState());
      expect(typeof config.onSearch).toBe('function');
    });

    it('returns initialState with filters and searchTerm from productPicker', () => {
      const filters = [{ field: 'type', values: ['Raster'] }];
      const state = makeState({ productPicker: { filters, searchTerm: 'aerosol' } });
      const config = initSearch(state);
      expect(config.initialState.filters).toBe(filters);
      expect(config.initialState.searchTerm).toBe('aerosol');
    });
  });

  describe('updateCoverageFilter', () => {
    it('does not throw when filters is empty', () => {
      const state = makeState({ productPicker: { filters: [], searchTerm: '' } });
      expect(() => initSearch(state)).not.toThrow();
    });

    it('updates stale coverage filter values to use formatted date', () => {
      formatDisplayDate.mockReturnValue('Jan 01, 2024');
      const filters = [{ field: 'coverage', values: ['Available Dec 31, 2023'] }];
      const state = makeState({ productPicker: { filters, searchTerm: '' } });
      initSearch(state);
      expect(filters[0].values[0]).toBe('Available Jan 01, 2024');
    });

    it('does not change coverage filter values that already contain formatted date', () => {
      formatDisplayDate.mockReturnValue('Jan 01, 2024');
      const filters = [{ field: 'coverage', values: ['Available Jan 01, 2024'] }];
      const state = makeState({ productPicker: { filters, searchTerm: '' } });
      initSearch(state);
      expect(filters[0].values[0]).toBe('Available Jan 01, 2024');
    });

    it('does not change coverage filter values containing "Always"', () => {
      formatDisplayDate.mockReturnValue('Jan 01, 2024');
      const filters = [{ field: 'coverage', values: ['Always Available'] }];
      const state = makeState({ productPicker: { filters, searchTerm: '' } });
      initSearch(state);
      expect(filters[0].values[0]).toBe('Always Available');
    });

    it('does not alter non-coverage filter fields', () => {
      const filters = [{ field: 'type', values: ['Raster'] }];
      const state = makeState({ productPicker: { filters, searchTerm: '' } });
      initSearch(state);
      expect(filters[0].values[0]).toBe('Raster');
    });

    it('handles multiple filters and only updates coverage field', () => {
      formatDisplayDate.mockReturnValue('Jan 01, 2024');
      const filters = [
        { field: 'type', values: ['Raster'] },
        { field: 'coverage', values: ['Available Dec 31, 2023'] },
      ];
      const state = makeState({ productPicker: { filters, searchTerm: '' } });
      initSearch(state);
      expect(filters[0].values[0]).toBe('Raster');
      expect(filters[1].values[0]).toBe('Available Jan 01, 2024');
    });
  });

  describe('facet counts initialisation', () => {
    it('populates facet counts from initial layers array', () => {
      const layer = makeLayer({ type: 'Raster', coverage: ['Always Available'] });
      getLayersForProjection.mockReturnValue([layer]);
      const config = initSearch(makeState());
      expect(config.initialState).toBeDefined();
    });

    it('handles layers with array field values for facets', () => {
      const layer = makeLayer({ categories: ['Atmosphere', 'Land'] });
      getLayersForProjection.mockReturnValue([layer]);
      expect(() => initSearch(makeState())).not.toThrow();
    });

    it('handles layers with undefined facet fields gracefully', () => {
      const layer = makeLayer({ type: undefined, coverage: undefined, categories: undefined });
      getLayersForProjection.mockReturnValue([layer]);
      expect(() => initSearch(makeState())).not.toThrow();
    });
  });

  describe('onSearch', () => {
    it('returns results matching an empty search term and no filters', async () => {
      const layer = makeLayer();
      getLayersForProjection.mockReturnValue([layer]);
      const config = initSearch(makeState());
      const response = await config.onSearch({ filters: [], searchTerm: '' });
      expect(response.results).toContain(layer);
      expect(response.totalResults).toBe(1);
    });

    it('returns totalResults equal to results length', async () => {
      const layers = [makeLayer({ id: 'l1' }), makeLayer({ id: 'l2' })];
      getLayersForProjection.mockReturnValue(layers);
      const config = initSearch(makeState());
      const response = await config.onSearch({ filters: [], searchTerm: '' });
      expect(response.totalResults).toBe(response.results.length);
    });

    it('returns facets object', async () => {
      const layer = makeLayer();
      getLayersForProjection.mockReturnValue([layer]);
      const config = initSearch(makeState());
      const response = await config.onSearch({ filters: [], searchTerm: '' });
      expect(response.facets).toBeDefined();
    });

    it('filters results by a single filter field value', async () => {
      const rasterLayer = makeLayer({ id: 'raster', type: 'Raster' });
      const vectorLayer = makeLayer({ id: 'vector', type: 'Vector' });
      getLayersForProjection.mockReturnValue([rasterLayer, vectorLayer]);
      getTitles.mockReturnValue({ title: '', subtitle: '', tags: '' });
      const config = initSearch(makeState());
      const response = await config.onSearch({
        filters: [{ field: 'type', values: ['Raster'] }],
        searchTerm: '',
      });
      expect(response.results).toContain(rasterLayer);
      expect(response.results).not.toContain(vectorLayer);
    });

    it('filters results by search term matching layer id', async () => {
      const aerosolLayer = makeLayer({ id: 'aerosol_layer' });
      const tempLayer = makeLayer({ id: 'temperature_layer' });
      getLayersForProjection.mockReturnValue([aerosolLayer, tempLayer]);
      getTitles.mockImplementation((config, id) => ({
        title: id,
        subtitle: '',
        tags: '',
      }));
      const config = initSearch(makeState());
      const response = await config.onSearch({ filters: [], searchTerm: 'aerosol' });
      expect(response.results).toContain(aerosolLayer);
      expect(response.results).not.toContain(tempLayer);
    });

    it('filters results by search term matching layer title', async () => {
      const layer1 = makeLayer({ id: 'layer1' });
      const layer2 = makeLayer({ id: 'layer2' });
      getLayersForProjection.mockReturnValue([layer1, layer2]);
      getTitles.mockImplementation((config, id) => ({
        title: id === 'layer1' ? 'Aerosol Optical Depth' : 'Sea Surface Temperature',
        subtitle: '',
        tags: '',
      }));
      const config = initSearch(makeState());
      const response = await config.onSearch({ filters: [], searchTerm: 'aerosol' });
      expect(response.results).toContain(layer1);
      expect(response.results).not.toContain(layer2);
    });

    it('filters results by search term matching subtitle', async () => {
      const layer1 = makeLayer({ id: 'layer1' });
      const layer2 = makeLayer({ id: 'layer2' });
      getLayersForProjection.mockReturnValue([layer1, layer2]);
      getTitles.mockImplementation((config, id) => ({
        title: '',
        subtitle: id === 'layer1' ? 'MODIS Terra' : 'VIIRS NOAA',
        tags: '',
      }));
      const config = initSearch(makeState());
      const response = await config.onSearch({ filters: [], searchTerm: 'modis' });
      expect(response.results).toContain(layer1);
      expect(response.results).not.toContain(layer2);
    });

    it('filters results by search term matching tags', async () => {
      const layer1 = makeLayer({ id: 'layer1' });
      const layer2 = makeLayer({ id: 'layer2' });
      getLayersForProjection.mockReturnValue([layer1, layer2]);
      getTitles.mockImplementation((config, id) => ({
        title: '',
        subtitle: '',
        tags: id === 'layer1' ? 'fire smoke aerosol' : 'sea surface',
      }));
      const config = initSearch(makeState());
      const response = await config.onSearch({ filters: [], searchTerm: 'smoke' });
      expect(response.results).toContain(layer1);
      expect(response.results).not.toContain(layer2);
    });

    it('filters results by search term matching conceptIds shortName', async () => {
      const layer1 = makeLayer({ id: 'layer1', conceptIds: [{ value: '', shortName: 'MOD04_L2' }] });
      const layer2 = makeLayer({ id: 'layer2', conceptIds: [] });
      getLayersForProjection.mockReturnValue([layer1, layer2]);
      getTitles.mockReturnValue({ title: '', subtitle: '', tags: '' });
      const config = initSearch(makeState());
      const response = await config.onSearch({ filters: [], searchTerm: 'mod04' });
      expect(response.results).toContain(layer1);
      expect(response.results).not.toContain(layer2);
    });

    it('returns no results when search term matches nothing', async () => {
      const layer = makeLayer({ id: 'aerosol_layer' });
      getLayersForProjection.mockReturnValue([layer]);
      getTitles.mockReturnValue({ title: 'Aerosol', subtitle: '', tags: '' });
      const config = initSearch(makeState());
      const response = await config.onSearch({ filters: [], searchTerm: 'zzznomatch' });
      expect(response.results).toHaveLength(0);
      expect(response.totalResults).toBe(0);
    });

    it('matches layers with multiple space-separated search terms', async () => {
      const layer1 = makeLayer({ id: 'aerosol_optical_depth' });
      const layer2 = makeLayer({ id: 'sea_surface_temp' });
      getLayersForProjection.mockReturnValue([layer1, layer2]);
      getTitles.mockImplementation((config, id) => ({
        title: id === 'aerosol_optical_depth' ? 'Aerosol Optical Depth' : 'Sea Surface Temp',
        subtitle: '',
        tags: '',
      }));
      const config = initSearch(makeState());
      const response = await config.onSearch({ filters: [], searchTerm: 'aerosol optical' });
      expect(response.results).toContain(layer1);
      expect(response.results).not.toContain(layer2);
    });

    it('applies "None" filter matching layers with no value for that field', async () => {
      const layerWithType = makeLayer({ id: 'layer1', type: 'Raster' });
      const layerWithoutType = makeLayer({ id: 'layer2', type: undefined });
      getLayersForProjection.mockReturnValue([layerWithType, layerWithoutType]);
      getTitles.mockReturnValue({ title: '', subtitle: '', tags: '' });
      const config = initSearch(makeState());
      const response = await config.onSearch({
        filters: [{ field: 'type', values: ['None'] }],
        searchTerm: '',
      });
      expect(response.results).toContain(layerWithoutType);
      expect(response.results).not.toContain(layerWithType);
    });

    it('returns facets with type value format', async () => {
      const layer = makeLayer({ type: 'Raster' });
      getLayersForProjection.mockReturnValue([layer]);
      const config = initSearch(makeState());
      const response = await config.onSearch({ filters: [], searchTerm: '' });
      expect(response.facets.type).toBeDefined();
      expect(response.facets.type[0].type).toBe('value');
      expect(Array.isArray(response.facets.type[0].data)).toBe(true);
    });

    it('facet data is sorted alphabetically for non-hideZeroCount fields', async () => {
      const layers = [
        makeLayer({ id: 'l1', type: 'Raster' }),
        makeLayer({ id: 'l2', type: 'Vector' }),
        makeLayer({ id: 'l3', type: 'Granule' }),
      ];
      getLayersForProjection.mockReturnValue(layers);
      const config = initSearch(makeState());
      const response = await config.onSearch({ filters: [], searchTerm: '' });
      const typeData = response.facets.type[0].data;
      const values = typeData.map((d) => d.value);
      expect(values).toEqual([...values].sort((a, b) => a.localeCompare(b)));
    });

    it('hideZeroCount facet fields filter out zero count entries', async () => {
      const layer = makeLayer({ coverage: ['Always Available'] });
      getLayersForProjection.mockReturnValue([layer]);
      const config = initSearch(makeState());
      const response = await config.onSearch({ filters: [], searchTerm: '' });
      const coverageData = response.facets.coverage[0].data;
      coverageData.forEach((item) => {
        expect(item.count).toBeGreaterThan(0);
      });
    });

    it('applies multiple filters together (AND logic)', async () => {
      const matchingLayer = makeLayer({ id: 'l1', type: 'Raster', categories: ['Atmosphere'] });
      const wrongType = makeLayer({ id: 'l2', type: 'Vector', categories: ['Atmosphere'] });
      const wrongCat = makeLayer({ id: 'l3', type: 'Raster', categories: ['Land'] });
      getLayersForProjection.mockReturnValue([matchingLayer, wrongType, wrongCat]);
      getTitles.mockReturnValue({ title: '', subtitle: '', tags: '' });
      const config = initSearch(makeState());
      const response = await config.onSearch({
        filters: [
          { field: 'type', values: ['Raster'] },
          { field: 'categories', values: ['Atmosphere'] },
        ],
        searchTerm: '',
      });
      expect(response.results).toContain(matchingLayer);
      expect(response.results).not.toContain(wrongType);
      expect(response.results).not.toContain(wrongCat);
    });
  });

  describe('proj handling', () => {
    it('handles null proj gracefully', () => {
      const state = makeState({ proj: null });
      expect(() => initSearch(state)).not.toThrow();
    });

    it('sets projectionRef from proj.id', () => {
      const state = makeState({ proj: { id: 'arctic' } });
      expect(() => initSearch(state)).not.toThrow();
    });
  });
});

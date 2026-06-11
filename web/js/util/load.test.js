import lodashSize from 'lodash/size';
import config from './load';
import brand from '../brand';

jest.mock('../brand', () => ({
  url: jest.fn((url) => `https://example.com${url}`),
}));

jest.mock('lodash/size', () => jest.fn());

const mockFetch = jest.fn();
global.fetch = mockFetch;

function mockFetchSuccess(data) {
  mockFetch.mockResolvedValueOnce({
    json: jest.fn().mockResolvedValueOnce(data),
  });
}

function mockFetchFailure(error) {
  mockFetch.mockRejectedValueOnce(error);
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
});

describe('config()', () => {
  describe('when root[attr] already has data', () => {
    it('returns a resolved promise with existing data', async () => {
      lodashSize.mockReturnValue(2);
      const root = { layers: ['a', 'b'] };
      const result = await config.config(root, 'layers', '/layers.json');
      expect(result).toEqual(['a', 'b']);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('does not fetch when root[attr] has size > 0', () => {
      lodashSize.mockReturnValue(1);
      const root = { settings: { key: 'value' } };
      config.config(root, 'settings', '/settings.json');
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('when root[attr] is empty or missing', () => {
    it('fetches from brand.url(url)', async () => {
      lodashSize.mockReturnValue(0);
      mockFetchSuccess({ data: 'fetched' });
      const root = {};
      await config.config(root, 'data', '/data.json');
      expect(brand.url).toHaveBeenCalledWith('/data.json');
      expect(mockFetch).toHaveBeenCalledWith('https://example.com/data.json');
    });

    it('stores the fetched result on root[attr]', async () => {
      lodashSize.mockReturnValue(0);
      const fetchedData = { key: 'value' };
      mockFetchSuccess(fetchedData);
      const root = {};
      await config.config(root, 'myAttr', '/my.json');
      expect(root.myAttr).toEqual(fetchedData);
    });

    it('returns the fetched result', async () => {
      lodashSize.mockReturnValue(0);
      const fetchedData = [1, 2, 3];
      mockFetchSuccess(fetchedData);
      const root = {};
      const result = await config.config(root, 'items', '/items.json');
      expect(result).toEqual(fetchedData);
    });

    it('logs error and does not throw when fetch fails', async () => {
      lodashSize.mockReturnValue(0);
      const error = new Error('Network error');
      mockFetchFailure(error);
      const root = {};
      await config.config(root, 'data', '/fail.json');
      expect(console.error).toHaveBeenCalledWith(error);
    });

    it('removes the url from configPromises after fetch resolves', async () => {
      lodashSize.mockReturnValue(0);
      mockFetchSuccess({ done: true });
      const root = {};
      await config.config(root, 'data', '/cleanup.json');

      lodashSize.mockReturnValue(0);
      mockFetchSuccess({ done: true });
      await config.config(root, 'data', '/cleanup.json');

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('removes the url from configPromises after fetch fails', async () => {
      lodashSize.mockReturnValue(0);
      mockFetchFailure(new Error('fail'));
      const root = {};
      await config.config(root, 'data', '/fail-cleanup.json');

      lodashSize.mockReturnValue(0);
      mockFetchSuccess({ recovered: true });
      const result = await config.config(root, 'data', '/fail-cleanup.json');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ recovered: true });
    });
  });

  describe('brand.url integration', () => {
    it('calls brand.url with the provided url', async () => {
      lodashSize.mockReturnValue(0);
      mockFetchSuccess({});
      const root = {};
      await config.config(root, 'attr', '/path/to/resource.json');
      expect(brand.url).toHaveBeenCalledWith('/path/to/resource.json');
    });
  });
});

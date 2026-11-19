import {
  fetchGranuleDateRanges,
  invalidateGranuleDateRanges,
  resetGranuleDateRangesCacheForTest,
} from './granule-date-ranges-service';

// Override jsdom-worker's global Worker with a stub we can drive from
// the test, so we don't actually run the real worker source (which would
// hit the network).
const makeMockWorker = () => {
  const instances = [];
  const Ctor = function MockWorker(scriptUrl) {
    this.scriptUrl = scriptUrl;
    this.postMessage = jest.fn();
    this.terminate = jest.fn();
    this.onmessage = null;
    this.onerror = null;
    this.reply = (data) => this.onmessage && this.onmessage({ data });
    this.fireError = (err) => this.onerror && this.onerror(err);
    instances.push(this);
  };
  Ctor.instances = instances;
  return Ctor;
};

let originalWorker;
let warnSpy;

beforeEach(() => {
  originalWorker = global.Worker;
  global.Worker = makeMockWorker();
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  resetGranuleDateRangesCacheForTest();
});

afterEach(() => {
  global.Worker = originalWorker;
  warnSpy.mockRestore();
});

describe('granuleDateRangesService', () => {
  describe('layer-type detection', () => {
    test('resolves [] for layers with no availability config', async () => {
      const def = { id: 'plain-wmts-layer' };
      const result = await fetchGranuleDateRanges(def, { crs: 'EPSG:4326' });
      expect(result).toEqual([]);
      expect(global.Worker.instances).toHaveLength(0);
    });

    test('resolves [] for falsy def or missing id', async () => {
      expect(await fetchGranuleDateRanges(undefined, {})).toEqual([]);
      expect(await fetchGranuleDateRanges({}, {})).toEqual([]);
      expect(global.Worker.instances).toHaveLength(0);
    });
  });

  describe('cmr worker path', () => {
    test('spawns cmr.worker.js for cmrAvailability layers', async () => {
      const def = { id: 'cmr-layer', cmrAvailability: true };
      const promise = fetchGranuleDateRanges(def, { crs: 'EPSG:4326' });

      expect(global.Worker.instances).toHaveLength(1);
      const worker = global.Worker.instances[0];
      expect(worker.scriptUrl).toBe('js/workers/cmr.worker.js');
      expect(worker.postMessage).toHaveBeenCalledWith({
        operation: 'getLayerGranuleRanges',
        args: [def],
      });

      const ranges = [['2026-01-01T00:00:00Z', '2026-01-02T00:00:00Z']];
      worker.reply(ranges);

      await expect(promise).resolves.toEqual(ranges);
      expect(worker.terminate).toHaveBeenCalled();
    });

    test('spawns cmr.worker.js for dataAvailability:cmr layers', async () => {
      const def = { id: 'cmr-layer-2', dataAvailability: 'cmr' };
      const promise = fetchGranuleDateRanges(def, { crs: 'EPSG:4326' });

      expect(global.Worker.instances).toHaveLength(1);
      expect(global.Worker.instances[0].scriptUrl).toBe('js/workers/cmr.worker.js');

      global.Worker.instances[0].reply([]);
      await expect(promise).resolves.toEqual([]);
    });

    test('resolves [] when cmr worker errors', async () => {
      const def = { id: 'cmr-broken', cmrAvailability: true };
      const promise = fetchGranuleDateRanges(def, { crs: 'EPSG:4326' });

      const worker = global.Worker.instances[0];
      worker.fireError(new Error('worker boom'));

      await expect(promise).resolves.toEqual([]);
      expect(worker.terminate).toHaveBeenCalled();
    });

    test('resolves [] when cmr worker returns falsy', async () => {
      const def = { id: 'cmr-empty', cmrAvailability: true };
      const promise = fetchGranuleDateRanges(def, { crs: 'EPSG:4326' });
      global.Worker.instances[0].reply(undefined);
      await expect(promise).resolves.toEqual([]);
    });
  });

  describe('describe-domains worker path', () => {
    const ddOpts = {
      crs: 'EPSG:4326',
      describeDomainsUrl: 'https://gibs.test',
    };

    test('spawns describe-domains.worker.js with correct params', async () => {
      const def = {
        id: 'dd-layer',
        dataAvailability: 'dd',
        startDate: '2026-01-01T00:00:00Z',
        endDate: '2026-01-10T00:00:00Z',
      };
      const promise = fetchGranuleDateRanges(def, ddOpts);

      expect(global.Worker.instances).toHaveLength(1);
      const worker = global.Worker.instances[0];
      expect(worker.scriptUrl).toBe('js/workers/describe-domains.worker.js');
      expect(worker.postMessage).toHaveBeenCalledWith({
        operation: 'requestDescribeDomains',
        args: [{
          startDate: new Date(def.startDate).toISOString(),
          endDate: new Date(def.endDate).toISOString(),
          id: def.id,
          proj: 'EPSG:4326',
          baseUrl: 'https://gibs.test',
        }],
      });

      const ranges = [['2026-01-01T00:00:00Z', '2026-01-10T00:00:00Z']];
      worker.reply(ranges);
      await expect(promise).resolves.toEqual(ranges);
      expect(worker.terminate).toHaveBeenCalled();
    });

    test('handles two-step XML parse + merge protocol', async () => {
      const def = {
        id: 'dd-two-step',
        dataAvailability: 'dd',
        startDate: '2026-01-01T00:00:00Z',
      };
      const promise = fetchGranuleDateRanges(def, ddOpts);
      const worker = global.Worker.instances[0];

      // Step 1: raw XML in.
      const xml = '<Foo><Domain>2026-01-01T00:00:00Z/2026-01-02T00:00:00Z/PT6M</Domain></Foo>';
      worker.reply(xml);

      expect(worker.postMessage).toHaveBeenLastCalledWith({
        operation: 'mergeDomains',
        args: ['2026-01-01T00:00:00Z/2026-01-02T00:00:00Z/PT6M', 60000],
      });

      // Step 2: merged ranges back.
      const ranges = [['2026-01-01T00:00:00Z', '2026-01-02T00:00:00Z']];
      worker.reply(ranges);

      await expect(promise).resolves.toEqual(ranges);
      expect(worker.terminate).toHaveBeenCalled();
    });

    test('resolves [] when XML has no <Domain> element', async () => {
      const def = { id: 'dd-no-domain', dataAvailability: 'dd', startDate: '2026-01-01T00:00:00Z' };
      const promise = fetchGranuleDateRanges(def, ddOpts);
      const worker = global.Worker.instances[0];

      worker.reply('<Foo><Bar/></Foo>');

      await expect(promise).resolves.toEqual([]);
      expect(worker.terminate).toHaveBeenCalled();
    });

    test('resolves [] when dd worker errors', async () => {
      const def = { id: 'dd-broken', dataAvailability: 'dd', startDate: '2026-01-01T00:00:00Z' };
      const promise = fetchGranuleDateRanges(def, ddOpts);
      global.Worker.instances[0].fireError(new Error('dd boom'));
      await expect(promise).resolves.toEqual([]);
    });

    test('uses now as endDate when def.endDate is missing', async () => {
      const def = { id: 'dd-rolling', dataAvailability: 'dd', startDate: '2026-01-01T00:00:00Z' };
      fetchGranuleDateRanges(def, ddOpts);

      const args = global.Worker.instances[0].postMessage.mock.calls[0][0].args[0];
      expect(args.endDate).toBeDefined();
      expect(typeof args.endDate).toBe('string');
      expect(new Date(args.endDate).getTime()).toBeGreaterThan(Date.now() - 5000);
    });
  });

  describe('memoization', () => {
    test('concurrent calls for the same layer share one worker', async () => {
      const def = { id: 'memo-layer', cmrAvailability: true };

      const p1 = fetchGranuleDateRanges(def, {});
      const p2 = fetchGranuleDateRanges(def, {});
      const p3 = fetchGranuleDateRanges(def, {});

      expect(global.Worker.instances).toHaveLength(1);
      expect(p1).toBe(p2);
      expect(p2).toBe(p3);

      const ranges = [['2026-01-01T00:00:00Z', '2026-01-02T00:00:00Z']];
      global.Worker.instances[0].reply(ranges);

      await expect(p1).resolves.toEqual(ranges);
      await expect(p2).resolves.toEqual(ranges);
    });

    test('subsequent calls after resolve do not spawn a new worker', async () => {
      const def = { id: 'memo-layer-2', cmrAvailability: true };

      const p1 = fetchGranuleDateRanges(def, {});
      const ranges = [['2026-01-01T00:00:00Z', '2026-01-02T00:00:00Z']];
      global.Worker.instances[0].reply(ranges);
      await p1;

      const p2 = fetchGranuleDateRanges(def, {});
      expect(global.Worker.instances).toHaveLength(1);
      await expect(p2).resolves.toEqual(ranges);
    });

    test('memoization is keyed per layer id', async () => {
      const defA = { id: 'layer-a', cmrAvailability: true };
      const defB = { id: 'layer-b', cmrAvailability: true };

      fetchGranuleDateRanges(defA, {});
      fetchGranuleDateRanges(defB, {});

      expect(global.Worker.instances).toHaveLength(2);
    });

    test('error result is evicted so the next call can retry', async () => {
      const def = { id: 'memo-error', cmrAvailability: true };

      const p1 = fetchGranuleDateRanges(def, {});
      global.Worker.instances[0].fireError(new Error('boom'));
      await p1;

      const p2 = fetchGranuleDateRanges(def, {});
      expect(global.Worker.instances).toHaveLength(2);
      global.Worker.instances[1].reply([['2026-01-01T00:00:00Z', '2026-01-02T00:00:00Z']]);
      await expect(p2).resolves.toEqual([['2026-01-01T00:00:00Z', '2026-01-02T00:00:00Z']]);
    });
  });

  describe('invalidateGranuleDateRanges', () => {
    test('drops the cached promise so the next call respawns', async () => {
      const def = { id: 'invalidatable', cmrAvailability: true };

      const p1 = fetchGranuleDateRanges(def, {});
      global.Worker.instances[0].reply([['2026-01-01T00:00:00Z', '2026-01-02T00:00:00Z']]);
      await p1;

      invalidateGranuleDateRanges(def.id);

      fetchGranuleDateRanges(def, {});
      expect(global.Worker.instances).toHaveLength(2);
    });
  });
});

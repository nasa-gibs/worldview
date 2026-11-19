// Fetches granule date ranges using a web worker (cmr or describe-domains
// depending on the layer config). Results are cached per layer id. The dd
// worker needs a two-step exchange since DOMParser doesn't exist in workers.
// Returns [] on error.

const inFlight = new Map();

const buildCmrPromise = (def) => new Promise((resolve) => {
  const worker = new Worker('js/workers/cmr.worker.js');
  worker.onmessage = (event) => {
    worker.terminate();
    resolve(event.data || []);
  };
  worker.onerror = (e) => {
    console.warn(`granule-date-ranges-service: cmr worker failed for ${def.id}`, e);
    worker.terminate();
    resolve([]);
  };
  worker.postMessage({ operation: 'getLayerGranuleRanges', args: [def] });
});

const buildDdPromise = (def, {
  crs, describeDomainsUrl, selectedDate,
}) => new Promise((resolve) => {
  const worker = new Worker('js/workers/describe-domains.worker.js');
  worker.onmessage = (event) => {
    if (Array.isArray(event.data)) {
      worker.terminate();
      resolve(event.data);
      return;
    }
    // Worker posted raw XML; parse on main thread and post back for merge.
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(event.data, 'text/xml');
      const domains = xmlDoc.querySelector('Domain')?.textContent;
      if (!domains) {
        worker.terminate();
        resolve([]);
        return;
      }
      worker.postMessage({ operation: 'mergeDomains', args: [domains, 60_000] });
    } catch (e) {
      console.warn(`granule-date-ranges-service: failed to parse describeDomains XML for ${def.id}`, e);
      worker.terminate();
      resolve([]);
    }
  };
  worker.onerror = (e) => {
    console.warn(`granule-date-ranges-service: dd worker failed for ${def.id}`, e);
    worker.terminate();
    resolve([]);
  };
  // Query ±1 day around the selected date rather than the full layer history.
  // Fewer domains means better merging and much faster responses.
  const layerStart = new Date(def.startDate);
  const layerEnd = def.endDate ? new Date(def.endDate) : new Date();
  let startDate;
  let endDate;
  if (selectedDate) {
    const sel = new Date(selectedDate);
    const dayMs = 86_400_000;
    startDate = new Date(Math.max(sel.getTime() - dayMs, layerStart.getTime())).toISOString();
    endDate = new Date(Math.min(sel.getTime() + dayMs, layerEnd.getTime())).toISOString();
  } else {
    startDate = layerStart.toISOString();
    endDate = layerEnd.toISOString();
  }
  const params = {
    startDate,
    endDate,
    id: def.id,
    proj: crs,
    baseUrl: describeDomainsUrl,
  };
  worker.postMessage({ operation: 'requestDescribeDomains', args: [params] });
});

export function fetchGranuleDateRanges(def, opts = {}) {
  if (!def?.id) return Promise.resolve([]);

  const isCmr = def.cmrAvailability || def.dataAvailability === 'cmr';
  const isDd = def.dataAvailability === 'dd';
  if (!isCmr && !isDd) return Promise.resolve([]);

  // dd layers are date-dependent, so include the date in the cache key.
  const dateKey = isDd && opts.selectedDate
    ? new Date(opts.selectedDate).toISOString()
      .slice(0, 10)
    : '';
  const cacheKey = `${def.id}:${dateKey}`;

  const cached = inFlight.get(cacheKey);
  if (cached) return cached;

  const promise = (isCmr
    ? buildCmrPromise(def)
    : buildDdPromise(def, opts)
  ).then((result) => {
    // Evict empty results so the next call can retry.
    if (!result || result.length === 0) {
      inFlight.delete(cacheKey);
    }
    return result;
  });

  inFlight.set(cacheKey, promise);
  return promise;
}

// Clear cached results so the next call re-fetches (e.g. NRT rolling window).
export function invalidateGranuleDateRanges(layerId) {
  for (const key of inFlight.keys()) {
    if (key === layerId || key.startsWith(`${layerId}:`)) {
      inFlight.delete(key);
    }
  }
}

// Test-only.
export function resetGranuleDateRangesCacheForTest() {
  inFlight.clear();
}

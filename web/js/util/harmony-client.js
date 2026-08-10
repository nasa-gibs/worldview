/**
 * Harmony API client and flow-layer utilities for Worldview.
 *
 * Token management:
 *   Call  window.setHarmonyToken("eyJ...")  in the browser console to
 *   authenticate with Earthdata (SIT/UAT) for on-demand Harmony data.
 *   The token is persisted in sessionStorage for the duration of the tab.
 *   Clear it with  window.setHarmonyToken(null).
 */

const TOKEN_KEY = 'worldview_harmony_bearer_token';
let harmonyToken = null;

/* eslint-disable no-restricted-globals */
function loadToken() {
  if (harmonyToken !== null) return harmonyToken;
  try { harmonyToken = sessionStorage.getItem(TOKEN_KEY) || null; } catch {}
  return harmonyToken;
}

export function setHarmonyToken(token) {
  harmonyToken = token ? token.trim() : null;
  try {
    if (harmonyToken) sessionStorage.setItem(TOKEN_KEY, harmonyToken);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {}
}
/* eslint-enable no-restricted-globals */

export function getHarmonyToken() { return loadToken(); }
export function hasHarmonyToken() { return !!loadToken(); }

function headers(json = true) {
  const h = {};
  if (json) h.Accept = 'application/json';
  const t = loadToken();
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
}

// ---------------------------------------------------------------------------
// Harmony OGC-Coverages API helpers
// ---------------------------------------------------------------------------

/**
 * Submit an async Harmony request and return the jobID.
 * @param {string} baseUrl   e.g. "https://harmony.sit.earthdata.nasa.gov"
 * @param {string} collectionId  CMR concept ID
 * @param {string} shortname     collection shortname, used to build granuleName
 * @param {string} dateStr       "YYYY-MM-DD"
 * @param {string[]} variables   e.g. ["u","v"]
 * @returns {Promise<string>} jobID
 */
export async function submitHarmonyRequest(baseUrl, collectionId, shortname, dateStr, variables) {
  const dateCompact = dateStr.replace(/-/g, '');
  const granuleName = `${shortname}_${dateCompact}`;

  const url = new URL(
    `${baseUrl}/${collectionId}/ogc-api-coverages/1.0.0/collections/parameter_vars/coverage/rangeset`,
  );
  url.searchParams.set('forceAsync', 'true');
  url.searchParams.set('granuleName', granuleName);
  url.searchParams.set('format', 'image/png');
  variables.forEach((v) => url.searchParams.append('variable', v));

  const res = await fetch(url.toString(), { method: 'GET', headers: headers() });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Harmony request failed: ${res.status} — ${body}`);
  }
  const data = await res.json();
  return data.jobID;
}

/**
 * Poll a Harmony job until it succeeds or fails.
 * @param {string} baseUrl
 * @param {string} jobId
 * @param {Function} [onProgress]  (progress: number, message: string) => void
 * @returns {Promise<{pngUrl: string, worldFileUrl: string|undefined}>}
 */
export async function pollHarmonyJob(baseUrl, jobId, onProgress) {
  const statusUrl = `${baseUrl}/jobs/${jobId}`;
  while (true) {
    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
    const res = await fetch(statusUrl, { headers: headers() });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Job status check failed: ${res.status} — ${body}`);
    }
    const job = await res.json();
    if (onProgress && job.progress !== undefined) onProgress(job.progress, job.message || '');
    if (job.status === 'successful') {
      const pngLink = job.links?.find(
        (l) => l.rel === 'data' && (l.type === 'image/png' || l.href.endsWith('.png')),
      );
      if (!pngLink) throw new Error('No PNG output found in Harmony job results');
      const pgwLink = job.links?.find(
        (l) => l.rel === 'data' && (l.href.endsWith('.pgw') || l.href.endsWith('.wld')),
      );
      return { pngUrl: pngLink.href, worldFileUrl: pgwLink?.href };
    }
    if (job.status === 'failed' || job.status === 'canceled') {
      throw new Error(`Job ${job.status}: ${job.message || 'Unknown error'}`);
    }
  }
}

/**
 * Submit + poll a Harmony request, returning the PNG URL and lon0 from
 * the accompanying world file (.pgw).
 * @returns {Promise<{pngUrl: string, lon0: number}>}
 */
export async function generateHarmonyTexture(
  baseUrl, collectionId, shortname, dateStr, variables, onProgress,
) {
  if (onProgress) onProgress(0, 'Submitting request...');
  const jobId = await submitHarmonyRequest(baseUrl, collectionId, shortname, dateStr, variables);
  if (onProgress) onProgress(10, `Job submitted: ${jobId}`);

  const { pngUrl, worldFileUrl } = await pollHarmonyJob(baseUrl, jobId, (p, m) => {
    if (onProgress) onProgress(10 + p * 0.9, m || `Processing... ${Math.round(p)}%`);
  });

  let lon0 = 0;
  if (worldFileUrl) {
    try {
      const wfRes = await fetch(worldFileUrl, { headers: headers(false) });
      if (wfRes.ok) {
        const lines = (await wfRes.text())
          .trim()
          .split(/\r?\n/)
          .map(Number);
        if (lines.length >= 5 && isFinite(lines[4])) lon0 = lines[4];
      }
    } catch {}
  }
  return { pngUrl, lon0 };
}

// ---------------------------------------------------------------------------
// Image loading + tile building
// ---------------------------------------------------------------------------

/**
 * Fetch a PNG (local path or remote URL with optional Bearer auth) and
 * decode it into raw RGBA pixel data.
 * @param {string} src    URL or absolute path served by Worldview's Express
 * @param {number} [lon0] centre longitude of pixel 0 (from world file)
 * @returns {Promise<{data: Uint8ClampedArray, width: number, height: number, lon0: number}>}
 */
export async function loadFlowImageData(src, lon0 = 0) {
  let imageSrc = src;
  if (src.startsWith('http')) {
    const t = loadToken();
    const res = await fetch(src, { headers: t ? { Authorization: `Bearer ${t}` } : {} });
    if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`);
    const blob = await res.blob();
    imageSrc = URL.createObjectURL(blob);
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Could not get 2D canvas context')); return; }
      ctx.drawImage(img, 0, 0);
      resolve({
        data: ctx.getImageData(0, 0, img.width, img.height).data,
        width: img.width,
        height: img.height,
        lon0,
      });
      if (imageSrc !== src) URL.revokeObjectURL(imageSrc);
    };
    img.onerror = () => reject(new Error(`Failed to load flow image: ${src}`));
    img.src = imageSrc;
  });
}

/**
 * Build a Float32Array tile of (u, v, 0) current values by bilinearly
 * interpolating from the decoded source image.
 *
 * @param {number} z
 * @param {number} x
 * @param {number} y
 * @param {{data: Uint8ClampedArray, width: number, height: number, lon0: number}} imageData
 * @param {import('ol/tilegrid/TileGrid').default} dataTileGrid
 * @param {import('ol/proj/Projection').default} dataTileProjection
 * @param {number} minU
 * @param {number} maxU
 * @param {number} minV
 * @param {number} maxV
 * @param {Function} [wrapXFn]  ol/tilegrid wrapX helper
 * @returns {Float32Array}
 */
export function buildFlowTile(
  z, x, y, imageData, dataTileGrid, dataTileProjection,
  minU, maxU, minV, maxV, wrapXFn,
) {
  const { data: src, width: W, height: H, lon0 } = imageData;
  const TILE = 256;
  const BANDS = 3;
  const SRC_BANDS = 4;
  const dU = maxU - minU;
  const dV = maxV - minV;

  let tileCoord = [z, x, y];
  if (wrapXFn) tileCoord = wrapXFn(dataTileGrid, tileCoord, dataTileProjection);

  const extent = dataTileGrid.getTileCoordExtent(tileCoord);
  const res = dataTileGrid.getResolution(z);
  const out = new Float32Array(TILE * TILE * BANDS);

  for (let row = 0; row < TILE; row++) {
    let offset = row * TILE * BANDS;
    const lat = extent[3] - row * res;
    for (let col = 0; col < TILE; col++) {
      const rawLon = extent[0] + col * res;
      const lon360 = ((rawLon % 360) + 360) % 360;
      const dPX = 360 / W;
      const dPY = 180 / H;
      const adjLon = ((lon360 - lon0) % 360 + 360) % 360;
      const xPos = adjLon / dPX;
      const yPos = (90 - lat) / dPY;

      let x1 = Math.floor(xPos);
      let x2 = Math.ceil(xPos);
      const xA = xPos - x1;
      if (x1 < 0) x1 += W;
      if (x2 >= W) x2 -= W;

      let y1 = Math.floor(yPos);
      let y2 = Math.ceil(yPos);
      const yA = yPos - y1;
      if (y1 < 0) y1 = 0;
      if (y2 >= H) y2 = H - 1;

      const i11 = (y1 * W + x1) * SRC_BANDS;
      const i21 = (y1 * W + x2) * SRC_BANDS;
      const i12 = (y2 * W + x1) * SRC_BANDS;
      const i22 = (y2 * W + x2) * SRC_BANDS;

      const bilerp = (c) =>
        (1 - xA) * (1 - yA) * src[c] +
        xA * (1 - yA) * src[c + (i21 - i11)] +
        (1 - xA) * yA * src[c + (i12 - i11)] +
        xA * yA * src[c + (i22 - i11)];

      out[offset] = minU + (dU * bilerp(i11)) / 255;
      out[offset + 1] = minV + (dV * bilerp(i11 + 1)) / 255;
      offset += BANDS;
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Expose token setter globally for console-based use
// ---------------------------------------------------------------------------
if (typeof window !== 'undefined') {
  window.setHarmonyToken = setHarmonyToken;
}

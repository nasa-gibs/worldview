const fs = require('fs')
const path = require('path')
const yargs = require('yargs')
const { hideBin } = require('yargs/helpers')
const console = require('console')
const convert = require('xml-js')
const { processTemporalLayer } = require('./processTemporalLayer')

const prog = path.basename(__filename)

const options = yargs(hideBin(process.argv))
  .usage('Usage: $0 [options]')
  .option('config', {
    demandOption: true,
    alias: 'c',
    type: 'string',
    description: 'config file'
  })
  .option('inputDir', {
    demandOption: true,
    alias: 'i',
    type: 'string',
    description: 'getcapabilities input directory'
  })
  .option('outputDir', {
    demandOption: true,
    alias: 'o',
    type: 'string',
    description: 'wmts output directory'
  })
  .option('mode', {
    demandOption: true,
    alias: 'm',
    type: 'string',
    description: 'mode'
  })
  .option('cacheMode', {
    demandOption: false,
    alias: 'cm',
    type: 'string',
    description: 'Cache mode for fetching data'
  })
  .epilog('Extracts configuration information from a WMTS GetCapabilities file, converts the XML to JSON')

const { argv } = options
if (!argv.config && !argv.inputDir && !argv.outputDir) {
  throw new Error('Invalid number of arguments')
}

const configFile = argv.config
const config = JSON.parse(fs.readFileSync(configFile, 'utf-8'))
const inputDir = argv.inputDir
const outputDir = argv.outputDir
const mode = argv.mode
const cacheMode = argv.cacheMode

if (!Object.prototype.hasOwnProperty.call(config, 'wv-options-wmts')) {
  throw new Error(`${prog}: Error: "wv-options-wmts" not in config file`)
}

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir)
}

const tolerant = config.tolerant
const entries = config['wv-options-wmts']
const skipSet = new Set(config.skip || [])
const skipPalettesSet = new Set(Object.keys(config.skipPalettes || {}))

let totalLayerCount = 0
let totalWarningCount = 0
let totalErrorCount = 0

// Concurrency + caching utilities
const layerConcurrency = parseInt(process.env.LAYER_CONCURRENCY || '8', 10)
// Keep a stable reference to the real fetch to avoid recursion
const nativeFetch = globalThis.fetch ? globalThis.fetch.bind(globalThis) : undefined
// Cache fetched text, not Response, to avoid body reuse problems
const describeDomainsTextCache = new Map()

// Progress tracking
const isTTY = process.stderr.isTTY
const progress = {
  total: 0,
  done: 0,
  lastRender: 0
}
function renderProgress (force = false) {
  if (!isTTY) return
  const now = Date.now()
  // Throttle to ~20fps or on force
  if (!force && now - progress.lastRender < 50) return
  progress.lastRender = now
  const line = `${prog}: ${progress.done}/${progress.total} layers processed`
  // Clear line and rewrite (works in most terminals)
  process.stderr.write(`\r${line}`)
}
function finishProgressLine () {
  if (!isTTY) return
  process.stderr.write('\n')
}

async function cachedFetch (url, opts) {
  const eligible = typeof url === 'string' && url.includes('/wmts/') && url.endsWith('.xml')
  if (!eligible || !nativeFetch) {
    return nativeFetch ? nativeFetch(url, opts) : Promise.reject(new Error('fetch not available'))
  }

  if (describeDomainsTextCache.has(url)) {
    const textPromise = describeDomainsTextCache.get(url)
    return {
      ok: true,
      text: () => textPromise
    }
  }

  // Perform the real fetch once, cache the resulting text
  const responseTextPromise = (async () => {
    try {
      const res = await nativeFetch(url, opts)
      if (!res || !res.ok) return ''
      return res.text()
    } catch {
      return ''
    }
  })()

  describeDomainsTextCache.set(url, responseTextPromise)

  const res = await nativeFetch(url, opts)
  const ok = !!(res && res.ok)
  if (ok) {
    // Ensure any rejection on the cached promise is observed to avoid unhandled rejections
    responseTextPromise.catch(() => {})
  }
  return {
    ok,
    text: () => responseTextPromise
  }
}

async function asyncPool (limit, array, iteratorFn) {
  const ret = []
  const executing = []
  for (const item of array) {
    const p = Promise.resolve().then(() => iteratorFn(item))
    ret.push(p)
    if (limit <= array.length) {
      const e = p.then(() => {
        executing.splice(executing.indexOf(e), 1)
      }).catch(() => {
        executing.splice(executing.indexOf(e), 1)
      })
      executing.push(e)
      if (executing.length >= limit) {
        await Promise.race(executing)
      }
    }
  }
  return Promise.allSettled(ret)
}

// Pre-scan all entries to compute a stable total layer count for progress
async function computeTotalLayers (entriesList) {
  let total = 0
  const tasks = entriesList.map(async (entry) => {
    try {
      const inputFile = path.join(inputDir, entry.from)
      const xml = await fs.promises.readFile(inputFile, 'utf8')
      const gc = JSON.parse(convert.xml2json(xml, { compact: true }))
      const count = Array.isArray(gc?.Capabilities?.Contents?.Layer)
        ? gc.Capabilities.Contents.Layer.length
        : (gc?.Capabilities?.Contents?.Layer ? 1 : 0)
      total += count
    } catch {
      // Ignore count for entries that fail to parse in prescan
    }
  })
  await Promise.allSettled(tasks)
  return total
}

async function main () {
  console.warn(`${prog}: Processing ${entries.length} entries...`)

  // Setup a stable total for progress display
  progress.total = await computeTotalLayers(entries)
  if (progress.total > 0) renderProgress(true)

  const entryResults = await Promise.allSettled(entries.map(e => processEntry(e)))

  finishProgressLine()

  for (const { status, value } of entryResults) {
    if (status !== 'fulfilled' || !value) continue
    const { errorCount, warningCount, layerCount, wv, to, source } = value
    if (mode === 'verbose') {
      console.warn(`${prog}: ${errorCount} errors, ${warningCount} warnings, ${layerCount} layers for ${source}`)
    }

    const outputFile = path.join(outputDir, to)
    try {
      await fs.promises.writeFile(outputFile, JSON.stringify(wv, null, 2), 'utf-8')
    } catch (err) {
      console.error(`${prog}: ERROR writing ${outputFile}: ${err}`)
      totalErrorCount += 1
    }

    totalErrorCount += errorCount
    totalWarningCount += warningCount
    totalLayerCount += layerCount
  }

  console.warn(`${prog}: ${totalErrorCount} errors, ${totalWarningCount} warnings, ${totalLayerCount} layers`)

  if (totalErrorCount > 0) {
    throw new Error(`${prog}: Error: ${totalErrorCount} errors occured`)
  }
}

async function processEntry (entry) {
  if (mode === 'verbose') {
    console.warn(`${prog}: Processing ${entry.source} from ${entry.from} --> ${entry.to}...`)
  }
  const wv = { layers: {}, sources: {} }
  let wvMatrixSets = {}

  let layerCount = 0
  let warningCount = 0
  let errorCount = 0

  const inputFile = path.join(inputDir, entry.from)
  const gcId = path.basename(inputFile)
  let gc
  try {
    const xml = await fs.promises.readFile(inputFile, 'utf8')
    // Remove pretty spaces to reduce parse overhead
    gc = JSON.parse(convert.xml2json(xml, { compact: true }))
  } catch (e) {
    const msg = `${prog}: [${inputFile}] Unable to get GC: ${e}`
    if (tolerant) {
      console.warn(`${prog}: WARN: ${msg}`)
      warningCount += 1
    } else {
      console.error(`${prog}: ERROR: ${msg}`)
      errorCount += 1
    }
    return { errorCount, warningCount, layerCount }
  }

  const gcContents = gc?.Capabilities?.Contents
  const wvLayers = wv.layers

  if (!gcContents || !gcContents.Layer) {
    errorCount += 1
    console.error(`${prog}: ERROR: [${gcId}] No layers`)
    return { errorCount, warningCount, layerCount }
  }

  const layersArr = Array.isArray(gcContents.Layer) ? gcContents.Layer : [gcContents.Layer]
  if (mode === 'verbose') {
    console.warn(`${prog}: Layer count for ${entry.source}: ${layersArr.length}`)
  }

  // Temporarily override fetch with caching layer for temporal requests
  const originalFetch = globalThis.fetch
  globalThis.fetch = cachedFetch

  const layerResults = await asyncPool(layerConcurrency, layersArr, async (gcLayer) => {
    try {
      const res = await processLayer(gcLayer, wvLayers, entry)
      return res
    } finally {
      // Increment and render progress for every finished layer
      progress.done += 1
      if (progress.done <= progress.total) renderProgress()
    }
  })

  globalThis.fetch = originalFetch

  layerCount += layerResults.length

  for (const res of layerResults) {
    if (res.status === 'fulfilled') {
      const val = res.value
      if (val && val.skipped) {
        warningCount += 1
        if (mode === 'verbose') {
          console.warn(`${prog}: WARNING: Skipping layer`)
        }
      }
      continue
    }
    // Real error
    errorCount += 1
    if (mode === 'verbose') {
      console.error(res.reason?.stack || res.reason)
      console.error(`${prog}: ERROR: ${res.reason}`)
    }
  }

  const gcTileMatrixSet = gcContents.TileMatrixSet
  wvMatrixSets = Array.isArray(gcTileMatrixSet)
    ? gcTileMatrixSet.map(gcMatrixSet => processMatrixSet(gcMatrixSet, entry))
    : [processMatrixSet(gcTileMatrixSet, entry)]

  wv.sources[entry.source] = {
    matrixSets: Object.fromEntries(new Map(wvMatrixSets))
  }

  return { errorCount, warningCount, layerCount, wv, to: entry.to, source: entry.source }
}

async function processLayer (gcLayer, wvLayers, entry) {
  const ident = gcLayer['ows:Identifier']._text
  if (skipSet.has(ident)) {
    if (mode === 'verbose') {
      console.log(`${ident}: skipping`)
    }
    return { skipped: true }
  }

  const wvLayer = {}
  wvLayer.id = ident
  wvLayer.type = 'wmts'
  wvLayer.format = gcLayer.Format._text

  // Temporal dimension
  const dimension = gcLayer.Dimension
  if (dimension && dimension['ows:Identifier']?._text === 'Time') {
    try {
      await processTemporalLayer(wvLayer, dimension.Value, entry.source, cacheMode)
    } catch (e) {
      console.error(`${prog}: ERROR: [${ident}] Temporal processing failed: ${e}`)
    }
  }

  // Matrix set
  const matrixSetLink = gcLayer.TileMatrixSetLink
  const matrixSet = matrixSetLink.TileMatrixSet._text

  const projectionInfo = {
    source: entry.source,
    matrixSet
  }

  wvLayer.projections = {}
  wvLayer.projections[entry.projection] = { ...projectionInfo }

  if (matrixSetLink.TileMatrixSetLimits) {
    const matrixSetLimits = matrixSetLink.TileMatrixSetLimits.TileMatrixLimits
    wvLayer.projections[entry.projection].matrixSetLimits = matrixSetLimits.map(setLimit => ({
      tileMatrix: setLimit.TileMatrix._text,
      minTileRow: parseInt(setLimit.MinTileRow._text, 10),
      maxTileRow: parseInt(setLimit.MaxTileRow._text, 10),
      minTileCol: parseInt(setLimit.MinTileCol._text, 10),
      maxTileCol: parseInt(setLimit.MaxTileCol._text, 10)
    }))
  }

  // ows:Metadata (vector data, palettes, vector style)
  const metadataArr = gcLayer['ows:Metadata']
  if (metadataArr) {
    if (skipPalettesSet.has(ident)) {
      totalWarningCount++
      if (mode === 'verbose') {
        console.warn(`${prog}: WARNING: Skipping palette for ${ident}`)
      }
    } else {
      for (const item of metadataArr) {
        const role = item._attributes?.['xlink:role']
        if (!role) {
          throw new Error('No xlink:role')
        }
        const href = item._attributes['xlink:href']
        if (!href) continue

        if (role === 'http://earthdata.nasa.gov/gibs/metadata-type/layer/1.0') {
          const vectorDataFile = path.basename(href)
          const vectorDataId = path.parse(vectorDataFile).name
          wvLayer.vectorData = { id: vectorDataId }
        } else if (role === 'http://earthdata.nasa.gov/gibs/metadata-type/colormap/1.3') {
          const colormapFile = path.basename(href)
          const colormapId = path.parse(colormapFile).name
          wvLayer.palette = { id: colormapId }
        } else if (role === 'http://earthdata.nasa.gov/gibs/metadata-type/mapbox-gl-style/1.0') {
          const vectorstyleFile = path.basename(href)
          const vectorstyleId = path.parse(vectorstyleFile).name
          wvLayer.vectorStyle = { id: vectorstyleId }
        }
      }
    }
  }

  wvLayers[ident] = wvLayer
}

function processMatrixSet (gcMatrixSet, entry) {
  const tileMatrixArr = gcMatrixSet.TileMatrix
  const ident = gcMatrixSet['ows:Identifier']._text
  const zoomLevels = tileMatrixArr.length
  const resolutions = []
  const formattedTileMatrixArr = []

  let current = entry.maxResolution
  for (let zoom = 0; zoom < zoomLevels; zoom += 1) {
    resolutions.push(current)
    current /= 2
  }

  for (const tileMatrix of tileMatrixArr) {
    formattedTileMatrixArr.push({
      matrixWidth: parseInt(tileMatrix.MatrixWidth._text, 10),
      matrixHeight: parseInt(tileMatrix.MatrixHeight._text, 10)
    })
  }

  const value = {
    id: ident,
    maxResolution: entry.maxResolution,
    resolutions,
    tileSize: [
      parseInt(tileMatrixArr[0].TileWidth._text, 10),
      parseInt(tileMatrixArr[0].TileHeight._text, 10)
    ],
    tileMatrices: formattedTileMatrixArr
  }

  return [ident, value]
}

main().catch((err) => {
  console.error(err.stack)
})

module.exports = {
  processEntry,
  processLayer,
  processMatrixSet,
  main
}

const fs = require('fs')
const path = require('path')
const yargs = require('yargs')
const moment = require('moment')
const { processTemporalLayer } = require('./processTemporalLayer')
const prog = path.basename(__filename)

const options = yargs
  .usage('Usage: $0 [optionsFile] [configDir]')
  .option('optionsFile', {
    demandOption: true,
    alias: 'o',
    type: 'string',
    description: 'options file'
  })
  .option('configDir', {
    demandOption: true,
    alias: 'c',
    type: 'string',
    description: 'config directory'
  })
  .epilog('Validates and corrects the configuration files.')

const { argv } = options
if (!argv.optionsFile && !argv.configDir) {
  throw new Error('Invalid number of arguments')
}

const optionsFile = argv.optionsFile
const configDir = argv.configDir

let errorCount = 0
let warningCount = 0
const removedLayers = []

const mainConfigFile = path.join(configDir, 'wv.json')
const wv = JSON.parse(fs.readFileSync(mainConfigFile, 'utf8'))
const opt = JSON.parse(fs.readFileSync(optionsFile, 'utf8'))

const tolerant = opt.tolerant || false

function fail (message) {
  console.error(`${prog}: ERROR: ${message}`)
  errorCount += 1
}

function error (message) {
  tolerant ? warn(message) : fail(message)
}

function warn (message) {
  console.error(`${prog}: WARN: ${message}`)
  warningCount += 1
}

function removeLayer (wv, layerId) {
  removedLayers.push(layerId)
  delete wv.layers[layerId]
  if (wv.layerOrder.includes(layerId)) {
    wv.layerOrder = wv.layerOrder.filter((id) => id !== layerId)
  }
}

function isDateTimeFormat (input) {
  try {
    moment(input, 'YYYY-MM-DD HH:mm:ss')
    return true
  } catch (e) {
    return false
  }
}

if (tolerant) warn('Validation enforcement disabled')

let startDate = moment.max()

async function main () {
  for (const layerId of Object.keys(wv.layers)) {
    let layer = wv.layers[layerId]
    if (layerId !== layer.id) {
      error(`[${layerId}] layer id does not match id of ${layer.id}`)
    }
    if (!wv.layerOrder.includes(layerId)) {
      if (opt.layerOrderExceptions && opt.layerOrderExceptions.includes(layerId)) {
        removeLayer(wv, layerId)
        continue
      } else if (tolerant || opt.ignoreLayerOrder) {
        wv.layerOrder.push(layerId)
      } else {
        removeLayer(wv, layerId)
        continue
      }
    }
    if (layer.vectorStyle && !layer.vectorStyle.id) {
      error(`[${layerId}] No vectorStyle definition`)
    }
    if (!layer.group && opt.warnOnUnexpectedLayer) {
      error(`[${layerId}] Possible unexpected layer, no group defined`)
      removeLayer(wv, layerId)
      continue
    } else if (!layer.group) {
      removeLayer(wv, layerId)
      continue
    }
    if ('temporal' in layer) {
      warn(`[${layerId}] GC Layer temporal values overwritten by Options`)
      layer = await processTemporalLayer(layer, layer.temporal)
    }
    if (layer.futureTime) {
      if ('endDate' in layer) delete layer.endDate
    }

    if (layer.futureTime) {
      // do nothing
    } else {
      if ('endDate' in layer && layer.ongoing) delete layer.endDate
    }
    if ('startDate' in layer) {
      const startTime = layer.startDate.replace('T', ' ').replace('Z', '')
      let d
      if (isDateTimeFormat(startTime)) {
        d = moment(startTime, 'YYYY-MM-DD HH:mm:ss')
      } else {
        d = moment(layer.startDate, 'YYYY-MM-DD')
      }
      startDate = moment.min(startDate, d)
    }
  }

  if (startDate.isValid()) {
    wv.startDate = startDate.format('YYYY-MM-DD') + 'T' + startDate.format('HH:mm:ss') + 'Z'
  }

  for (const layerId of wv.layerOrder) {
    if (!wv.layers[layerId]) {
      error(`[${layerId}] In layer order but no definition`)
    }
  }

  const startingLayers = []
  for (const startingLayer of wv.defaults.startingLayers) {
    if (!wv.layers[startingLayer.id]) {
      error(`Invalid starting layer: ${startingLayer.id}`)
    } else {
      startingLayers.push(startingLayer)
    }
  }
  wv.defaults.startingLayers = startingLayers
  wv.buildDate = Math.round(Date.now() / 1000)

  for (const [projection, projectionValue] of Object.entries(wv.naturalEvents.layers)) {
    for (const [eventType, eventTypeLayerList] of Object.entries(projectionValue)) {
      for (const layerObject of eventTypeLayerList) {
        if (!wv.layers[layerObject[0]]) {
          error(`The ${layerObject[0]} layer in the Natural events ${projection} ${eventType} config does not have a matching ID in the layer config`)
        }
      }
    }
  }

  for (const measurement of Object.values(wv.measurements)) {
    if (!measurement.sources) continue
    for (const source of Object.values(measurement.sources)) {
      if (!source.settings) continue
      for (const setting of source.settings) {
        if (!wv.layers[setting]) {
          error(`In measurement ${measurement.id}, source ${source.id}, layer not found: ${setting}`)
        }
      }
    }
  }

  const removeCount = removedLayers.length
  console.warn(`${prog}: ${errorCount} error(s), ${warningCount} warning(s), ${removeCount} removed`)
  if (removeCount > 0) {
    console.warn(removedLayers)
  }

  fs.writeFileSync(mainConfigFile, JSON.stringify(wv, null, 2))

  if (errorCount > 0) {
    throw new Error(`${prog}: Error: ${errorCount} errors occured`)
  }
}

main().catch((err) => {
  console.error(err.stack)
})

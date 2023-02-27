/* eslint-disable no-console */

const _ = require('lodash')
const fs = require('fs')
const util = require('util')
const dir = require('node-dir')

const fsAccess = util.promisify(fs.access)
const fsWriteFile = util.promisify(fs.writeFile)

const { GIT_HOME } = process.env
const SOURCE_DIR = './config/default/common/config/wv.json/layers/'
const DEST_DIR = `${GIT_HOME}/layers-config/layer-metadata/v1.0/`
const WV_JSON_PATH = './build/options/config/wv.json'
const OVERWRITE_EXISTING = false

let wvJson = {}
let metadataCount = 0
const measurementsMap = {}
const measurementsArray = []
const periodIntervalMap = {
  daily: 'Day',
  monthly: 'Month',
  yearly: 'Year'
}

const errCallback = (err) => {
  if (err) {
    console.log(err)
    throw err
  }
}

function capitalizeFirstLetter (string) {
  return !string ? '' : string.charAt(0).toUpperCase() + string.slice(1)
}

function setLayerProp (layer, prop, value) {
  const featuredMeasurement = prop === 'measurements' && (value && value.includes('Featured'))
  if (!layer || featuredMeasurement) {
    return
  }
  if (!layer[prop]) {
    layer[prop] = [value]
  } else if (!layer[prop].includes(value)) {
    layer[prop].push(value)
  }
}

function generateMeasurements (layers, measurementsConfig) {
  _.forEach(measurementsConfig, (measureObj, measureKey) => {
    _.forEach(measureObj.sources, ({ settings = [] }, sourceKey) => {
      settings.forEach((id) => {
        setLayerProp(layers[id], 'measurements', measureKey)
        if (!measurementsArray.includes(measureKey)) {
          measurementsArray.push(measureKey)
        }
      })
    })
  })
  _.forEach(layers, ({ measurements }, id) => {
    // Reduce to a single measurement:
    if (id.toLowerCase().includes('orbit')) {
      measurementsMap[id] = 'Orbital Track'
    } else {
      // eslint-disable-next-line prefer-destructuring
      measurementsMap[id] = measurements[0]
    }
    // Unmodified output (all measurements):
    // measurementsMap[id] = measurements;
  })
  // fs.writeFile(`${DEST_DIR}measurements.json`, JSON.stringify(measurementsMap, null, 2), errCallback);
}

function setPeriodProps (wvJsonLayer, outputLayer) {
  const { period, dateRanges, id } = wvJsonLayer
  if (!period) {
    console.log('No layer period for:', id)
  }

  if (!dateRanges) {
    outputLayer.layerPeriod = capitalizeFirstLetter(period)
    return
  }
  const dateIntervals = (dateRanges || []).map(({ dateInterval }) => dateInterval)
  const firstInterval = Number.parseInt(dateIntervals[0], 10)
  const consistentIntervals = dateIntervals.every((interval) => {
    const parsedInterval = Number.parseInt(interval, 10)
    return parsedInterval === firstInterval
  })

  outputLayer.layerPeriod = capitalizeFirstLetter(period)

  if (period === 'subdaily' || firstInterval === 1) {
    return
  }

  if (consistentIntervals && firstInterval <= 16) {
    outputLayer.layerPeriod = `${firstInterval}-${periodIntervalMap[period]}`
  } else if (id.includes('7Day')) {
    outputLayer.layerPeriod = '7-Day'
  } else if (id.includes('5Day')) {
    outputLayer.layerPeriod = '5-Day'
  } else if (id.includes('Monthly')) {
    outputLayer.layerPeriod = 'Monthly'
  } else if (id.includes('Weekly')) {
    outputLayer.layerPeriod = '7-Day'
  } else {
    outputLayer.layerPeriod = `Multi-${periodIntervalMap[period]}`
  }
}

function modifyProps (layerObj) {
  const {
    id, title, subtitle, tracks, daynight, inactive
  } = layerObj
  const wvJsonLayerObj = wvJson.layers[id]
  if (!wvJsonLayerObj) {
    console.error(`Layer ${title} not found in wv.json, run build script!`)
    return
  }

  const {
    startDate, endDate, dateRanges, period
  } = wvJsonLayerObj
  const staticLayer = !startDate && !endDate && !dateRanges

  const modifiedObj = {
    title,
    subtitle,
    ongoing: staticLayer ? false : !inactive,
    measurement: measurementsMap[id],
    retentionPeriod: -1
  }

  if (daynight) {
    modifiedObj.daynight = daynight
  }

  if (tracks && period !== 'monthly') {
    modifiedObj.orbitTracks = []
    modifiedObj.orbitDirection = []
    tracks.forEach((track) => {
      modifiedObj.orbitTracks.push(track)
      if (wvJson.layers[track]) {
        modifiedObj.orbitDirection.push(wvJson.layers[track].track)
      } else {
        console.log('Orbit track not found', track)
      }
    })
  }
  if (period) {
    // WARNING:  Not totally accurate, will need to identify N-Day layers.
    // modifiedObj.period = wvJsonLayerObj.period;
    setPeriodProps(wvJsonLayerObj, modifiedObj)
  }
  return modifiedObj
}

/**
 *
 * @param {*} filePath
 */
async function migrate (filePath) {
  const pathStrings = filePath.split('/')
  const fileName = pathStrings[pathStrings.length - 1]
  if (!fileName.includes('.json')) {
    return
  }

  const layerJson = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  const fileLayerId = fileName.slice(0, fileName.length - 5)
  const id = Object.keys(layerJson.layers)[0]
  if (fileLayerId !== id) {
    console.warn('File name did not match id:', filePath)
  }
  const layerPropsObj = layerJson.layers[id]
  if (!layerPropsObj) {
    console.error('No layer data for:', filePath)
    return
  }

  const path = `${DEST_DIR}${fileName}`
  const newObj = modifyProps(layerPropsObj)
  const output = JSON.stringify(newObj, null, 2)

  try {
    await fsAccess(path, fs.constants.F_OK)
  } catch (err) {
    if (err.code === 'ENOENT') {
      metadataCount += 1
      await fsWriteFile(path, output, errCallback)
    }
  }

  if (OVERWRITE_EXISTING) {
    metadataCount += 1
    await fsWriteFile(path, output, errCallback)
  }
}

dir.files(SOURCE_DIR, async (err, files) => {
  if (err) throw err
  wvJson = JSON.parse(fs.readFileSync(WV_JSON_PATH, 'utf-8'))
  generateMeasurements(wvJson.layers, wvJson.measurements)
  await Promise.all(files.map(migrate))

  if (metadataCount > 0) {
    console.log(`Successfully generated ${metadataCount} metadata configs.`)
  } else {
    console.log('No metadata configs were generated')
  }
})

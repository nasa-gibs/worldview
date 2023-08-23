const _ = require('lodash')
const fs = require('fs')
const dir = require('node-dir')

const SOURCE_DIR = './config/default/common/config/wv.json/layers/'
const WV_JSON_PATH = './build/options/config/wv.json'

const measurementsMap = {}
const measurementsArray = []

// This is a set of layer IDs which we do not wish to generate (or re-generate)
const EXCEPTIONS = [
  'HLSL30_FIRMS',
  'HLSS30_FIRMS',
  'World_Database_on_Protected_Areas',
  'Reference_Labels',
  'Reference_Features',
  'Land_Water_Map',
  'Land_Mask',
  'Coastlines',
  'MODIS_Terra_L3_Land_Water_Mask',
  'AMSRE_Sea_Ice_Brightness_Temp_89V',
  'AMSRE_Sea_Ice_Brightness_Temp_89H',
  'AMSRU2_Sea_Ice_Brightness_Temp_6km_89V',
  'AMSRU2_Sea_Ice_Brightness_Temp_6km_89H'
]

const errCallback = (err) => {
  if (err) {
    console.log(err)
    throw err
  }
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
  })
}

function modifyProps (layer) {
  const { id } = layer
  layer.layergroup = measurementsMap[id]

  return {
    [id]: {
      ...layer
    }
  }
}

function migrate (filePath) {
  const pathStrings = filePath.split('/')
  const fileName = pathStrings[pathStrings.length - 1]
  if (!fileName.includes('.json')) {
    return
  }

  const layerJson = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  const fileLayerId = fileName.slice(0, fileName.length - 5)
  const objPropLayerId = Object.keys(layerJson.layers)[0]
  if (fileLayerId !== objPropLayerId) {
    console.log('Mismatched ids!', filePath)
  }
  const layer = layerJson.layers[objPropLayerId]

  if (EXCEPTIONS.includes(layer.id)) {
    return
  }

  fs.writeFile(
    `${filePath}`,
    JSON.stringify({ layers: modifyProps(layer) }, null, 2),
    errCallback
  )
}

dir.files(SOURCE_DIR, (err, files) => {
  if (err) throw err
  const wvJson = JSON.parse(fs.readFileSync(WV_JSON_PATH, 'utf-8'))
  generateMeasurements(wvJson.layers, wvJson.measurements)
  files.forEach(migrate)
})

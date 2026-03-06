const fs = require('fs')
const path = require('path')

const SOURCE_DIR = `${path.resolve(__dirname)}/../config/default/release/gc/colormaps/`
const OUTPUT_DIR = process.argv[2] || './'
const OUTPUT_FILENAME = '_COLORMAP_UNIT_DICT_.json'

// HELPERS
// https://gist.github.com/nrkn/c7a89bb7039182314415 JSON FORMATTING
const isPrimitive = (obj) => obj === null ||
    ['string', 'number', 'boolean'].includes(typeof obj)

const isArrayOfPrimitive = (obj) => Array.isArray(obj) && obj.every(isPrimitive)

const format = (arr) => `^^^[ ${
  arr.map((val) => JSON.stringify(val)).join(', ')
} ]`

const replacer = (key, value) => (isArrayOfPrimitive(value) ? format(value) : value)

const expand = (str) => str.replace(
  /(?:"\^\^\^)(\[ .* \])(?:")/g, (match, a) => a.replace(/\\"/g, '"')
)

const readDirPromise = (dirname) => new Promise((resolve, reject) => {
  fs.readdir(dirname,
    (err, filenames) => (err ? reject(err) : resolve(filenames)))
})

// MAIN COLORMAP UNIT DICTIONARY GENERATION
async function generateColormapUnitDictionary (dirname) {
  const data = {}
  const filenames = await readDirPromise(dirname)
  try {
    return Promise.all(filenames.map(async (filename) => {
      const content = await new Promise((resolve, reject) => {
        fs.readFile(dirname + filename, 'utf8',
          (err, content) => (err ? reject(err) : resolve(content)))
      })
      const parseUnits = (fileContent) => {
        const colorMapName = filename.split('.xml')[0]
        data[colorMapName] = []
        const lines = fileContent.split(/\r?\n/)
        lines.forEach((line) => {
          if (line.includes('units')) {
            const unitsString = line.split('units=')[1]
            const units = unitsString.split('"')[1]
            data[colorMapName].push(units)
          }
        })
      }
      parseUnits(content)
    })).then(() => data)
  } catch (error) {
    return Promise.reject(error)
  }
}

async function main () {
  const data = await generateColormapUnitDictionary(SOURCE_DIR)
  fs.writeFile(`${OUTPUT_DIR}${OUTPUT_FILENAME}`, expand(JSON.stringify(data, replacer, 2)), {
    encoding: 'utf8',
    flag: 'w'
  }, (err) => {
    if (err) throw err
    console.log(`Done writing colormap unit dictionary to ${OUTPUT_DIR}${OUTPUT_FILENAME}.`)
  })
}

main()

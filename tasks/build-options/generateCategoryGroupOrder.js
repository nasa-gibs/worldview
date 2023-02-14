const fs = require('fs')
const path = require('path')

const prog = path.basename(__filename)

const inputDir = process.argv[2]
const outputDir = process.argv[3]

if (!inputDir || !outputDir) {
  throw new Error(`Usage: node ${prog} <input_dir> <output_dir>`)
}

const categoryDirectory = inputDir

const categoryDict = {}

const walk = (dir, callback) => {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f)
    const isDirectory = fs.statSync(dirPath).isDirectory()
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f))
  })
}

const processFile = async filePath => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error(`${prog} ERROR: Could not read category config. Check formatting of: ${filePath}`)
        reject(err)
      }
      try {
        const config = JSON.parse(data)
        const category = config.categories[0]
        categoryDict[category] = true
        resolve()
      } catch (e) {
        console.error(`${prog} ERROR: Could not read category config. Check formatting of: ${filePath}`)
        reject(e)
      }
    })
  })
}

const main = async () => {
  try {
    walk(categoryDirectory, filePath => {
      processFile(filePath)
    })
    await fs.promises.writeFile(
      path.join(outputDir, 'categoryGroupOrder.json'),
      JSON.stringify({ categoryGroupOrder: Object.keys(categoryDict) }, null, 2),
      'utf8'
    )
    console.log(
      `${prog} Successfully generated categoryGroupOrder.json with these categories: ${Object.keys(
        categoryDict
      )}`
    )
  } catch (err) {
    throw new Error(`${prog} ERROR: Could not write categoryGroupOrder.json`)
  }
}

main().catch((err) => {
  console.error(err.stack)
})

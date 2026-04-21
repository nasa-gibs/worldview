// *************************************************************************
// Scrape Worldview then process URLs to organize by errors and status codes
//
// Current version 1.0 targets urls collected from:
// ./build/options metadata and EONET natural events
// *************************************************************************
const fs = require('fs')
const getUrlStatusCodeCollection = require('./url-check')
const getHtmlUrls = require('./html-url-extract.js')
const getNaturalEventsUrls = require('./natural-event-url-extract.js')

const makeLine = (msg) => console.log(`${'-'.repeat(66)}
\x1b[36m${msg}\x1b[0m`)

// Prevent majority of TLS SSL related errors
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

// Make get requests with URLs with node-fetch to check status codes and organize by errors and codes
const organizeURLStatus = async (scrapedUrls) => {
  const timeEstimate = ((scrapedUrls.length * 1000) / 60000).toFixed(0)
  makeLine(`Checking url status codes will take approximately ${timeEstimate} minutes...`)
  // Initiate status code check
  const results = await getUrlStatusCodeCollection(scrapedUrls)
  // Wait for URLs to be analyzed then stringify and save to JSON file
  const stringified = await JSON.stringify(results, null, 2)
  const now = new Date()

  // Check for 'results' directory or make new one
  // eslint-disable-next-line no-unused-expressions
  fs.existsSync('./tasks/link-check/results') || fs.mkdirSync('./tasks/link-check/results')

  const fileName = `./tasks/link-check/results/WV-link-check-${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}.json`
  fs.writeFile(fileName, stringified, 'utf8', () => {
    makeLine(`Results file created: ${fileName}`)
    // eslint-disable-next-line n/no-process-exit
    process.exit()
  })
}

const main = async () => {
  makeLine('Starting by collecting urls to check...')
  // get natural event urls
  const naturalEventsUrls = await getNaturalEventsUrls()
  // get metadata layers and about page urls
  const htmlUrls = await getHtmlUrls()
  organizeURLStatus(htmlUrls.concat(naturalEventsUrls))
}

main()

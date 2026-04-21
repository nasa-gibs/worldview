const fetch = require('node-fetch')
const path = require('path')
const prog = path.basename(__filename)
// URL status check function makes GET requests to provided list of URLs to get status codes / errors

// Checks status code of provided links and return object organized by errors / statuscodes
const requestCheck = async (urls) => {
  const parsedUrls = {
    ERROR: [],
    STATUSCODE: {}
  }

  console.warn(`${prog}: Checking ${urls.length} URLs for errors/status codes...`)
  const promises = urls.map((link) => {
    const linkName = Object.keys(link)[0]
    const url = Object.values(link)[0]
    if (url[0] !== 'h') return Promise.resolve() // Skip for mailto email links
    return fetch(url, { timeout: 10000 })
      .then(async (res) => {
        const statusCode = await res.status
        if (!parsedUrls.STATUSCODE[statusCode]) {
          parsedUrls.STATUSCODE[statusCode] = []
        }
        parsedUrls.STATUSCODE[statusCode].push({ [linkName]: url })
      })
      .catch((err) => { // eslint-disable-line n/handle-callback-err
        parsedUrls.ERROR.push({ [linkName]: url })
      })
  })
  await Promise.allSettled(promises)
  return parsedUrls
}

// Get urls with errors/status codes organized into an object
const getURLStatusCodeCollection = async function (urls) {
  const checkStatus = await requestCheck(urls)
  // Log out number of links with errors/status codes
  console.log(`
URL STATUSCODE RESULTS:
${'-'.repeat(66)}
  ERRORS: \x1b[31m${checkStatus.ERROR.length}\x1b[0m
  STATUSCODE:`)
  const codes = Object.keys(checkStatus.STATUSCODE)
  codes.forEach((code) => {
    let preColor = '\x1b[33m'
    if (code === '200') {
      preColor = '\x1b[32m'
    } else if (Number(code) >= 400) {
      preColor = '\x1b[31m'
    }
    console.log(`    ${code}: ${preColor + checkStatus.STATUSCODE[code].length}\x1b[0m`)
  })
  return checkStatus
}

module.exports = getURLStatusCodeCollection

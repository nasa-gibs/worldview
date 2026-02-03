/* eslint-disable no-restricted-syntax */
const fetch = require('node-fetch')
const path = require('path')
const prog = path.basename(__filename)

// helper function to find target key in nested object
const findProp = async (obj, keys, out) => {
  let i
  const proto = Object.prototype
  const ts = proto.toString
  const hasOwn = proto.hasOwnProperty.bind(obj)

  if (ts.call(out) !== '[object Array]') {
    out = []
  }
  for (i in obj) {
    if (hasOwn(i)) {
      if (keys.includes(i)) {
        // handle different title formats from EONET
        const title = obj.title ? obj.title : obj.id
        if (title) {
          out.push({ [title]: obj[i] })
        }
      } else if (ts.call(obj[i]) === '[object Array]' || ts.call(obj[i]) === '[object Object]') {
        findProp(obj[i], keys, out)
      }
    }
  }
  return out
}

const scrapeLinks = async (htmlLinks) => {
  // skip exact (rel and href) doubles of links
  const trackDoubles = {}
  const addedUrls = []

  try {
    console.warn(`${prog}: Scraping ${htmlLinks.length} links from EONET...`)
    const results = await Promise.allSettled(htmlLinks.map((htmlLink, i) => fetch(htmlLink)))
    const statuses = await Promise.allSettled(results.map(({ status, value }) => status === 'fulfilled' && value.json()))
    const urls = await Promise.allSettled(statuses.map(({ status, value }) => status === 'fulfilled' && findProp(value, ['url', 'link', 'source'])))
    urls.forEach(({ status, value }) => {
      if (status === 'fulfilled' && Array.isArray(value)) {
        value.forEach(obj => {
          const linkRel = Object.keys(obj)[0]
          const linkHref = Object.values(obj)[0]

          if (trackDoubles[linkRel] !== linkHref) {
            addedUrls.push({ [linkRel]: linkHref })
            trackDoubles[linkRel] = linkHref
          }
        })
      }
    })
  } catch (err) {
    console.log(`${prog}: ERROR: ${err}`)
  }
  return addedUrls
}

// get URLs from natural events EONET
// scraped URLs are saved in an array of objects with a key value pair of link text and href:
// 'Wildfire MB-CE042, Manitoba, Canada': 'https://eonet.gsfc.nasa.gov/api/v3/events/EONET_3518'
const initExtractor = async () => {
  // target EONET sources from natural events
  const links = ['https://eonet.gsfc.nasa.gov/api/v3/sources',
    'https://eonet.gsfc.nasa.gov/api/v3/events',
    'https://eonet.gsfc.nasa.gov/api/v3/categories']
  const results = await scrapeLinks(links)
  return results
}

module.exports = initExtractor

/* eslint-disable no-restricted-syntax */
const fetch = require('node-fetch')

// delay helper to prevent too many requests at once
const sleeper = (ms) => (x) => new Promise((resolve) => setTimeout(() => resolve(x), ms))

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

  for (let i = 0; i < htmlLinks.length; i += 1) {
    const htmlLink = htmlLinks[i]
    // eslint-disable-next-line no-await-in-loop
    await fetch(htmlLink)
      .then(async (res) => {
        const status = await res.json()
        const urls = await findProp(status, ['url', 'link', 'source'])
        for (let j = 0; j < urls.length; j += 1) {
          const url = urls[j]
          const linkRel = Object.keys(url)[0]
          const linkHref = Object.values(url)[0]

          if (trackDoubles[linkRel] !== linkHref) {
            addedUrls.push({ [linkRel]: linkHref })
            trackDoubles[linkRel] = linkHref
          }
        }
      }).then(sleeper(500))
      .catch((err) => {
        console.log(htmlLink, err)
      })
  }
  return addedUrls
}

// get URLs from natural events EONET
// scraped URLs are saved in an array of objects with a key value pair of link text and href:
// 'Wildfire MB-CE042, Manitoba, Canada': 'https://eonet.gsfc.nasa.gov/api/v2.1/events/EONET_3518'
const initExtractor = async () => {
  // target EONET sources from natural events
  const links = ['https://eonet.gsfc.nasa.gov/api/v2.1/sources',
    'https://eonet.gsfc.nasa.gov/api/v2.1/events',
    'https://eonet.gsfc.nasa.gov/api/v2.1/categories']
  const results = await scrapeLinks(links)
  return results
}

module.exports = initExtractor

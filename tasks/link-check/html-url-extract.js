const cheerio = require('cheerio')
const fs = require('fs')
// walk through directory to collect html file paths, parse for links, and return array of link objects

// create collection of HTML file addresses from directory
const walk = (dir) => {
  let results = []
  const list = fs.readdirSync(dir)
  list.forEach((file) => {
    file = `${dir}/${file}`
    const stat = fs.statSync(file)
    if (stat && stat.isDirectory()) {
      /* Recurse into a subdirectory */
      results = results.concat(walk(file))
    } else {
      const fileType = file.split('.').pop()
      if (fileType === 'html') {
        results.push(file)
      }
    }
  })
  return results
}

// get URLS from HTML in ./build/options using cheerio
const getUrls = (htmlArray) => {
  // skip exact (rel and href) doubles of links
  const trackDoubles = {}
  const scrapedHTML = []

  for (let i = 0; i < htmlArray.length; i += 1) {
    const $ = cheerio.load(fs.readFileSync(htmlArray[i]))
    const links = $('a')

    // create url object:
    // { 'AIRS - The AIRS instrument suite physical retrievals': 'http://airs.jpl.nasa.gov/data/physical_retrievals' }
    $(links).each((i, link) => {
      const linkRel = $(link).text() || 'EMPTY'
      const linkHref = $(link).attr('href')

      if (trackDoubles[linkRel] !== linkHref) {
        scrapedHTML.push({ [linkRel]: linkHref })
        trackDoubles[linkRel] = linkHref
      }
    })
  }
  return scrapedHTML
}

// get URLS from HTML files
// scraped URLs are saved in an array of objects with a key value pair of link text and href:
// 'Wildfire MB-CE042, Manitoba, Canada': 'https://eonet.gsfc.nasa.gov/api/v2.1/events/EONET_3518'
const initExtractor = async () => {
  // any html file with a url will be scraped and added
  const htmlFiles = await walk('./build/options')
  const htmlUrls = await getUrls(htmlFiles)
  return htmlUrls
}

module.exports = initExtractor

const fetch = require('node-fetch');

// delay helper to prevent too many requests at once
const sleeper = (ms) => (x) => new Promise(resolve => setTimeout(() => resolve(x), ms));

// helper function to find target key in nested object
const findProp = async (obj, keys, out) => {
  let i;
  let proto = Object.prototype;
  let ts = proto.toString;
  let hasOwn = proto.hasOwnProperty.bind(obj);

  if (ts.call(out) !== '[object Array]') {
    out = [];
  }
  for (i in obj) {
    if (hasOwn(i)) {
      if (keys.includes(i)) {
        // handle different title formats from EONET
        let title = obj['title'] ? obj['title'] : obj['id'];
        if (title) {
          out.push({ [title]: obj[i] });
        }
      } else if (ts.call(obj[i]) === '[object Array]' || ts.call(obj[i]) === '[object Object]') {
        findProp(obj[i], keys, out);
      }
    }
  }
  return out;
};

const scrapeLinks = async (htmlLinks) => {
  // skip exact (rel and href) doubles of links
  const trackDoubles = {};
  const addedUrls = [];

  for (let i = 0; i < htmlLinks.length; i++) {
    let htmlLink = htmlLinks[i];
    await fetch(htmlLink)
      .then(async (res) => {
        let status = await res.json();
        let urls = await findProp(status, ['url', 'link', 'source']);
        for (let j = 0; j < urls.length; j++) {
          let url = urls[j];
          let linkRel = Object.keys(url)[0];
          let linkHref = Object.values(url)[0];

          if (trackDoubles[linkRel] !== linkHref) {
            addedUrls.push({ [linkRel]: linkHref });
            trackDoubles[linkRel] = linkHref;
          }
        }
      }).then(sleeper(500))
      .catch((err) => {
        console.log(htmlLink, err);
      });
  }
  return addedUrls;
};

// get URLs from natural events EONET
// scraped URLs are saved in an array of objects with a key value pair of link text and href:
// 'Wildfire MB-CE042, Manitoba, Canada': 'https://eonet.sci.gsfc.nasa.gov/api/v2.1/events/EONET_3518'
const initExtractor = async () => {
  // target EONET sources from natural events
  const links = ['https://eonet.sci.gsfc.nasa.gov/api/v2.1/sources',
    'https://eonet.sci.gsfc.nasa.gov/api/v2.1/events',
    'https://eonet.sci.gsfc.nasa.gov/api/v2.1/categories'];
  const results = await scrapeLinks(links);
  return results;
};

module.exports = initExtractor;

const fs = require('fs')
const moment = require('moment')
const xml2js = require('xml2js')

const projDict = {
  'GIBS:geographic': 'epsg4326',
  'GIBS:arctic': 'epsg3413',
  'GIBS:antarctic': 'epsg3031',
  'GITC:geographic': 'epsg4326',
  'GITC:arctic': 'epsg3413',
  'GITC:antarctic': 'epsg3031',
  'GITC:webmercator': 'epsg3857'
}

function toList (val) {
  return val instanceof Array ? val : [val]
}

function rangesHelper (wvLayer, ranges) {
  const dateFormat = 'YYYY-MM-DD'
  const dateTimeFormat = 'YYYY-MM-DD HH:mm:ss'
  let startDate = moment.min()
  let endDate = moment.max()
  const dateRangeStart = []
  const dateRangeEnd = []
  const rangeInterval = []
  if (ranges && ranges[0] && ranges[0]._text && ranges[0]._text.includes('T')) {
    wvLayer.period = 'subdaily'
  } else {
    if (ranges && ranges[0] && ranges[0]._text && ranges[0]._text.endsWith('Y')) {
      wvLayer.period = 'yearly'
    } else if (ranges && ranges[0] && ranges[0]._text && ranges[0]._text.endsWith('M')) {
      wvLayer.period = 'monthly'
    } else {
      wvLayer.period = 'daily'
    }
  }
  for (const range of ranges) {
    if (!range._text || !range._text.length) continue
    const [start, end, interval] = range._text.split('/')
    if (
      wvLayer.period === 'daily' ||
      wvLayer.period === 'monthly' ||
      wvLayer.period === 'yearly'
    ) {
      startDate = moment.min(startDate, moment(start, dateFormat))
      endDate = moment.max(endDate, moment(end, dateFormat))
      if (start) {
        startDate = moment(start, dateFormat).format('YYYY-MM-DDTHH:mm:ss[Z]')
        dateRangeStart.push(startDate)
      }
      if (end) {
        endDate = moment(end, dateFormat).format('YYYY-MM-DDTHH:mm:ss[Z]')
      }
      if (interval !== 'P1D') {
        endDate = moment.utc(endDate).add(moment.duration(interval)).format('YYYY-MM-DDTHH:mm:ss[Z]')
        // For monthly products subtract 1 day
        if (wvLayer.period === 'monthly') {
          endDate = moment.utc(endDate).subtract(1, 'day').format('YYYY-MM-DDTHH:mm:ss[Z]')
        }
      }
      const regex = /\d+/g
      const match = regex.exec(interval)
      rangeInterval.push(match)
      if (endDate.endsWith('T00:00:00Z')) {
        endDate = endDate.replace('T00:00:00Z', 'T23:59:59Z')
      }
      dateRangeEnd.push(endDate)
    } else {
      // Subdaily Layers
      startDate = moment(start, dateTimeFormat).format('YYYY-MM-DDTHH:mm:ss[Z]')
      endDate = moment(end, dateTimeFormat).format('YYYY-MM-DDTHH:mm:ss[Z]')

      if (start) {
        dateRangeStart.push(startDate)
      }
      if (end) {
        dateRangeEnd.push(endDate)
      }

      rangeInterval.push(interval.match(/\d+/)[0])
    }

    wvLayer.startDate = dateRangeStart[0]
    wvLayer.endDate = dateRangeEnd[dateRangeEnd.length - 1]
  }
  return [dateRangeStart, dateRangeEnd, rangeInterval]
}

async function createDateRanges (url, wvLayer, cacheMode) {
  const fetchOpts = cacheMode === 'no-store' ? { cache: cacheMode } : undefined
  let invalidRanges = false
  let ranges = []
  const dateRangeStart = []
  const dateRangeEnd = []
  const rangeInterval = []
  let nextPage
  const parser = new xml2js.Parser()
  try {
    const describeDomainsResponse = await fetch(url, fetchOpts)
    if (describeDomainsResponse?.ok) {
      const describeDomainsText = await describeDomainsResponse?.text?.() || ''
      const describeDomainsJson = await parser.parseStringPromise(describeDomainsText)
      nextPage = describeDomainsJson?.Domains?.DimensionDomain?.[0]?.NextPage?.[0]
      const domain = describeDomainsJson?.Domains?.DimensionDomain?.[0]?.Domain?.[0] || ''
      const domains = domain.split(',')
      if (domain && domains?.length) {
        const formattedDomains = domains.map((d) => {
          return {
            _text: d
          }
        })
        ranges = toList(formattedDomains)
      } else {
        invalidRanges = true
      }
    }
  } catch (error) {
    invalidRanges = true
    console.error(`Error fetching ${url}: ${error}`)
  } finally {
    if (!invalidRanges) {
      const [dateRangeStartYear, dateRangeEndYear, rangeIntervalYear] = rangesHelper(wvLayer, ranges)
      dateRangeStart.push(...dateRangeStartYear)
      dateRangeEnd.push(...dateRangeEndYear)
      rangeInterval.push(...rangeIntervalYear)
    }
    // Fetch next page recursively if one exists
    if (nextPage) {
      const [dateRangeStartOut, dateRangeEndOut, rangeIntervalOut] = await createDateRanges(nextPage, wvLayer, cacheMode)
      dateRangeStart.push(...dateRangeStartOut)
      dateRangeEnd.push(...dateRangeEndOut)
      rangeInterval.push(...rangeIntervalOut)
    }
  }
  return [dateRangeStart, dateRangeEnd, rangeInterval]
}

async function processTemporalLayer (wvLayer, value, source = 'GIBS:geographic', cacheMode) {
  try {
    const describeDomainsAllUrl = `https://gibs.earthdata.nasa.gov/wmts/${projDict[source]}/best/1.0.0/${wvLayer.id}/default/250m/all/all.xml`
    let [dateRangeStart, dateRangeEnd, rangeInterval] = await createDateRanges(describeDomainsAllUrl, wvLayer, cacheMode)
    // Fall back to original ranges if the 'all' endpoint fetch failed
    if (!dateRangeStart) {
      const rangesBackup = toList(value)
      const backupRangesObj = rangesHelper(wvLayer, rangesBackup)
      dateRangeStart = backupRangesObj[0]
      dateRangeEnd = backupRangesObj[1]
      rangeInterval = backupRangesObj[2]
    }
    if (dateRangeStart.length && dateRangeEnd.length) {
      const dateRangesObj = dateRangeStart.map((s, i) => ({
        startDate: s,
        endDate: dateRangeEnd[i],
        dateInterval: rangeInterval[i]
      }))
      if (wvLayer.period === 'subdaily') {
        await fs.writeFileSync(`build/options/config/dateRanges/${wvLayer.id}.json`, JSON.stringify(dateRangesObj, null, 2))
      } else {
        wvLayer.dateRanges = dateRangesObj
      }
    }
  } catch (e) {
    throw new Error(`Error processing temporal layer ${wvLayer.id}: ${e}`)
  }
  return wvLayer
}

module.exports = {
  processTemporalLayer
}

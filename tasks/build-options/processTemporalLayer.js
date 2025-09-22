const moment = require('moment')
const xml2js = require('xml2js')

const projDict = {
  'GIBS:geographic': 'epsg4326',
  'GIBS:arctic': 'epsg3413',
  'GIBS:antarctic': 'epsg3031'
}

function toList (val) {
  return val instanceof Array ? val : [val]
}

async function processTemporalLayer (wvLayer, value, source = 'GIBS:geographic') {
  const dateFormat = 'YYYY-MM-DD'
  const dateTimeFormat = 'YYYY-MM-DD HH:mm:ss'
  try {
    let ranges = toList(value)
    const describeDomainsUrl = `https://uat.gibs.earthdata.nasa.gov/wmts/${projDict[source]}/best/1.0.0/${wvLayer.id}/default/250m/all/all.xml`
    try {
      const describeDomainsResponse = await fetch(describeDomainsUrl)
      if (describeDomainsResponse?.ok) {
        const describeDomainsText = await describeDomainsResponse?.text?.() || ''
        const parser = new xml2js.Parser()
        const describeDomainsJson = await parser.parseStringPromise(describeDomainsText)
        const domain = describeDomainsJson?.Domains?.DimensionDomain?.[0]?.Domain?.[0] || ''
        const domains = domain.split(',')
        if (domains?.length) {
          const formattedDomains = domains.map((d) => {
            return {
              _text: d
            }
          })
          ranges = toList(formattedDomains)
        }
      }
    } catch (error) {
      console.error(`Error fetching ${describeDomainsUrl}: ${error}`)
    } finally {
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
      let startDate = moment.min()
      let endDate = moment.max()
      const dateRangeStart = []
      const dateRangeEnd = []
      const rangeInterval = []
      for (const range of ranges) {
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

        if (dateRangeStart.length && dateRangeEnd.length) {
          wvLayer.dateRanges = dateRangeStart.map((s, i) => ({
            startDate: s,
            endDate: dateRangeEnd[i],
            dateInterval: rangeInterval[i]
          }))
        }
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

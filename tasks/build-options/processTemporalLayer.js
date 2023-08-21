const moment = require('moment')

function toList (val) {
  return val instanceof Array ? val : [val]
}

async function processTemporalLayer (wvLayer, value) {
  const dateFormat = 'YYYY-MM-DD'
  const dateTimeFormat = 'YYYY-MM-DD HH:mm:ss'
  try {
    const ranges = toList(value)
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
  } catch (e) {
    throw new Error(`Error processing temporal layer: ${e}`)
  }
  return wvLayer
}

module.exports = {
  processTemporalLayer
}

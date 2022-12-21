const moment = require('moment')

function toList (val) {
  return val instanceof Array ? val : [val]
}

class ValueError extends Error {
  constructor (message) {
    super(message)
    this.name = 'ValueError'
  }
}

async function processTemporalLayer (wvLayer, value) {
  const dateFormat = 'YYYY-MM-DD'
  const timeFormat = 'HH:mm:ss'
  const dateTimeFormat = 'YYYY-MM-DD HH:mm:ss'
  try {
    const ranges = toList(value)
    if (ranges && ranges[0] && ranges[0]._text && ranges[0]._text.includes('T')) {
      console.warn(ranges[0]._text)
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
        if (startDate) {
          const startDateParse = moment(start, dateFormat)
          dateRangeStart.push(
            `${startDateParse.format(dateFormat)}T${startDateParse.format(
              timeFormat
            )}Z`
          )
        }
        if (endDate) {
          const endDateParse = moment(end, dateFormat)
          dateRangeEnd.push(
            `${endDateParse.format(dateFormat)}T${endDateParse.format(
              timeFormat
            )}Z`
          )
        }
        if (interval !== 'P1D') {
          endDate = moment(endDate).add(moment.duration(interval))
        }
        const regex = new RegExp(/\d+/g)
        const match = regex.exec(interval)
        rangeInterval.push(match)
      } else {
        // Subdaily Layers
        const startTime = start.replace('T', ' ').replace('Z', '')
        const endTime = end.replace('T', ' ').replace('Z', '')
        startDate = moment.min(startDate, moment(startTime, dateTimeFormat))
        endDate = moment.max(endDate, moment(endTime, dateTimeFormat))

        if (startDate) {
          const startTimeParse = moment(startTime, dateTimeFormat)
          dateRangeStart.push(startTimeParse.format(`${dateFormat}T${timeFormat}Z`))
        }
        if (endDate) {
          const endTimeParse = moment(endTime, dateTimeFormat)
          dateRangeEnd.push(endTimeParse.format(`${dateFormat}T${timeFormat}Z`))
        }

        rangeInterval.push(interval.match(/\d+/)[0])
      }

      wvLayer.startDate = moment(startDate).format(`${dateFormat}T${timeFormat}Z`)
      if (!endDate.isSame(moment.min())) {
        wvLayer.endDate = moment(endDate).format(`${dateFormat}T${timeFormat}Z`)
      }
      if (dateRangeStart.length && dateRangeEnd.length) {
        wvLayer.dateRanges = dateRangeStart.map((s, i) => ({
          startDate: s,
          endDate: dateRangeEnd[i],
          dateInterval: rangeInterval[i]
        }))
      }
    }
  } catch (e) {
    if (e instanceof ValueError) {
      throw new Error(`Invalid time: ${range}`)
    }
    throw new Error(`Error processing temporal layer: ${e}`)
  }
  return wvLayer
}

module.exports = {
  processTemporalLayer
}

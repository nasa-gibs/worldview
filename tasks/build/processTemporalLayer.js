const moment = require('moment')
const re = require('regex-parser')

function toList (val) {
  return val instanceof Array ? val : [val]
}

function processTemporal (wvLayer, value) {
  const dateFormat = 'YYYY-MM-DD'
  const timeFormat = 'HH:mm:ss'
  const dateTimeFormat = 'YYYY-MM-DD HH:mm:ss'
  try {
    const ranges = toList(value)
    if (ranges[0].includes('T')) {
      wvLayer.period = 'subdaily'
    } else {
      if (ranges[0].endsWith('Y')) {
        wvLayer.period = 'yearly'
      } else if (ranges[0].endsWith('M')) {
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
      const [start, end, interval] = range.split('/')
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
          endDate = moment(endDate).add(moment.duration(interval)).toDate()
        }
        rangeInterval.push(re.parse(interval).match)
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

        rangeInterval.push(re.search(/\d+/, interval).group())
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
  processTemporal
}

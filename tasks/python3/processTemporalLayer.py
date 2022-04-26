from datetime import datetime
import isodate
import re
import traceback

def to_list(val):
    return [val] if not hasattr(val, 'reverse') else val

# Add duration to end date using
# ISO 8601 duration keys
def determine_end_date(key, date):
    return date + isodate.parse_duration(key)

# This method takes a layer and a temporal
# value and tranlates it to start and end dates
def process_temporal(wv_layer, value):
    dateFormat = "%Y-%m-%d"
    timeFormat = "%H:%M:%S"
    dateTimeFormat = "%Y-%m-%d %H:%M:%S"
    try:
        ranges = to_list(value)
        if "T" in ranges[0]:
            wv_layer["period"] = "subdaily"

        else:
            if ranges[0].endswith("Y"):
                wv_layer["period"] = "yearly"
            elif ranges[0].endswith("M"):
                wv_layer["period"] = "monthly"
            else:
                wv_layer["period"] = "daily"
        start_date = datetime.max
        end_date = datetime.min
        date_range_start, date_range_end, range_interval = [], [], []

        for range in ranges:
            start, end, interval = range.split('/')
            if wv_layer["period"] == "daily" \
            or wv_layer["period"] == "monthly" \
            or wv_layer["period"] == "yearly":
                start_date = min(start_date, datetime.strptime(start, dateFormat))
                end_date = max(end_date, datetime.strptime(end, dateFormat))
                if start_date:
                    startDateParse = datetime.strptime(start, dateFormat)
                    date_range_start.append(startDateParse.strftime(dateFormat) + "T" + startDateParse.strftime(timeFormat) + "Z")
                if end_date:
                    endDateParse = datetime.strptime(end, dateFormat)
                    date_range_end.append(endDateParse.strftime(dateFormat) + "T" + endDateParse.strftime(timeFormat) + "Z")
                if interval != "P1D":
                    end_date = determine_end_date(interval, end_date)
                range_interval.append(re.search(r'\d+', interval).group())

            # Subdaily Layers
            else:
                startTime = start.replace('T', ' ').replace('Z', '')
                endTime = end.replace('T', ' ').replace('Z', '')
                start_date = min(start_date, datetime.strptime(startTime, dateTimeFormat))
                end_date = max(end_date, datetime.strptime(endTime, dateTimeFormat))

                if start_date:
                    startTimeParse = datetime.strptime(startTime, dateTimeFormat)
                    date_range_start.append(startTimeParse.strftime(dateFormat) + "T" + startTimeParse.strftime(timeFormat) + "Z")
                if end_date:
                    endTimeParse = datetime.strptime(endTime, dateTimeFormat)
                    date_range_end.append(endTimeParse.strftime(dateFormat) + "T" + endTimeParse.strftime(timeFormat) + "Z")

                range_interval.append(re.search(r'\d+', interval).group())

            wv_layer["startDate"] = start_date.strftime(dateFormat) + "T" + start_date.strftime(timeFormat) + "Z"
            if end_date != datetime.min:
                wv_layer["endDate"] = end_date.strftime(dateFormat) + "T" + end_date.strftime(timeFormat) + "Z"
            if date_range_start and date_range_end:
                wv_layer["dateRanges"] = [{"startDate": s, "endDate": e, "dateInterval": i} for s, e, i in zip(date_range_start, date_range_end, range_interval)]
    except ValueError:
        raise Exception("Invalid time: {0}".format(range))
    except Exception as e:
        print(traceback.format_exc())
        raise Exception("Error processing temporal layer: {0}".format(e))
    return wv_layer

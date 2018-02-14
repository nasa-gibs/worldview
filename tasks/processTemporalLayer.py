from datetime import datetime, date, timedelta
import isodate
import json

def to_list(val):
    return [val] if not hasattr(val, 'reverse') else val

# Add duration to end date using
# ISO 8601 duration keys
def determine_end_date(key, date):
    return date + isodate.parse_duration(key)

# This method takes a layer and a temporal
# value and tranlates it to start and end dates
def process_temporal(wv_layer, value):
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
        date_range_start, date_range_end = [], []
        for range in ranges:
            times = range.split('/')
            if wv_layer["period"] == "daily" \
            or wv_layer["period"] == "monthly" \
            or wv_layer["period"] == "yearly":
                start_date = min(start_date,
                    datetime.strptime(times[0], "%Y-%m-%d"))
                end_date = max(end_date,
                    datetime.strptime(times[1], "%Y-%m-%d"))
                if start_date:
                    date_range_start.append(start_date.strftime("%Y-%m-%d"))
                if end_date:
                    date_range_end.append(end_date.strftime("%Y-%m-%d"))
                if times[2] != "P1D":
                    end_date = determine_end_date(times[2], end_date)
            else:
                startDate = times[0].replace('T', ' ').replace('Z', '')
                endDate = times[1].replace('T', ' ').replace('Z', '')
                start_date = min(start_date,
                    datetime.strptime(startDate, "%Y-%m-%d %H:%M:%S"))
                end_date = max(end_date,
                    datetime.strptime(endDate, "%Y-%m-%d %H:%M:%S"))
                if start_date:
                    date_range_start.append(start_date.strftime("%Y-%m-%d %H:%M:%S"))
                if end_date:
                    date_range_end.append(end_date.strftime("%Y-%m-%d %H:%M:%S"))

            # This will need to be updates to include subdaily values
            # when granule support is in
            wv_layer["startDate"] = start_date.strftime("%Y-%m-%d")
            if end_date != datetime.min:
                wv_layer["endDate"] = end_date.strftime("%Y-%m-%d")
            if date_range_start and date_range_end:
                wv_layer["allDateRanges"] = [{"startDate": s, "endDate": e} for s, e in zip(date_range_start, date_range_end)]
    except ValueError:
        raise
        raise Exception("Invalid time: {0}".format(range))
    return wv_layer

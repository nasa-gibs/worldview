from datetime import datetime, date, timedelta
import isodate

def to_list(val):
    return [val] if not hasattr(val, 'reverse') else val

def determine_end_date(key, date):
    # Add duration to end date
    return date + isodate.parse_duration(key)

def process_temporal(wv_layer, value):
    try:
        ranges = to_list(value)
        if "T" in ranges[0]:
            wv_layer["period"] = "subdaily"
        else:
            wv_layer["period"] = "daily"
        start_date = datetime.max;
        end_date = datetime.min;
        for range in ranges:
            times = range.split('/')
            if wv_layer["period"] == "daily":
                start_date = min(start_date,
                    datetime.strptime(times[0], "%Y-%m-%d"))
                end_date = max(end_date,
                    datetime.strptime(times[1], "%Y-%m-%d"))
                if times[2] != "P1D":
                    end_date = determine_end_date(times[2], end_date)
            else:
                startDate = times[0].replace('T', ' ').replace('Z','')
                endDate = times[1].replace('T', ' ').replace('Z','')
                start_date = min(start_date,
                    datetime.strptime(startDate, "%Y-%m-%d %H:%M:%S"))
                end_date = max(end_date,
                    datetime.strptime(endDate, "%Y-%m-%d %H:%M:%S"))

            # This will need to be updates to include subdaily values
            # when granule support is in
            wv_layer["startDate"] = start_date.strftime("%Y-%m-%d")
            if end_date != datetime.min:
                wv_layer["endDate"] = end_date.strftime("%Y-%m-%d")
    except ValueError:
        raise
        raise Exception("Invalid time: {0}".format(range))
    return wv_layer
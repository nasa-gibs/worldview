from concurrent.futures import ThreadPoolExecutor
from time import sleep
import requests
from datetime import datetime
from datetime import timedelta
import json
import os
import sys
import shutil

arctic_bad_size = 28726
antarctic_bad_size = 5988
geographic_bad_size = 34598
bad_snapshots = []
total_layer_count = 0
complete_layer_count = 0
time_format = "%Y-%m-%dT%H:%M:%SZ"
snapshotsUrl = 'https://wvs.earthdata.nasa.gov/api/v1/snapshot?'
param_dict = {
  'base': {
    'REQUEST': 'GetSnapshot',
    'FORMAT': 'image/jpeg',
  },
  'geographic': {
    'BBOX': '-90,-180,90,180',
    'CRS': 'EPSG:4326',
    'WIDTH': '768',
    'HEIGHT': '384',
    'AUTOSCALE': 'TRUE'
  },
  'arctic': {
    'BBOX': '-4195000,-4195000,4195000,4195000',
    'CRS': 'EPSG:3413',
    'WIDTH': '615',
    'HEIGHT': '615',
    'AUTOSCALE': 'FALSE'
  },
  'antarctic': {
    'BBOX': '-4195000,-4195000,4195000,4195000',
    'CRS': 'EPSG:3031',
    'WIDTH': '615',
    'HEIGHT': '615',
    'AUTOSCALE': 'FALSE'
  }
}

def prepare_dirs():
  shutil.rmtree('./web/images/layers/previews/')
  os.makedirs('./web/images/layers/previews/geographic')
  os.makedirs('./web/images/layers/previews/arctic')
  os.makedirs('./web/images/layers/previews/antarctic')


def get_best_date(period, date_ranges):
  last_range_idx = len(date_ranges) - 1
  start_date = date_ranges[last_range_idx]['startDate']
  end_date = date_ranges[last_range_idx]['endDate']
  interval = int(date_ranges[last_range_idx]['dateInterval'])

  if (period == "daily"):
    parsed_start_date = datetime.strptime(start_date, time_format)
    parsed_end_date = datetime.strptime(end_date, time_format)

    # Go back a few more days for single day layers
    if (interval == 1):
      interval = 3

    altered_date = parsed_end_date - timedelta(days=interval)

    if (altered_date >= parsed_start_date):
      date = datetime.strftime(altered_date, time_format)
    else:
      date = end_date
  else:
    date = end_date

  return date


def get_snapshots(layer):
  global complete_layer_count, total_layer_count

  for projection in layer['projections'].keys():
    fileName = './web/images/layers/previews/' + projection + '/' + layer['id'] + '.jpg'
    params = { **param_dict['base'], **param_dict[projection] }
    date_ranges = layer.get('dateRanges')
    if (date_ranges):
      params['TIME'] = get_best_date(layer['period'], date_ranges)
    params['LAYERS'] = layer['id'] + ',Coastlines'

    try:
      with open(fileName, 'xb') as imageFile:
        image_req = requests.get(snapshotsUrl, params=params)
        imageFile.write(image_req.content)
        size = imageFile.tell()
        complete_layer_count += 1
        percent_complete = round((complete_layer_count / total_layer_count)*100, 1)
        sys.stdout.write('\r')
        sys.stdout.write('Progress: ' + str(percent_complete) + '%')
        sys.stdout.flush()

        # A blank snapshot with only 'Coastlines' in each projection
        if (size == geographic_bad_size or size == arctic_bad_size or size == antarctic_bad_size):
          bad_snapshots.append({
            'id': layer['id'],
            'projection': projection,
            'url': image_req.url
          })

    except Exception as e:
      print(e)


if __name__ == "__main__":
  prepare_dirs()

  with open('./build/options/config/wv.json', 'rt') as wv_json:
    wv_json_dict = json.load(wv_json)
    layers = wv_json_dict['layers']
    for layer in layers.values():
      for proj in layer['projections']:
        total_layer_count += 1

  futures = []
  with ThreadPoolExecutor() as executor:
    for layer in layers.values():
      futures.append(executor.submit(get_snapshots, layer))

  for f in futures:
    try:
      f.result()
    except Exception as e:
      print(e)

  print('\rWARNING: The number of "blank" snapshots was:', len(bad_snapshots))
  for bad_layer in bad_snapshots:
    print(bad_layer['projection'], ' ', bad_layer['id'])
    print(bad_layer['url'] + '\n')
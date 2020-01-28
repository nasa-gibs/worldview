from concurrent.futures import ThreadPoolExecutor
from time import sleep
import requests
from datetime import datetime
from datetime import timedelta
import json
import os
import sys
import shutil


# Coastlines Only sizes
# arctic_bad_size = 28726
# antarctic_bad_size = 5988
# geographic_bad_size = 34598

# SCAR/OSM Land_Water_Map Only
arctic_bad_size = 13544
antarctic_bad_size = 4060
geographic_bad_size = 12088

override_dates_dict = {}
bad_snapshots = []
total_layer_count = 0
complete_layer_count = 0
time_format = "%Y-%m-%dT%H:%M:%SZ"
snapshotsUrl = 'https://wvs.earthdata.nasa.gov/api/v1/snapshot?'
param_dict = {
  'base': {
    'REQUEST': 'GetSnapshot',
    'FORMAT': 'image/jpeg',
    'OPACITIES': '0.50,1'
  },
  'geographic': {
    'BBOX': '-90,-180,90,180',
    'CRS': 'EPSG:4326',
    'WIDTH': '768',
    'HEIGHT': '384'
  },
  'arctic': {
    'BBOX': '-4195000,-4195000,4195000,4195000',
    'CRS': 'EPSG:3413',
    'WIDTH': '512',
    'HEIGHT': '512'
  },
  'antarctic': {
    'BBOX': '-4195000,-4195000,4195000,4195000',
    'CRS': 'EPSG:3031',
    'WIDTH': '512',
    'HEIGHT': '512'
  }
}
root_img_dir = './build/options-build/preview-images/'
dest_img_dir = './web/images/layers/previews/'
# reference_layer = 'Coastlines'
reference_layers = {
  'geographic': 'OSM_Land_Water_Map',
  'arctic': 'OSM_Land_Water_Map',
  'antarctic': 'SCAR_Land_Water_Map'
}


def prepare_dirs():
  geo_path = root_img_dir + 'geographic'
  arctic_path = root_img_dir + 'arctic'
  antarctic_path = root_img_dir + 'antarctic'

  if (os.path.exists(root_img_dir)):
    shutil.rmtree(root_img_dir)

  if not (os.path.exists(geo_path)):
    os.makedirs(geo_path)
  if not (os.path.exists(arctic_path)):
    os.makedirs(arctic_path)
  if not (os.path.exists(antarctic_path)):
    os.makedirs(antarctic_path)


def get_best_date(projection, period, date_ranges):
  last_range_idx = len(date_ranges) - 1
  start_date = date_ranges[last_range_idx].get('startDate')
  end_date = date_ranges[last_range_idx].get('endDate')
  parsed_start_date = datetime.strptime(start_date, time_format)
  parsed_end_date = datetime.strptime(end_date, time_format)
  interval = int(date_ranges[last_range_idx]['dateInterval'])

  # Handle daily layers
  if (period == "daily"):
    # Go back a few more days for single day layers
    if (interval == 1):
      interval = 3

    altered_date = parsed_end_date - timedelta(days=interval)

    if (altered_date >= parsed_start_date):
      date = datetime.strftime(altered_date, time_format)
    else:
      date = end_date

  # Go back ~6 months for arctic layers
  elif (projection == "arctic"):
    altered_date = parsed_end_date - timedelta(weeks=26)

    if (altered_date >= parsed_start_date):
      date = datetime.strftime(altered_date, time_format)
    else:
      date = end_date

  # For everything else just use the end date of the last range
  else:
    date = end_date

  return date


def get_time_param(projection, layer_id, layer, params):
  # Only include TIME param for temporal layers
  date_ranges = layer.get('dateRanges')
  start_date = layer.get('startDate')
  period = layer.get('period')

  if (date_ranges):
    params['TIME'] = get_best_date(projection, period, date_ranges)
  elif (start_date):
    params['TIME'] = start_date

  # Use any configured override dates
  if (override_dates_dict.get(layer_id)):
    params['TIME'] = override_dates_dict[layer_id]


def get_snapshots(layer):
  global complete_layer_count, total_layer_count

  for projection, proj_dict in layer['projections'].items():
    reference_layer = reference_layers[projection]
    # Somtimes a layer id is provided per projection (e.g. Land Mask layers)
    if (proj_dict.get('layer')):
      layer_id = proj_dict.get('layer')
    else:
      layer_id = layer['id']
    params = { **param_dict['base'], **param_dict[projection] }
    get_time_param(projection, layer_id, layer, params)

    params['LAYERS'] = layer_id
    if (layer_id is not reference_layer):
      params['LAYERS'] = (reference_layer + ',' + layer_id)
    file_name = root_img_dir + projection + '/' + layer_id + '.jpg'
    dest_file_name = dest_img_dir + projection + '/' + layer_id + '.jpg'

    # Only get images that we don't have already
    # if (os.path.exists(dest_file_name)):
    #   continue

    try:
      with open(file_name, 'xb') as imageFile:
        image_req = requests.get(snapshotsUrl, params=params)
        imageFile.write(image_req.content)
        size = imageFile.tell()
        complete_layer_count += 1
        percent_complete = round((complete_layer_count / total_layer_count)*100, 1)
        sys.stdout.write('\r')
        sys.stdout.write('Progress: ' + str(percent_complete) + '%')
        sys.stdout.flush()

        if (layer_id == reference_layers[projection]):
          continue

        # A blank snapshot with only reference_layer in each projection
        if (size == geographic_bad_size or size == arctic_bad_size or size == antarctic_bad_size):
          bad_snapshots.append({
            'id': layer_id,
            'projection': projection,
            'url': image_req.url
          })

    except Exception as e:
      print(e)



if __name__ == "__main__":
  prepare_dirs()

  # Allow manual configuration of layer ID to specific date to generate desired preview
  with open('./tasks/python3/previewLayerOverrides.json', 'rt') as overrides_json:
    override_dates_dict = json.load(overrides_json)

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
      # Need to call result() on each future to catch any raised exceptions
      f.result()
    except Exception as e:
      print(e)

  print('\rWARNING: The number of "blank" snapshots was:', len(bad_snapshots))
  for bad_layer in bad_snapshots:
    print(bad_layer['projection'], ' ', bad_layer['id'])
    print(bad_layer['url'] + '\n')
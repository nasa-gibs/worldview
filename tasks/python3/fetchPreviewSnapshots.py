#!/usr/bin/env python

from concurrent.futures import ThreadPoolExecutor
from optparse import OptionParser
import requests
from datetime import datetime
from datetime import timedelta
import json
import os
import sys

prog = os.path.basename(__file__)
parser = OptionParser(usage="Usage: %s <wv.json> <overrides_file>" % prog)
(options, args) = parser.parse_args()
wv_json_file = args[0]
overrides_file = args[1]
features_file = args[2]

override_dates_dict = {}
bad_snapshots = []
total_success_count = 0
total_failure_count = 0
time_format = "%Y-%m-%dT%H:%M:%SZ"
snapshots_url = ''
param_dict = {
  'base': {
    'REQUEST': 'GetSnapshot',
    'FORMAT': 'image/jpeg'
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
# These layers should not be combined with the reference layer
standalone_layers = [
  'Graticule',
  'Coastlines',
  'Reference_Features',
  'Reference_Labels'
]
dest_img_dir = './web/images/layers/previews/'
reference_layers = {
  'geographic': 'OSM_Land_Water_Map',
  'arctic': 'OSM_Land_Water_Map',
  'antarctic': 'SCAR_Land_Water_Map'
}
current = datetime.now()


def track_bad_snapshots(layer_id, projection, request, img_file):
  global bad_snapshots

  # File sizes with SCAR/OSM Land_Water_Map layer only
  arctic_bad_size = 9949
  antarctic_bad_size = 4060
  geographic_bad_size = 12088
  size = img_file.tell()

  if size in [ geographic_bad_size, arctic_bad_size, antarctic_bad_size ]:
    bad_snapshots.append({
      'id': layer_id,
      'projection': projection,
      'url': request.url
    })


def get_best_date(projection, period, date_ranges):
  global current
  last_range = date_ranges[len(date_ranges) - 1]
  start_date = last_range.get('startDate')
  end_date = last_range.get('endDate')
  parsed_start_date = datetime.strptime(start_date, time_format)
  parsed_end_date = datetime.strptime(end_date, time_format)
  p_year = parsed_end_date.year
  p_month = parsed_end_date.month
  interval = int(last_range.get('dateInterval'))
  altered_date = None

  # Handle daily layers
  if (period == "daily"):
    # Go back a few more days for single day layers since something
    # too recent may not be processed yet
    if (interval == 1):
      interval = 3
    altered_date = parsed_end_date - timedelta(days=interval)

  # Choose a good daylight month for arctic
  if projection == "arctic" and p_month not in [4, 5, 6, 7, 8, 9]:
    if p_year == current.year and current.month < 6:
      altered_date = parsed_end_date.replace(day=1, month=6, year=current.year-1)
    else:
      altered_date = parsed_end_date.replace(day=1, month=6)

  # Choose a good daylight month for antarctic
  if projection == "antarctic" and p_month not in [10, 11, 12, 1, 2]:
    # TODO handle "bad" months for antarctic
    altered_date = parsed_end_date.replace(month=12)

  # Make sure modified date isn't out of layer date range
  if altered_date and altered_date >= parsed_start_date:
    date = datetime.strftime(altered_date, time_format)
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
  global total_failure_count
  global total_success_count
  for projection, proj_dict in layer['projections'].items():
    reference_layer = reference_layers[projection]

    # Sometimes a layer id is provided per projection (e.g. Land Mask layers)
    # We need to use this layer id to request the layer from WVS/GIBS
    # But, we need to use the WV id as the file name (since that's how we will look up the image in WV)
    if (proj_dict.get('layer')):
      gibs_layer_id = proj_dict.get('layer')
      wv_layer_id = layer['id']
    else:
      gibs_layer_id = wv_layer_id = layer['id']

    params = { **param_dict['base'], **param_dict[projection] }
    get_time_param(projection, wv_layer_id, layer, params)

    if (gibs_layer_id is not reference_layer and gibs_layer_id not in standalone_layers):
      params['LAYERS'] = (reference_layer + ',' + gibs_layer_id)
      params['OPACITIES'] = '0.50,1'
    else:
      params['LAYERS'] = gibs_layer_id

    dest_file_name = dest_img_dir + projection + '/' + wv_layer_id + '.jpg'

    # Only get images that we don't have already
    if (os.path.exists(dest_file_name)):
      continue

    try:
      image_req = requests.get(snapshots_url, params=params)
      if image_req.status_code is 200:
        status_text = 'SUCCESS'
        total_success_count += 1
        with open(dest_file_name, 'xb') as image_file:
          image_file.write(image_req.content)
          if (gibs_layer_id == reference_layers[projection]):
            continue
          track_bad_snapshots(wv_layer_id, projection, image_req, image_file)
      else:
        total_failure_count += 1
        status_text = 'ERROR'
      print("\n%s: Result: %s - %s" % (prog, status_text, image_req.status_code))
      print("%s: Layer: %s" % (prog, wv_layer_id))
      print("%s: URL: %s" % (prog, image_req.url))

    except Exception as e:
      print("%s ERROR: %s" % (prog, e))


if __name__ == "__main__":
  # Check to see if this feature is enabled in features.json before continuing
  with open(features_file, 'rt') as features_json:
    features_dict = json.load(features_json)
    if features_dict['features']['previewSnapshots'] is False:
      sys.exit();

  # Allow manual configuration of layer ID to specific date to generate desired preview
  with open(overrides_file, 'rt') as overrides_json:
    override_dates_dict = json.load(overrides_json)

  with open(wv_json_file, 'rt') as wv_json:
    wv_json_dict = json.load(wv_json)
    layers = wv_json_dict['layers']
    snapshots_url = wv_json_dict['features']['imageDownload']['url']
    fetch_snapshots = wv_json_dict['features']['previewSnapshots']
    if not fetch_snapshots:
      print("%s: Layer preview fetching disabled.  Exiting." % prog)
      sys.exit()

  futures = []
  with ThreadPoolExecutor() as executor:
    for layer in layers.values():
      futures.append(executor.submit(get_snapshots, layer))
  for f in futures:
    try:
      # Need to call result() on each future to catch any raised exceptions
      f.result()
    except Exception as e:
      print("%s:" % (e))

  if len(bad_snapshots) > 0:
    print("\n%s: WARNING: %s snapshots returned no content.  See below for details: " % (prog, len(bad_snapshots)))
    for bad_layer in bad_snapshots:
      print("\n\t Layer: %s" % bad_layer['id'])
      print("\t URL: %s" % (bad_layer['url']))

  if total_success_count > 0:
    print('\n%s: Successfully retrieved %s snapshots!' % (prog, total_success_count))
  if total_failure_count > 0:
    print('\n%s: WARNING: Failed to retrieve %s snapshots!' % (prog, total_failure_count))
  if total_failure_count is 0 and total_success_count is 0:
    print('\n%s: No snapshots were retrieved.  All layers found in wv.json have existing preview images!' % (prog))
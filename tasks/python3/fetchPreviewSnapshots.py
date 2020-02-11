from concurrent.futures import ThreadPoolExecutor
from time import sleep
import requests
from datetime import datetime
from datetime import timedelta
import json

override_dates_dict = {}
bad_snapshots = []
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


def track_bad_snapshots(layer_id, projection, request_url, size):
  global bad_snapshots
  # File sizes with SCAR/OSM Land_Water_Map layer only
  arctic_bad_size = 9949
  antarctic_bad_size = 4060
  geographic_bad_size = 12088

  if size in [ geographic_bad_size, arctic_bad_size, antarctic_bad_size ]:
    bad_snapshots.append({
      'id': layer_id,
      'projection': projection,
      'url': request_url
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
  for projection, proj_dict in layer['projections'].items():
    reference_layer = reference_layers[projection]

    # Sometimes a layer id is provided per projection (e.g. Land Mask layers)
    if (proj_dict.get('layer')):
      layer_id = proj_dict.get('layer')
    else:
      layer_id = layer['id']

    params = { **param_dict['base'], **param_dict[projection] }
    get_time_param(projection, layer_id, layer, params)

    if (layer_id is not reference_layer and layer_id not in standalone_layers):
      params['LAYERS'] = (reference_layer + ',' + layer_id)
      params['OPACITIES'] = '0.50,1'
    else:
      params['LAYERS'] = layer_id

    dest_file_name = dest_img_dir + projection + '/' + layer_id + '.jpg'

    # Only get images that we don't have already
    if (os.path.exists(dest_file_name)):
      continue

    try:
      with open(dest_file_name, 'xb') as image_file:
        image_req = requests.get(snapshots_url, params=params)
        image_file.write(image_req.content)
        status_text = 'SUCCESS' if image_req.status_code is 200 else 'ERROR'
        print('\nResult: ', status_text, '-', image_req.status_code)
        print('Layer:', layer_id)
        print('URL: ', image_req.url)
        if (layer_id == reference_layers[projection]):
          continue
        track_bad_snapshots(layer_id, projection, image_req.url, image_file.tell())
    except Exception as e:
      print('ERROR:', e)


if __name__ == "__main__":

  # Allow manual configuration of layer ID to specific date to generate desired preview
  with open('./config/default/common/previewLayerOverrides.json', 'rt') as overrides_json:
    override_dates_dict = json.load(overrides_json)

  with open('./build/options/config/wv.json', 'rt') as wv_json:
    wv_json_dict = json.load(wv_json)
    layers = wv_json_dict['layers']
    snapshots_url = wv_json_dict['features']['imageDownload']['url']

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

if len(bad_snapshots) > 0:
  print('\nWARNING: The number of "blank" snapshots was:', len(bad_snapshots))
  for bad_layer in bad_snapshots:
    print('\n' + bad_layer['projection'])
    print(bad_layer['id'])
    print(bad_layer['url'])
